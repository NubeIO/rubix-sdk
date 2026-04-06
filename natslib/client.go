package natslib

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/nats-io/nats.go"
	"github.com/nats-io/nkeys"
)

// Client wraps a NATS connection with comprehensive features
// Includes core NATS, JetStream, ObjectStore, and KeyValue support
type Client struct {
	conn *nats.Conn
	js   nats.JetStreamContext
	url  string
}

// ConnectOptions provides configuration for NATS connection
type ConnectOptions struct {
	URL             string
	Name            string        // Connection name (default: "rubix")
	Timeout         time.Duration // Connection timeout (default: 10s)
	ReconnectWait   time.Duration // Time between reconnect attempts (default: 2s)
	MaxReconnects   int           // Max reconnect attempts (default: -1 unlimited)
	AuthToken       string        // For token-based authentication
	User            string        // For username/password authentication
	Password        string        // For username/password authentication
	CredsFile       string        // For NATS credentials file
	NKeyFile        string        // Path to NKey seed file (file path only — prevents seed leaks in logs/stack traces)
	InboxPrefix     string        // Custom inbox prefix for scoped replies (e.g., "_INBOX.device0")
	TLSConfig       *tls.Config   // For TLS authentication
	EnableJetStream bool          // Enable JetStream context (default: true)
}

// Connect creates a new NATS client connection with default options
func Connect(url string) (*Client, error) {
	return ConnectWithOptions(&ConnectOptions{
		URL:             url,
		Name:            "rubix",
		Timeout:         10 * time.Second,
		ReconnectWait:   2 * time.Second,
		MaxReconnects:   -1, // unlimited reconnects
		EnableJetStream: true,
	})
}

// ConnectWithOptions creates a new NATS client connection with custom options
func ConnectWithOptions(opts *ConnectOptions) (*Client, error) {
	// Set defaults
	if opts.Name == "" {
		opts.Name = "rubix"
	}
	if opts.Timeout == 0 {
		opts.Timeout = 10 * time.Second
	}
	if opts.ReconnectWait == 0 {
		opts.ReconnectWait = 2 * time.Second
	}
	if opts.MaxReconnects == 0 {
		opts.MaxReconnects = -1
	}

	// Build NATS options
	natsOptions := []nats.Option{
		nats.Name(opts.Name),
		nats.Timeout(opts.Timeout),
		nats.ReconnectWait(opts.ReconnectWait),
		nats.MaxReconnects(opts.MaxReconnects),
	}

	// Add authentication options
	if opts.AuthToken != "" {
		natsOptions = append(natsOptions, nats.Token(opts.AuthToken))
	}
	if opts.User != "" && opts.Password != "" {
		natsOptions = append(natsOptions, nats.UserInfo(opts.User, opts.Password))
	}
	if opts.CredsFile != "" {
		natsOptions = append(natsOptions, nats.UserCredentials(opts.CredsFile))
	}
	if opts.NKeyFile != "" {
		seed, err := os.ReadFile(opts.NKeyFile)
		if err != nil {
			return nil, fmt.Errorf("nats read nkey file: %w", err)
		}
		kp, err := nkeys.FromSeed(seed)
		if err != nil {
			return nil, fmt.Errorf("nats parse nkey seed: %w", err)
		}
		pub, err := kp.PublicKey()
		if err != nil {
			return nil, fmt.Errorf("nats nkey public key: %w", err)
		}
		natsOptions = append(natsOptions, nats.Nkey(pub, func(nonce []byte) ([]byte, error) {
			return kp.Sign(nonce)
		}))
	}
	if opts.InboxPrefix != "" {
		natsOptions = append(natsOptions, nats.CustomInboxPrefix(opts.InboxPrefix))
	}
	if opts.TLSConfig != nil {
		natsOptions = append(natsOptions, nats.Secure(opts.TLSConfig))
	}

	// Connect to NATS
	nc, err := nats.Connect(opts.URL, natsOptions...)
	if err != nil {
		return nil, fmt.Errorf("nats connect: %w", err)
	}

	// Try to create JetStream context
	var js nats.JetStreamContext
	if opts.EnableJetStream {
		js, err = nc.JetStream()
		if err != nil {
			// JetStream not available, but connection is still valid for core NATS
			return &Client{
				conn: nc,
				js:   nil,
				url:  opts.URL,
			}, nil
		}
	}

	return &Client{
		conn: nc,
		js:   js,
		url:  opts.URL,
	}, nil
}

