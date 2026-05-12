# leetcode-daily

Redirects `/daily` to today's LeetCode daily challenge. Caches the link until UTC midnight.

## Endpoints

| Route | Description |
|-------|-------------|
| `GET /daily` | Redirects to today's LeetCode problem |
| `GET /health` | Health check + cache status |

## Run locally

```bash
npm install
npm run dev
```

## Deploy (Docker)

```bash
# Build and start
docker compose up -d

# Logs
docker compose logs -f

# Rebuild after changes
docker compose up -d --build
```

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port to listen on |
| `LOG_LEVEL` | `info` | Pino log level (`trace`, `debug`, `info`, `warn`, `error`) |
| `NODE_ENV` | `production` | Enables pretty-printing in dev |

## Nginx reverse proxy (optional)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

> If running behind Nginx, `trust proxy` is already enabled in the app so rate limiting works correctly per real client IP.