package natslib

import (
	"fmt"
	"time"

	"github.com/nats-io/nats.go"
)

// ExampleJetStreamSetup demonstrates how to set up JetStream for history sync
func ExampleJetStreamSetup() error {
	// Connect to NATS with JetStream enabled
	client, err := Connect("nats://localhost:4222")
	if err != nil {
		return fmt.Errorf("connect failed: %w", err)
	}
	defer client.Close()

	// Check if JetStream is available
	if !client.HasJetStream() {
		return fmt.Errorf("jetstream not available")
	}

	// Create stream for history sync
	streamConfig := &nats.StreamConfig{
		Name:        "RUBIX_HISTORIES_SYNC",
		Subjects:    []string{"rubix.v1.*.*.*.*.histories.sync"},
		Storage:     nats.FileStorage,
		Retention:   nats.WorkQueuePolicy,
		MaxAge:      7 * 24 * time.Hour, // 7 days
		MaxMsgSize:  10 * 1024 * 1024,   // 10MB
		Duplicates:  5 * time.Minute,    // Dedup window
		Description: "History sync between devices",
	}

	streamInfo, err := client.CreateStream(streamConfig)
	if err != nil {
		// Stream may already exist - try update
		streamInfo, err = client.UpdateStream(streamConfig)
		if err != nil {
			return fmt.Errorf("create/update stream: %w", err)
		}
	}

	fmt.Printf("Stream created: %s with %d messages\n", streamInfo.Config.Name, streamInfo.State.Msgs)
	return nil
}

// ExampleJetStreamPublish demonstrates publishing to JetStream
func ExampleJetStreamPublish() error {
	client, err := Connect("nats://localhost:4222")
	if err != nil {
		return err
	}
	defer client.Close()

	subject := "rubix.v1.global.org1.device-a.main.histories.sync"
	data := []byte(`{"syncType":"history","itemCount":100}`)

	// Publish with message ID for deduplication
	ack, err := client.JetStreamPublish(subject, data, nats.MsgId("msg-123"))
	if err != nil {
		return fmt.Errorf("publish failed: %w", err)
	}

	fmt.Printf("Published to stream: %s, sequence: %d\n", ack.Stream, ack.Sequence)
	return nil
}

// ExampleJetStreamSubscribe demonstrates subscribing with ACK/NACK
func ExampleJetStreamSubscribe() error {
	client, err := Connect("nats://localhost:4222")
	if err != nil {
		return err
	}
	defer client.Close()

	subject := "rubix.v1.global.org1.*.main.histories.sync"

	// Subscribe with durable consumer and manual ack
	_, err = client.JetStreamSubscribe(subject, func(msg *nats.Msg) {
		fmt.Printf("Received: %s\n", string(msg.Data))

		// Process message...
		// If successful:
		msg.Ack()

		// If failed (will retry):
		// msg.Nak()
	},
		nats.Durable("device-b-histories-consumer"),
		nats.ManualAck(),
		nats.AckWait(30*time.Second),
		nats.MaxDeliver(3),
	)

	if err != nil {
		return fmt.Errorf("subscribe failed: %w", err)
	}

	fmt.Println("Subscribed to JetStream stream")
	return nil
}

// ExampleStreamManagement demonstrates stream management operations
func ExampleStreamManagement() error {
	client, err := Connect("nats://localhost:4222")
	if err != nil {
		return err
	}
	defer client.Close()

	// List all streams
	streams, err := client.ListStreams()
	if err != nil {
		return err
	}
	fmt.Printf("Found %d streams: %v\n", len(streams), streams)

	// Get stream info
	streamInfo, err := client.GetStream("RUBIX_HISTORIES_SYNC")
	if err != nil {
		return err
	}
	fmt.Printf("Stream: %s, Messages: %d, Bytes: %d\n",
		streamInfo.Config.Name,
		streamInfo.State.Msgs,
		streamInfo.State.Bytes,
	)

	// List consumers
	consumers, err := client.ListConsumers("RUBIX_HISTORIES_SYNC")
	if err != nil {
		return err
	}
	fmt.Printf("Found %d consumers: %v\n", len(consumers), consumers)

	return nil
}