// ====================
// Core NATS Methods
// ====================

// Publish sends a message without expecting a response
func (c *Client) Publish(subject string, data []byte) error {
	return c.conn.Publish(subject, data)
}

// PublishMsg publishes a NATS message
func (c *Client) PublishMsg(msg *nats.Msg) error {
	return c.conn.PublishMsg(msg)
}

// Request sends a request and waits for a response (request/reply pattern)
func (c *Client) Request(subject string, data []byte, timeout time.Duration) ([]byte, error) {
	msg, err := c.conn.Request(subject, data, timeout)
	if err != nil {
		return nil, fmt.Errorf("nats request: %w", err)
	}
	return msg.Data, nil
}

// RequestMsg sends a request message and waits for a response
func (c *Client) RequestMsg(msg *nats.Msg, timeout time.Duration) (*nats.Msg, error) {
	return c.conn.RequestMsg(msg, timeout)
}

// Subscribe subscribes to a subject with a handler function
func (c *Client) Subscribe(subject string, handler func(subject string, data []byte) ([]byte, error)) error {
	_, err := c.conn.Subscribe(subject, func(msg *nats.Msg) {
		// Call handler
		response, err := handler(msg.Subject, msg.Data)

		// Reply if this is a request (has Reply field)
		if msg.Reply != "" {
			if err != nil {
				// Send error response
				errMsg := []byte(fmt.Sprintf(`{"error":"%s"}`, err.Error()))
				_ = msg.Respond(errMsg)
			} else if response != nil {
				// Send success response only if handler returned data
				// Returning nil allows handlers to skip responding (e.g., when another subscriber should handle it)
				_ = msg.Respond(response)
			}
		}
	})

	if err != nil {
		return fmt.Errorf("nats subscribe: %w", err)
	}

	return nil
}

// SubscribeMsg subscribes with raw NATS message handler
func (c *Client) SubscribeMsg(subject string, handler nats.MsgHandler) (*nats.Subscription, error) {
	return c.conn.Subscribe(subject, handler)
}

// SubscribeWithRespond subscribes and automatically responds to requests
func (c *Client) SubscribeWithRespond(subject string, handler func(msg *nats.Msg) *nats.Msg) error {
	_, err := c.conn.Subscribe(subject, func(msg *nats.Msg) {
		// Process each message in its own goroutine for concurrency
		go func(m *nats.Msg) {
			responseMsg := handler(m)
			if responseMsg != nil && m.Reply != "" {
				_ = m.RespondMsg(responseMsg)
			}
		}(msg)
	})
	return err
}

// RequestAll sends a request and collects all responses within the timeout
func (c *Client) RequestAll(subject string, data []byte, timeout time.Duration) ([]*nats.Msg, error) {
	inbox := nats.NewInbox()
	sub, err := c.conn.SubscribeSync(inbox)
	if err != nil {
		return nil, err
	}
	defer sub.Unsubscribe()

	msg := &nats.Msg{
		Subject: subject,
		Reply:   inbox,
		Data:    data,
	}
	err = c.conn.PublishMsg(msg)
	if err != nil {
		return nil, err
	}

	var responses []*nats.Msg
	deadline := time.Now().Add(timeout)
	for {
		remaining := time.Until(deadline)
		if remaining <= 0 {
			break
		}
		msg, err := sub.NextMsg(remaining)
		if err != nil {
			if errors.Is(err, nats.ErrTimeout) {
				break
			}
			return nil, err
		}
		responses = append(responses, msg)
	}

	return responses, nil
}

// ====================
// JetStream Pub/Sub Methods
// ====================

// JetStreamPublish publishes a message to JetStream with guaranteed delivery
func (c *Client) JetStreamPublish(subject string, data []byte, opts ...nats.PubOpt) (*nats.PubAck, error) {
	if c.js == nil {
		return nil, errors.New("jetstream not enabled")
	}
	return c.js.Publish(subject, data, opts...)
}

