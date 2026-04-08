package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	plmBootstrap "github.com/NubeIO/rubix-plm-plugin/internal/bootstrap"
	"github.com/NubeIO/rubix-plm-plugin/internal/hooks"
	"github.com/NubeIO/rubix-plm-plugin/internal/nodes"
	"github.com/NubeIO/rubix-sdk/bootstrap"
	"github.com/NubeIO/rubix-sdk/natssubject"
	"github.com/NubeIO/rubix-sdk/nodehooks"
	"github.com/NubeIO/rubix-sdk/pluginnode"
	"github.com/rs/zerolog"
)

func main() {
	// Parse command-line flags
	configPath := flag.String("config", "nats-config.json", "Path to nats-config.json (written by rubix server)")
	logLevel := flag.String("log", "info", "Log level (debug/info/warn/error)")
	// Legacy flags — used as fallback when nats-config.json doesn't exist
	legacyNatsURL := flag.String("nats", "", "NATS server URL (legacy, prefer nats-config.json)")
	legacyOrg := flag.String("org", "", "Organization ID (legacy)")
	legacyDevice := flag.String("device", "", "Device ID (legacy)")
	legacyPrefix := flag.String("prefix", "", "NATS subject prefix (legacy)")
	legacyVendor := flag.String("vendor", "", "Plugin vendor (legacy)")
	legacyName := flag.String("name", "", "Plugin name (legacy)")
	_ = flag.String("nats-creds", "", "ignored (legacy NKey flag)")
	flag.Parse()

	// Setup logger
	level, err := zerolog.ParseLevel(*logLevel)
	if err != nil {
		level = zerolog.InfoLevel
	}
	logger := zerolog.New(zerolog.ConsoleWriter{Out: os.Stderr, TimeFormat: time.Kitchen}).
		Level(level).
		With().Timestamp().Str("plugin", "plm").Logger()

	// Log working directory and config path for debugging
	cwd, _ := os.Getwd()
	logger.Info().Str("cwd", cwd).Str("configPath", *configPath).Msg("plugin process started")

	// Load config: prefer nats-config.json, fall back to CLI flags
	cfg, err := pluginnode.LoadConfig(*configPath)
	if err != nil {
		logger.Warn().Err(err).Str("cwd", cwd).Str("configPath", *configPath).Msg("nats-config.json not found, falling back to CLI flags")
		cfg = &pluginnode.PluginNATSConfig{
			NatsURL:    withDefault(*legacyNatsURL, "nats://localhost:4222"),
			OrgID:      withDefault(*legacyOrg, "org1"),
			DeviceID:   withDefault(*legacyDevice, "device0"),
			Prefix:     withDefault(*legacyPrefix, "rubix.v1.local"),
			Vendor:     withDefault(*legacyVendor, "nube"),
			PluginName: withDefault(*legacyName, "plm"),
		}
	} else {
		logger.Info().Str("natsURL", cfg.NatsURL).Str("user", cfg.Username).Bool("hasPassword", cfg.Password != "").Msg("loaded nats-config.json")
	}

	logger.Info().
		Str("nats", cfg.NatsURL).
		Str("org", cfg.OrgID).
		Str("device", cfg.DeviceID).
		Str("user", cfg.Username).
		Bool("hasPassword", cfg.Password != "").
		Msg("connecting to NATS")

	nc, err := cfg.Connect()
	if err != nil {
		logger.Fatal().Err(err).Str("nats", cfg.NatsURL).Str("user", cfg.Username).Msg("failed to connect to NATS")
	}
	defer nc.Close()
	logger.Info().Msg("connected to NATS")

	// Shared bootstrap client for hierarchy setup and hook lookups
	sb := natssubject.NewBuilder(cfg.Prefix, cfg.OrgID, cfg.DeviceID, "*")
	bootstrapClient := &bootstrap.Client{
		NC:      nc,
		Subject: sb,
	}

	// Register node CRUD hooks via NATS FIRST (before bootstrap)
	// This is required because bootstrap creates nodes, which triggers hooks
	logger.Info().Msg("registering node hooks...")
	plmHooks := hooks.NewPLMNodeHooks(bootstrapClient)
	hookSubjects := nodehooks.NewSubjectBuilder(cfg.Prefix, cfg.OrgID, cfg.DeviceID, cfg.Vendor, cfg.PluginName)
	hookHandler := nodehooks.NewNATSHandler(plmHooks, nc, hookSubjects)
	if err := hookHandler.RegisterAll(); err != nil {
		logger.Fatal().Err(err).Msg("failed to register node hooks")
	}
	defer hookHandler.Unsubscribe()

	// Node factory
	// Note: plm.service and plm.product migrated to core.service and core.product
	// with node profiles in config/nodes.yaml - no Go code needed!
	factory := func(nodeType string) pluginnode.PluginNode {
		switch nodeType {
		case "plm.products":
			return &nodes.ProductsCollectionNode{}
		case "plm.manufacturing-run":
			return &nodes.ManufacturingRunNode{}
		default:
			return nil
		}
	}

	// Start the plugin server BEFORE bootstrap
	// This ensures RPC handlers are ready when bootstrap creates nodes (which may trigger hooks/RPC)
	server, err := pluginnode.NewPluginServer(cfg.ToServerConfig(nc, factory, logger))
	if err != nil {
		logger.Fatal().Err(err).Msg("failed to create plugin server")
	}
	defer server.Close()

	logger.Info().Msg("plugin server started — ready to handle RPC and hooks")

	// Bootstrap PLM hierarchy (service + collections)
	// Use "*" for flowId because nodes endpoints don't include flowId in their URL path
	// RAS routing expects: rubix.v1.{scope}.{orgId}.{deviceId}.*.nodes.create
	// Wait for rubix core to be ready, then bootstrap hierarchy
	logger.Info().Msg("waiting for rubix core to be ready...")

	retryCallback := func(attempt int, nextDelay time.Duration) {
		logger.Info().
			Int("attempt", attempt).
			Str("nextRetry", nextDelay.String()).
			Msg("rubix core not ready, retrying...")
	}

	// Wait up to 5 minutes for server (0 = wait forever)
	maxWait := 5 * time.Minute

	// Construct plugin node ID (pattern: plugin_{vendor}.{name})
	// This is the auto-created node that represents this plugin in the tree
	pluginNodeID := fmt.Sprintf("plugin_%s.%s", cfg.Vendor, cfg.PluginName)
	logger.Info().Str("pluginNodeId", pluginNodeID).Msg("plugin node ID")

	logger.Info().Msg("bootstrapping PLM hierarchy...")
	ctx, cancel := context.WithTimeout(context.Background(), maxWait+30*time.Second)
	defer cancel()

	hierarchyIDs, err := plmBootstrap.EnsurePLMHierarchyWithRetry(ctx, bootstrapClient, pluginNodeID, maxWait, retryCallback)
	if err != nil {
		logger.Error().Err(err).Msg("failed to bootstrap PLM hierarchy - plugin will start but nodes may not be initialized")
	} else {
		logger.Info().
			Str("serviceId", hierarchyIDs["service"]).
			Str("productsId", hierarchyIDs["products"]).
			Msg("PLM hierarchy ready")
	}

	logger.Info().Msg("PLM plugin started — product nodes ready + CRUD hooks active")

	// Wait for shutdown signal
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)
	<-sigCh
	logger.Info().Msg("shutdown signal received")
}

func withDefault(val, fallback string) string {
	if val != "" {
		return val
	}
	return fallback
}
