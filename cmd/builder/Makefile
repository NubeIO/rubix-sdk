BIN := ../../bin/builder
SRC := ./...

.PHONY: build clean test run-ui run-cli

build:
	go build -o $(BIN) .

clean:
	rm -f $(BIN)

test:
	go test $(SRC)

# Launch interactive TUI
run-ui: build
	$(BIN) app package

# Example: package bacnet-server via CLI (no UI)
run-cli: build
	$(BIN) app package \
		--name bacnet-server \
		--version 2.1.0 \
		--arch amd64 \
		--binary ../../../rubix/bacnet-server/bacnet-server \
		--file ../../../rubix/bacnet-server/config.json \
		--port 4000 \
		--output ../../dist