// JetStreamPublishMsg publishes a NATS message to JetStream
func (c *Client) JetStreamPublishMsg(msg *nats.Msg, opts ...nats.PubOpt) (*nats.PubAck, error) {
	if c.js == nil {
		return nil, errors.New("jetstream not enabled")
	}
	return c.js.PublishMsg(msg, opts...)
}

// JetStreamSubscribe subscribes to a JetStream stream with manual ack
func (c *Client) JetStreamSubscribe(subject string, handler nats.MsgHandler, opts ...nats.SubOpt) (*nats.Subscription, error) {
	if c.js == nil {
		return nil, errors.New("jetstream not enabled")
	}
	return c.js.Subscribe(subject, handler, opts...)
}

// JetStreamQueueSubscribe subscribes with a queue group for load balancing
func (c *Client) JetStreamQueueSubscribe(subject, queue string, handler nats.MsgHandler, opts ...nats.SubOpt) (*nats.Subscription, error) {
	if c.js == nil {
		return nil, errors.New("jetstream not enabled")
	}
	return c.js.QueueSubscribe(subject, queue, handler, opts...)
}

// ====================
// JetStream Stream Management
// ====================

// CreateStream creates a JetStream stream
func (c *Client) CreateStream(config *nats.StreamConfig) (*nats.StreamInfo, error) {
	if c.js == nil {
		return nil, errors.New("jetstream not enabled")
	}
	return c.js.AddStream(config)
}

// UpdateStream updates an existing stream configuration
func (c *Client) UpdateStream(config *nats.StreamConfig) (*nats.StreamInfo, error) {
	if c.js == nil {
		return nil, errors.New("jetstream not enabled")
	}
	return c.js.UpdateStream(config)
}

// GetStream gets stream information
func (c *Client) GetStream(name string) (*nats.StreamInfo, error) {
	if c.js == nil {
		return nil, errors.New("jetstream not enabled")
	}
	return c.js.StreamInfo(name)
}

// DeleteStream deletes a JetStream stream
func (c *Client) DeleteStream(name string) error {
	if c.js == nil {
		return errors.New("jetstream not enabled")
	}
	return c.js.DeleteStream(name)
}

// ListStreams returns all stream names
func (c *Client) ListStreams() ([]string, error) {
	if c.js == nil {
		return nil, errors.New("jetstream not enabled")
	}
	var streams []string
	for name := range c.js.StreamNames() {
		streams = append(streams, name)
	}
	return streams, nil
}

// ====================
// JetStream Consumer Management
// ====================

// CreateConsumer creates a durable consumer on a stream
func (c *Client) CreateConsumer(stream string, config *nats.ConsumerConfig) (*nats.ConsumerInfo, error) {
	if c.js == nil {
		return nil, errors.New("jetstream not enabled")
	}
	return c.js.AddConsumer(stream, config)
}

// GetConsumer gets consumer information
func (c *Client) GetConsumer(stream, consumer string) (*nats.ConsumerInfo, error) {
	if c.js == nil {
		return nil, errors.New("jetstream not enabled")
	}
	return c.js.ConsumerInfo(stream, consumer)
}

// DeleteConsumer deletes a consumer from a stream
func (c *Client) DeleteConsumer(stream, consumer string) error {
	if c.js == nil {
		return errors.New("jetstream not enabled")
	}
	return c.js.DeleteConsumer(stream, consumer)
}

// ListConsumers returns all consumer names for a stream
func (c *Client) ListConsumers(stream string) ([]string, error) {
	if c.js == nil {
		return nil, errors.New("jetstream not enabled")
	}
	var consumers []string
	for name := range c.js.ConsumerNames(stream) {
		consumers = append(consumers, name)
	}
	return consumers, nil
}

// ====================
// JetStream ObjectStore Methods
// ====================

// CreateObjectStore creates an object store bucket
func (c *Client) CreateObjectStore(bucket string, config *nats.ObjectStoreConfig) error {
	if c.js == nil {
		return errors.New("jetstream not enabled")
	}

	_, err := c.js.ObjectStore(bucket)
	if err != nil {
		if config == nil {
			config = &nats.ObjectStoreConfig{
				Bucket: bucket,
			}
		}
		_, err = c.js.CreateObjectStore(config)
		if err != nil {
			return fmt.Errorf("create object store: %w", err)
		}
	}
	return nil
}

