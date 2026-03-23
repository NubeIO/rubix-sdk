package main

import (
	"flag"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/NubeIO/rubix-github-plugin/internal/nodes"
	"github.com/NubeIO/rubix-sdk/natslib"
	"github.com/NubeIO/rubix-sdk/pluginnode"
	"github.com/rs/zerolog"
)

func main() {
	natsURL := flag.String("nats", "nats://localhost:4222", "NATS server URL")
	orgID := flag.String("org", "org1", "Organization ID")
	deviceID := flag.String("device", "device0", "Device ID")
	prefix := flag.String("prefix", "rubix.v1.local", "NATS subject prefix")
	vendor := flag.String("vendor", "nube", "Plugin vendor")
	pluginName := flag.String("name", "github", "Plugin name")
	logLevel := flag.String("log", "info", "Log level (debug/info/warn/error)")
	flag.Parse()

	level, err := zerolog.ParseLevel(*logLevel)
	if err != nil {
		level = zerolog.InfoLevel
	}

	logger := zerolog.New(zerolog.ConsoleWriter{Out: os.Stderr, TimeFormat: time.Kitchen}).
		Level(level).
		With().
		Timestamp().
		Str("plugin", *pluginName).
		Logger()

	logger.Info().
		Str("nats", *natsURL).
		Str("org", *orgID).
		Str("device", *deviceID).
		Msg("starting GitHub plugin")

	nc, err := natslib.Connect(*natsURL)
	if err != nil {
		logger.Fatal().Err(err).Msg("failed to connect to NATS")
	}
	defer nc.Close()

	server, err := pluginnode.NewPluginServer(pluginnode.PluginServerConfig{
		NATSClient:     nc,
		Prefix:         *prefix,
		OrgID:          *orgID,
		DeviceID:       *deviceID,
		Vendor:         *vendor,
		PluginName:     *pluginName,
		Version:        "0.1.0",
		Factory:        nodes.Factory,
		Logger:         logger,
		AutoStartNodes: true,
	})
	if err != nil {
		logger.Fatal().Err(err).Msg("failed to create plugin server")
	}
	defer server.Close()

	logger.Info().Msg("GitHub plugin started")

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)
	<-sigCh

	logger.Info().Msg("shutdown signal received")
}
