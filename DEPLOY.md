# Deploy — Akrem Mobile (production)

Target: a single Linux VPS (Debian/Ubuntu) with Docker. The app runs as **one
container on port 8084** that serves both the JSON API and the built React
storefront, so a reverse proxy only needs one upstream.

```
client ──https──▶ Caddy :443 ──▶ 127.0.0.1:8084 ──▶ Express (API + SPA) ──▶ SQLite /data/store.db
```

---

## 1. Install Docker (once)

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER" && newgrp docker     # log out / re-login
docker --version && docker compose version
```

## 2. Get the code

```bash
sudo mkdir -p /opt && cd /opt
git clone https://github.com/hodaifayahia/akrem-store.git
cd akrem-store
```

## 3. Configure — this step is mandatory

```bash
cp .env.example .env
openssl rand -hex 32          # copy the output
```

Edit `.env`:

| Key | What to put |
| --- | --- |
| `ADMIN_PASSWORD` | a real password for `/admin/login` — **not** `admin123` |
| `TOKEN_SECRET` | the `openssl rand -hex 32` output |
| `PORT` / `HOST_PORT` | keep `8084` unless you are changing the published port |
| `DB_PATH` | keep `/data/store.db` (on the volume) |
| `VITE_BASE` | `/` — or `/shop/` only for sub-path hosting |

The server **refuses to start** with `NODE_ENV=production` while `ADMIN_PASSWORD`
is unset or `admin123`, or while `TOKEN_SECRET` is missing:

```
[akrem-store] Refusing to start with NODE_ENV=production:
  - ADMIN_PASSWORD is still the demo value "admin123"
  - TOKEN_SECRET is not set (admin tokens would be forgeable)
```

That guard is a feature: it makes "shipped with the demo password" impossible.

## 4. Build & run

```bash
docker compose up -d --build        # first build: ~2-4 min (npm install x2)
docker compose logs -f akrem-store  # watch the boot log
```

Expected log lines:

```
Akrem Mobile API  ->  http://0.0.0.0:8084
SQLite database   ->  /data/store.db
Storefront        ->  /app/frontend/dist
Seeded 26 products
```

## 5. Verify

```bash
curl -s localhost:8084/api/health
# {"ok":true}

curl -s localhost:8084/api/products | grep -o '"id"' | wc -l
# 26            <- catalogue seeded on first boot (18 smartphones + 3 laptops + 5 accessories)

curl -s "localhost:8084/api/products?search=samsung" | grep -o '"brand":"[^"]*"' | sort -u
# "brand":"Samsung"

curl -sI localhost:8084/products | head -1     # SPA history fallback
# HTTP/1.1 200 OK

curl -s localhost:8084/api/nope               # unknown API path stays JSON
# {"error":"endpoint not found"}
```

Then open **http://<server-ip>:8084** (storefront) and
**http://<server-ip>:8084/admin** (password from `.env`).

## 6. Point a domain at it

1. DNS `A` record for your subdomain → the server's public IP (wait for propagation).
2. Append the matching block from [`Caddyfile.snippet`](./Caddyfile.snippet) to `/etc/caddy/Caddyfile`.
   Caddy provisions and renews the TLS certificate automatically — no certbot.
3. Reload and test:

```bash
sudo systemctl reload caddy
curl -sI https://akrem-store.example.com | head -1     # HTTP/2 200
curl -s  https://akrem-store.example.com/api/health   # {"ok":true}
```

Keep port 8084 unpublished for the internet if you like — it is only reachable
through Caddy: set `HOST_PORT=127.0.0.1:8084` in `.env` (docker publishes
`127.0.0.1:8084:8084` that way).

## 7. Update after a `git pull`

```bash
cd /opt/akrem-store
git pull
docker compose up -d --build
```

`/data` is a named volume, so **orders and stock survive every rebuild**.

## 8. Back up / restore the database

```bash
# backup (find the volume name with: docker volume ls)
docker run --rm -v akrem-store_akrem-data:/data -v "$PWD":/backup alpine \
  tar czf /backup/store-$(date +%F).tgz -C /data .

# restore
docker compose down
docker run --rm -v akrem-store_akrem-data:/data -v "$PWD":/backup alpine \
  sh -c "rm -f /data/* && tar xzf /backup/store-2026-06-01.tgz -C /data"
docker compose up -d
```

## 9. Reset the database

```bash
# destroy the volume too — orders, stock and the catalogue are wiped and re-seeded
docker compose down -v && docker compose up -d

# or: re-seed inside a throwaway container, keeping the volume
docker compose run --rm akrem-store node src/seed.js
```

Both paths end with 26 seeded products (`src/db.js` auto-seeds on boot when the
catalogue is empty, so even an empty `/data` recovers on the next start).

## 10. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Refusing to start with NODE_ENV=production` | set a real `ADMIN_PASSWORD` + `TOKEN_SECRET` in `.env`, then `docker compose up -d` |
| `Address already in use` / container restarts | `HOST_PORT=9000 docker compose up -d`, or find the holder with `ss -ltnp` |
| `better-sqlite3` build error in the log | the image already installs `python3 make g++`; check your host allows `npm install` from the registry |
| Storefront 404s on `/products` | the SPA fallback only exists when `frontend/dist` is present — check `docker compose logs` for `Storefront -> not built` |
| Admin logout on every request | `TOKEN_SECRET` changed between restarts (tokens are signed with it) |
| Assets 404 under `/shop/` | rebuild with `VITE_BASE=/shop/` (see `Caddyfile.snippet` variant 2) |

---

## Appendix — running without Docker

```bash
cd frontend && npm install && npm run build     # produces frontend/dist
cd ../backend
NODE_ENV=production ADMIN_PASSWORD='…' TOKEN_SECRET='…' \
  PORT=8084 HOST=0.0.0.0 DB_PATH=./data/store.db node src/server.js
```

`server.js` serves `frontend/dist` whenever it exists, so the same process answers
both `/api/*` and the SPA. Put nginx/Caddy in front of it as in §6.