// PutObject uploads a file to the object store
func (c *Client) PutObject(bucket, name, filePath string, overwrite bool) error {
	if c.js == nil {
		return errors.New("jetstream not enabled")
	}

	store, err := c.js.ObjectStore(bucket)
	if err != nil {
		return fmt.Errorf("get object store: %w", err)
	}

	// Check if object exists
	obj, err := store.Get(name)
	if err == nil {
		obj.Close()
		if overwrite {
			err = store.Delete(name)
			if err != nil {
				return fmt.Errorf("delete existing object: %w", err)
			}
		} else {
			return nil // Object exists, don't overwrite
		}
	}

	file, err := os.Open(filePath)
	if err != nil {
		return fmt.Errorf("open file: %w", err)
	}
	defer file.Close()

	_, err = store.Put(&nats.ObjectMeta{Name: name}, file)
	if err != nil {
		return fmt.Errorf("put object: %w", err)
	}
	return nil
}

// PutObjectBytes uploads bytes to the object store
func (c *Client) PutObjectBytes(bucket, name string, data []byte, overwrite bool) error {
	if c.js == nil {
		return errors.New("jetstream not enabled")
	}

	store, err := c.js.ObjectStore(bucket)
	if err != nil {
		return fmt.Errorf("get object store: %w", err)
	}

	// Check if object exists
	obj, err := store.Get(name)
	if err == nil {
		obj.Close()
		if overwrite {
			err = store.Delete(name)
			if err != nil {
				return fmt.Errorf("delete existing object: %w", err)
			}
		} else {
			return nil // Object exists, don't overwrite
		}
	}

	_, err = store.PutBytes(name, data)
	if err != nil {
		return fmt.Errorf("put object bytes: %w", err)
	}
	return nil
}

// GetObject retrieves an object from the object store
func (c *Client) GetObject(bucket, name string) ([]byte, error) {
	if c.js == nil {
		return nil, errors.New("jetstream not enabled")
	}

	store, err := c.js.ObjectStore(bucket)
	if err != nil {
		return nil, fmt.Errorf("get object store: %w", err)
	}

	obj, err := store.Get(name)
	if err != nil {
		return nil, fmt.Errorf("get object: %w", err)
	}
	defer obj.Close()

	data, err := io.ReadAll(obj)
	if err != nil {
		return nil, fmt.Errorf("read object: %w", err)
	}

	return data, nil
}

// DownloadObject downloads an object to a file
func (c *Client) DownloadObject(bucket, name, destPath, destName string) error {
	if c.js == nil {
		return errors.New("jetstream not enabled")
	}

	store, err := c.js.ObjectStore(bucket)
	if err != nil {
		return fmt.Errorf("get object store: %w", err)
	}

	obj, err := store.Get(name)
	if err != nil {
		return fmt.Errorf("get object: %w", err)
	}
	defer obj.Close()

	// Ensure destination directory exists
	destInfo, err := os.Stat(destPath)
	if err != nil {
		if os.IsNotExist(err) {
			err = os.MkdirAll(destPath, os.ModePerm)
			if err != nil {
				return fmt.Errorf("create dest dir: %w", err)
			}
		} else {
			return err
		}
	} else if !destInfo.IsDir() {
		return fmt.Errorf("destination path %s is not a directory", destPath)
	}

	destFile := filepath.Join(destPath, destName)
	outFile, err := os.Create(destFile)
	if err != nil {
		return fmt.Errorf("create dest file: %w", err)
	}
	defer outFile.Close()

	_, err = io.Copy(outFile, obj)
	if err != nil {
		return fmt.Errorf("copy object: %w", err)
	}

	return nil
}

// ListObjects lists all objects in a bucket
func (c *Client) ListObjects(bucket string) ([]*nats.ObjectInfo, error) {
	if c.js == nil {
		return nil, errors.New("jetstream not enabled")
	}

	store, err := c.js.ObjectStore(bucket)
	if err != nil {
		return nil, fmt.Errorf("get object store: %w", err)
	}

	return store.List()
}

