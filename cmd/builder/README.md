# Builder CLI

Package bios apps (and future plugins) into installable `.zip` files.

## Build

```bash
cd rubix-sdk/cmd/builder
make build
```

Binary output: `rubix-sdk/bin/builder`

## Usage

```
builder <type> <command> [flags]

Types:
  app       Bios-managed apps

Commands:
  package   Zip an existing built app for deployment
```

## Package an app

```
builder app package [flags]

Required:
  --name      App name (lowercase, hyphens)
  --version   Semver version (e.g. 1.0.0)
  --arch      Target arch: amd64, amd64-win, arm64, armv7
  --binary    Path to the built binary

Optional:
  --file      Extra file to include (repeatable)
  --dir       Extra directory to include (repeatable)
  --port      App port (written to app.yaml)
  --health    Health check URL (written to app.yaml)
  --args      App arguments, comma-separated
  --output    Output directory (default: current dir)
```

## Example: package bacnet-server

```bash
# Build the builder
cd rubix-sdk/cmd/builder && make build

# Package bacnet-server for Linux x86_64
../../bin/builder app package \
  --name bacnet-server \
  --version 2.1.0 \
  --arch amd64 \
  --binary ../rubix/bacnet-server/bacnet-server \
  --file ../rubix/bacnet-server/config.json \
  --port 4000 \
  --output dist/

# Output: dist/bacnet-server-2.1.0-amd64.zip
```

Inspect the result:

```bash
$ unzip -l dist/bacnet-server-2.1.0-amd64.zip
  Length      Date    Time    Name
---------  ---------- -----   ----
       68  ...               app.yaml
100207744  ...               bacnet-server
      172  ...               config.json

$ unzip -p dist/bacnet-server-2.1.0-amd64.zip app.yaml
name: bacnet-server
version: 2.1.0
exec: ./bacnet-server
port: 4000
```

## Zip format

Output: `{name}-{version}-{arch}.zip`

Contents:
- `app.yaml` -- generated manifest (name, version, exec, port, etc.)
- The binary
- Any extra `--file` or `--dir` entries

This zip can be uploaded directly to bios via `POST /api/bios/apps/install`.

## More examples

```bash
# Package rubix for ARM64 with args and health check
bin/builder app package \
  --name rubix \
  --version 1.0.0 \
  --arch arm64 \
  --binary ../rubix/bin/rubix-arm64 \
  --file ../rubix/config/server.yaml \
  --port 9000 \
  --health "http://localhost:9000/healthz" \
  --args "--addr,:9000,--server-config,server.yaml" \
  --output dist/

# Package for Windows
bin/builder app package \
  --name bacnet-server \
  --version 2.1.0 \
  --arch amd64-win \
  --binary ../rubix/bacnet-server/bacnet-server.exe \
  --file ../rubix/bacnet-server/config.json \
  --port 4000 \
  --output dist/

# Include a whole directory
bin/builder app package \
  --name my-app \
  --version 0.1.0 \
  --arch amd64 \
  --binary ./bin/my-app \
  --dir ./templates \
  --file ./config.json \
  --output dist/
```
