# Cloud Deployment (nginx + bios)

Bios manages rubix (same as browser/edge). Nginx sits in front — serves the frontend statically and proxies API calls to rubix.

For browser/desktop/Pi builds, see [EXAMPLE.md](EXAMPLE.md).

---

## 1. Build

```bash
cd rubix-sdk/cmd/builder
make build                                # one-time: build the builder tool
make browser-linux EXCLUDE=bacnet,desktop  # bios + rubix + frontend + configs
```

Output in `dist/browser-linux/`:
```
dist/browser-linux/
├── rubix-bios                      # process manager
├── bios.yaml                       # bios config
├── start.sh                        # entry point
├── configs/                        # RAS API schemas
├── frontend/dist/client/           # React frontend
└── apps/rubix/
    ├── rubix                       # Go binary
    ├── app.yaml                    # manifest
    ├── server.yaml                 # config
    ├── db/                         # database
    └── logs/                       # app logs
```

---

## 2. Deploy

```bash
# Copy the whole dist to the server
scp -r dist/browser-linux/* user@server:/opt/rubix/

# Copy frontend to nginx root (first time only — bios handles this after upgrades)
scp -r dist/browser-linux/frontend/dist/client/* user@server:/var/www/rubix-client/
```

---

## 3. Nginx config

```nginx
server {
    listen 80;
    server_name rubix.example.com;

    # Frontend (React)
    location / {
        root /var/www/rubix-client;
        try_files $uri $uri/ /index.html;
    }

    # Rubix API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Bios UI + API (management)
    location /bios/ {
        proxy_pass http://127.0.0.1:8999/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Bios UI is at `http://server/bios/`, rubix API at `http://server/api/`.

---

## 4. Run

```bash
cd /opt/rubix
./start.sh
```

This starts bios on `:8999`, which auto-starts rubix on `:9000`.

Or run bios directly:

```bash
./rubix-bios --config bios.yaml
```

---

## 5. Configure frontend auto-deploy

Set the nginx frontend path in bios so upgrades automatically copy the new frontend files.

**Via bios UI:** Open `http://server:8999` → System tab → "Frontend Deploy (Cloud / nginx)" → enter `/var/www/rubix-client` → Save

**Via bios.yaml:**
```yaml
addr: ":8999"
mode: browser
frontend_deploy_path: /var/www/rubix-client
```

**Via API:**
```bash
curl -X PUT http://server:8999/api/bios/config/frontend-deploy-path \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"path": "/var/www/rubix-client"}'
```

Once set, every upgrade through bios will automatically copy the frontend to this path — no manual scp needed.

You can also trigger a deploy manually at any time:

**Via bios UI:** System tab → "Deploy Now" button

**Via API:**
```bash
curl -X POST http://server:8999/api/bios/config/deploy-frontend \
  -H "Authorization: Bearer <token>"
```

---

## 6. Upgrade

Package a new version:

```bash
cd rubix-sdk/cmd/builder
./bin/builder app package \
  --name rubix \
  --version 1.3.0 \
  --arch amd64 \
  --binary ../../rubix/bin/rubix \
  --dir ../../rubix/frontend/dist/client \
  --file ../../rubix/config/server.yaml \
  --port 9000 \
  --health "http://localhost:9000/healthz" \
  --args "--addr,:9000,--server-config,server.yaml"
```

Then either:

**Via bios UI:** Open `http://server:8999` → Services → drop the zip → upgrade wizard. Bios will stop rubix, swap the files, restart, and deploy the frontend to nginx automatically.

**Via API:**
```bash
curl -X POST http://server:8999/api/bios/apps/rubix/upgrade?keep=db,config \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @rubix-1.3.0-amd64.zip
```

**Via Go SDK:**
```go
client := biosclient.New("http://server:8999", "my-token")
apps := biosclient.NewAppsClient(client)
resp, err := apps.Upgrade("rubix", "rubix-1.3.0-amd64.zip", "db,config")
```

The upgrade wizard stages: stopping → staging → configuring → starting → health-check → deploying-frontend → done.

---

## 7. Update via CI/CD (alternative)

If you prefer CI/CD over the bios wizard:

```bash
# Rebuild
cd rubix-sdk/cmd/builder
make browser-linux EXCLUDE=bacnet,desktop

# Re-deploy binary
scp dist/browser-linux/apps/rubix/rubix user@server:/opt/rubix/apps/rubix/rubix

# Restart rubix via bios API (frontend auto-deploys if path is configured)
curl -X POST http://server:8999/api/bios/apps/rubix/restart \
  -H "Authorization: Bearer <token>"

# Or manually deploy frontend if not using the upgrade endpoint
scp -r dist/browser-linux/frontend/dist/client/* user@server:/var/www/rubix-client/
```