// DeleteObject deletes an object from the object store
func (c *Client) DeleteObject(bucket, name string) error {
	if c.js == nil {
		return errors.New("jetstream not enabled")
	}

	store, err := c.js.ObjectStore(bucket)
	if err != nil {
		return fmt.Errorf("get object store: %w", err)
	}

	err = store.Delete(name)
	if err != nil {
		return fmt.Errorf("delete object: %w", err)
	}
	return nil
}

// DeleteObjectStore deletes an entire object store bucket
func (c *Client) DeleteObjectStore(bucket string) error {
	if c.js == nil {
		return errors.New("jetstream not enabled")
	}

	err := c.js.DeleteObjectStore(bucket)
	if err != nil {
		return fmt.Errorf("delete object store: %w", err)
	}
	return nil
}

// ListObjectStores returns all object store bucket names
func (c *Client) ListObjectStores() ([]string, error) {
	if c.js == nil {
		return nil, errors.New("jetstream not enabled")
	}

	bucketsChan := c.js.ObjectStoreNames()
	var stores []string
	for bucket := range bucketsChan {
		stores = append(stores, bucket)
	}
	return stores, nil
}

// ====================
// JetStream KeyValue Store Methods
// ====================

// CreateKVStore creates a new KeyValue store bucket
func (c *Client) CreateKVStore(bucket string) error {
	if c.js == nil {
		return errors.New("jetstream not enabled")
	}

	store, err := c.js.KeyValue(bucket)
	if err != nil {
		if errors.Is(err, nats.ErrBucketNotFound) {
			// Bucket doesn't exist, create it
			_, err = c.js.CreateKeyValue(&nats.KeyValueConfig{
				Bucket: bucket,
			})
			if err != nil {
				return fmt.Errorf("create kv store: %w", err)
			}
			return nil
		}
		return fmt.Errorf("get kv store: %w", err)
	}

	// Store already exists
	if store != nil {
		return nil
	}

	return nil
}

// PutKV stores a key-value pair
func (c *Client) PutKV(bucket, key string, value []byte) error {
	if c.js == nil {
		return errors.New("jetstream not enabled")
	}

	kv, err := c.js.KeyValue(bucket)
	if err != nil {
		return fmt.Errorf("get kv store: %w", err)
	}

	_, err = kv.Put(key, value)
	if err != nil {
		return fmt.Errorf("put kv: %w", err)
	}
	return nil
}

// GetKV retrieves a value by key
func (c *Client) GetKV(bucket, key string) ([]byte, error) {
	if c.js == nil {
		return nil, errors.New("jetstream not enabled")
	}

	kv, err := c.js.KeyValue(bucket)
	if err != nil {
		return nil, fmt.Errorf("get kv store: %w", err)
	}

	entry, err := kv.Get(key)
	if err != nil {
		return nil, fmt.Errorf("get kv: %w", err)
	}

	return entry.Value(), nil
}

// GetKVKeys retrieves all keys in a bucket
func (c *Client) GetKVKeys(bucket string) ([]string, error) {
	if c.js == nil {
		return nil, errors.New("jetstream not enabled")
	}

	kv, err := c.js.KeyValue(bucket)
	if err != nil {
		return nil, fmt.Errorf("get kv store: %w", err)
	}

	keys, err := kv.Keys()
	if err != nil {
		return nil, fmt.Errorf("get keys: %w", err)
	}
	return keys, nil
}

// GetKVKeysByPrefix retrieves keys matching a prefix
func (c *Client) GetKVKeysByPrefix(bucket, prefix string) ([]string, error) {
	if c.js == nil {
		return nil, errors.New("jetstream not enabled")
	}

	kv, err := c.js.KeyValue(bucket)
	if err != nil {
		return nil, fmt.Errorf("get kv store: %w", err)
	}

	keys, err := kv.Keys()
	if err != nil {
		return nil, fmt.Errorf("get keys: %w", err)
	}

	var out []string
	for _, key := range keys {
		if strings.HasPrefix(key, prefix) {
			out = append(out, key)
		}
	}
	return out, nil
}

// GetKVBulk retrieves multiple key-value pairs
func (c *Client) GetKVBulk(bucket string, keys []string) (map[string][]byte, error) {
	if c.js == nil {
		return nil, errors.New("jetstream not enabled")
	}

	kv, err := c.js.KeyValue(bucket)
	if err != nil {
		return nil, fmt.Errorf("get kv store: %w", err)
	}

	results := make(map[string][]byte)
	for _, key := range keys {
		entry, err := kv.Get(key)
		if err != nil {
			if errors.Is(err, nats.ErrKeyNotFound) {
				results[key] = nil // Key doesn't exist
				continue
			}
			return nil, fmt.Errorf("get kv %s: %w", key, err)
		}
		results[key] = entry.Value()
	}

	return results, nil
}

// GetKVBulkByPrefix retrieves all key-value pairs matching a prefix
func (c *Client) GetKVBulkByPrefix(bucket, prefix string) (map[string][]byte, error) {
	keys, err := c.GetKVKeysByPrefix(bucket, prefix)
	if err != nil {
		return nil, err
	}
	return c.GetKVBulk(bucket, keys)
}

// DeleteKV deletes a key-value pair
func (c *Client) DeleteKV(bucket, key string) error {
	if c.js == nil {
		return errors.New("jetstream not enabled")
	}

	kv, err := c.js.KeyValue(bucket)
	if err != nil {
		return fmt.Errorf("get kv store: %w", err)
	}

	err = kv.Delete(key)
	if err != nil {
		return fmt.Errorf("delete kv: %w", err)
	}
	return nil
}

// DeleteKVAll deletes all key-value pairs in a bucket
func (c *Client) DeleteKVAll(bucket string) (int, error) {
	if c.js == nil {
		return 0, errors.New("jetstream not enabled")
	}

	kv, err := c.js.KeyValue(bucket)
	if err != nil {
		return 0, fmt.Errorf("get kv store: %w", err)
	}

	keys, err := kv.Keys()
	if err != nil {
		return 0, fmt.Errorf("get keys: %w", err)
	}

	count := 0
	for _, key := range keys {
		err = kv.Delete(key)
		if err == nil {
			count++
		}
	}

	return count, nil
}

// DeleteKVStore deletes an entire KeyValue store bucket
func (c *Client) DeleteKVStore(bucket string) error {
	if c.js == nil {
		return errors.New("jetstream not enabled")
	}

	err := c.js.DeleteKeyValue(bucket)
	if err != nil {
		return fmt.Errorf("delete kv store: %w", err)
	}
	return nil
}

// ====================
// Connection Management Methods
// ====================

// Close closes the NATS connection
func (c *Client) Close() {
	if c.conn != nil {
		c.conn.Close()
	}
}

// IsConnected returns true if connected to NATS
func (c *Client) IsConnected() bool {
	return c.conn != nil && c.conn.IsConnected()
}

// Flush flushes any buffered messages
func (c *Client) Flush() error {
	if c.conn == nil {
		return errors.New("not connected")
	}
	return c.conn.Flush()
}

// FlushTimeout flushes with a timeout
func (c *Client) FlushTimeout(timeout time.Duration) error {
	if c.conn == nil {
		return errors.New("not connected")
	}
	return c.conn.FlushTimeout(timeout)
}

// URL returns the NATS server URL
func (c *Client) URL() string {
	return c.url
}

// Conn returns the underlying NATS connection
func (c *Client) Conn() *nats.Conn {
	return c.conn
}

// JetStream returns the JetStream context (may be nil if JetStream not enabled)
func (c *Client) JetStream() nats.JetStreamContext {
	return c.js
}

// HasJetStream returns true if JetStream is available
func (c *Client) HasJetStream() bool {
	return c.js != nil
}

// ====================
// Helper Methods
// ====================

// SynchronousRequest sends a request and waits synchronously for response
func (c *Client) SynchronousRequest(subject string, data []byte, timeout time.Duration) (*nats.Msg, error) {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	msgChan := make(chan *nats.Msg, 1)
	errChan := make(chan error, 1)

	go func() {
		msg, err := c.conn.Request(subject, data, timeout)
		if err != nil {
			errChan <- err
			return
		}
		msgChan <- msg
	}()

	select {
	case <-ctx.Done():
		return nil, errors.New("request timeout")
	case err := <-errChan:
		return nil, err
	case msg := <-msgChan:
		return msg, nil
	}
}
