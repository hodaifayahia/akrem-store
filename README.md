# Akrem Mobile — Store (أكـرم موبايل)

Full-stack e-commerce web app for selling **mobile phones in Algeria**: dark-first RTL
Arabic tech store (brand: akrem-mobile.com) with a French toggle, cash on delivery,
public order tracking and a minimal token-authenticated admin panel.

- **Backend** — Node.js 20+ · Express 4 · better-sqlite3 (file database, auto-created + seeded) · plain ESM JavaScript
- **Frontend** — Vite · React 18 · react-router-dom v6 · TypeScript · **plain CSS with CSS variables (no Tailwind)**
- **Payments** — **cash on delivery (COD) only**, the standard in Algeria. No card, no online payment gateway, no account required from the customer.

---

## 1. Prerequisites

| Requirement | Version |
| --- | --- |
| Node.js | **20 or newer** (tested on 24) — includes `node --watch` |
| npm | 9+ (ships with Node) |
| OS | Linux / macOS / Windows (any shell) |

No database server, no Docker, no API key, no external service.

## 2. Run it

Two terminals.

### Terminal 1 — API (port 4000)

```bash
cd backend
npm install          # installs express, cors, better-sqlite3 (native prebuild)
npm run seed         # (re)creates backend/data/store.db and loads the catalogue
npm run dev          # node --watch src/server.js  ->  http://localhost:4000
```

`npm run dev` is optional on first start: the server creates the database file and
seeds it automatically when the catalogue is empty.

### Terminal 2 — web app (port 5173)

```bash
cd frontend
npm install
npm run dev          # vite  ->  http://localhost:5173
```

Vite proxies `/api` → `http://localhost:4000`, so the frontend always calls relative
`/api/...` URLs. Open **http://localhost:5173**.

### One command with Docker (the deployable setup)

```bash
cp .env.example .env          # then set ADMIN_PASSWORD + TOKEN_SECRET
docker compose up -d --build
```

One container serves the API **and** the built storefront on port 8084 and seeds
the catalogue on first boot, so it is the same setup you deploy to a VPS.
Open `http://localhost:8084`. Full guide: **[DEPLOY.md](./DEPLOY.md)**.

### Production build

```bash
cd frontend
npm run build        # tsc --noEmit && vite build  ->  frontend/dist
```

If `frontend/dist` exists, the backend serves it automatically on
`http://localhost:4000` (single-origin deployment, no CORS involved).

### Other scripts

| Command | Where | What it does |
| --- | --- | --- |
| `npm run dev` | backend | API with auto-restart on file change |
| `npm start` | backend | API without watch mode |
| `npm run seed` | backend | **drops and rebuilds** products / orders / order_items, then re-seeds the catalogue |
| `npm run dev` / `build` / `preview` / `typecheck` | frontend | Vite dev server, production build, preview server, `tsc --noEmit` |

## 3. Ports

| Service | Port | Notes |
| --- | --- | --- |
| Express API | **4000** | `PORT=4000` |
| Vite dev server | **5173** | `strictPort`, so it fails loudly if 5173 is taken |
| SQLite file | n/a | `backend/data/store.db` (git-ignored) |

## 4. Environment variables

The server reads `process.env` and has **no dotenv dependency** — export the variables
in your shell, or use Node's built-in env file support:

```bash
cp backend/.env.example backend/.env
cd backend && node --env-file=.env src/server.js
```

| Variable | Default | Used by | Purpose |
| --- | --- | --- | --- |
| `PORT` | `4000` | `src/server.js` | API port |
| `ADMIN_PASSWORD` | `admin123` | `POST /api/admin/login` | admin panel password |
| `TOKEN_SECRET` | `akrem-dev-secret` | admin token signing | HMAC secret — **change it in production** |
| `TOKEN_TTL_HOURS` | `12` | token signing | admin session lifetime |
| `DB_PATH` | `./data/store.db` | `src/db.js` | SQLite location (relative to `backend/`) |
| `VITE_API_URL` | `/api` | frontend | absolute API base if the API is on another host |

### Admin credentials

| Field | Value |
| --- | --- |
| URL | `http://localhost:5173/admin/login` |
| Password | **`admin123`** (or `ADMIN_PASSWORD`) |

**Change it before deploying anything public.** The token is an HMAC-SHA256 signature
over `{role:"admin", exp:<ms>}` — stateless, verified with a timing-safe compare, and
stored in the browser at `localStorage["akrem-admin-token"]`.

## 5. REST API

Base URL `/api`. All responses are JSON. Public routes need no authentication;
admin routes need `Authorization: Bearer <token>` from `POST /api/admin/login`.

### Public

| Method | Endpoint | Query / body | Returns |
| --- | --- | --- | --- |
| `GET` | `/api/health` | — | `200 {"ok":true}` |
| `GET` | `/api/products` | `search`, `brand`, `category`, `minPrice`, `maxPrice`, `sort=newest\|price_asc\|price_desc`, `featured=1` | `200 [product…]` |
| `GET` | `/api/products/brands` | — | `200 ["Apple","Xiaomi",…]` |
| `GET` | `/api/products/wilayas` | — | `200 [{code,ar,fr,fee}]` (58 wilayas + delivery fee) |
| `GET` | `/api/products/:id` | — | `200 product` · `404 {"error":"product not found"}` |
| `POST` | `/api/orders` | see below | `201 order` (with `items`) |
| `GET` | `/api/orders/track/:reference` | — | `200 order` (with `items`) · `404` |

`POST /api/orders` body:

```json
{
  "customer": {
    "name": "Mohamed Amine",
    "phone": "0555123456",
    "wilaya": "16",
    "commune": "Bir Mourad Rais",
    "address": "Cité 200 logements, Bât. C",
    "note": "Appeler avant 18h"
  },
  "items": [{ "productId": 1, "quantity": 2 }]
}
```

Server-side rules (client prices are **never** trusted):

1. `name` ≥ 3 chars, `phone` matches `/^0[567]\d{8}$/` (spaces/dashes stripped), `wilaya` resolved by code or name, `commune` ≥ 2, `address` ≥ 5, at least one item → otherwise `400 {"error":"validation failed","details":[…]}`.
2. Prices and names are read from the `products` table, duplicate lines are merged, quantities are capped at 50.
3. Insufficient stock → `400 {"error":"insufficient stock for … (available: N, requested: M)"}`; unknown product → `404`.
4. Delivery fee comes from the server's 58-wilaya table, never from the request.
5. Everything happens in one SQLite transaction: insert order → insert items → `UPDATE products SET stock = stock - ?`. Any failure rolls back.

Response `201`:

```json
{
  "id": 1, "reference": "AKR-20260101-A7K2", "customer_name": "Mohamed Amine",
  "phone": "0555123456", "wilaya": "16", "commune": "Bir Mourad Rais",
  "address": "…", "note": "", "delivery_method": "cod",
  "delivery_fee_dzd": 350, "subtotal_dzd": 578000, "total_dzd": 578350,
  "status": "new", "created_at": "2026-01-01T10:00:00.000Z",
  "items": [{ "id": 1, "order_id": 1, "product_id": 1, "product_name": "آيفون 15 برو 256GB",
              "unit_price_dzd": 289000, "quantity": 2, "line_total_dzd": 578000 }]
}
```

### Admin (Bearer token)

| Method | Endpoint | Body | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/admin/login` | `{"password":"admin123"}` | `200 {"token":"…","expiresInHours":12}` · `401` |
| `GET` | `/api/admin/products` | — | full catalogue (newest first) |
| `POST` | `/api/admin/products` | product fields | `201 product` · `400` with `details` |
| `PUT` | `/api/admin/products/:id` | product fields | `200 product` · `404` |
| `DELETE` | `/api/admin/products/:id` | — | `200 {"deleted":true,"id":7}` · `404` |
| `GET` | `/api/admin/orders` | — | newest first, each order **with its items** |
| `PATCH` | `/api/admin/orders/:id` | `{"status":"shipped"}` | `new\|confirmed\|shipped\|delivered\|cancelled` |
| `GET` | `/api/admin/stats` | — | `{products, orders, revenue_dzd, low_stock, by_status}` |

Every non-login admin route answers `401 {"error":"unauthorized: missing or invalid token"}`
without a valid signature.

### Quick curl walkthrough

```bash
curl -s localhost:4000/api/health
curl -s "localhost:4000/api/products?search=samsung&sort=price_asc"
curl -s localhost:4000/api/products/brands
curl -s -X POST localhost:4000/api/orders -H 'content-type: application/json' \
  -d '{"customer":{"name":"Mohamed Amine","phone":"0555123456","wilaya":"16","commune":"Bir Mourad Rais","address":"Cité 200 logements"},"items":[{"productId":1,"quantity":2}]}'
curl -s localhost:4000/api/orders/track/AKR-20260101-A7K2
TOKEN=$(curl -s -X POST localhost:4000/api/admin/login -H 'content-type: application/json' \
  -d '{"password":"admin123"}' | sed -E 's/.*"token":"([^"]+)".*/\1/')
curl -s localhost:4000/api/admin/stats -H "Authorization: Bearer $TOKEN"
```

## 6. Deploy (production)

The app is **single-origin**: `backend/src/server.js` serves `frontend/dist` whenever it
exists, so one process answers both `/api/*` and every storefront route (`/`, `/products`,
`/product/:id`, `/cart`, `/checkout`, `/order/:reference`, `/admin`), while unknown `/api/*`
paths still return a JSON 404. `frontend/src/lib/api.ts` calls
`import.meta.env.VITE_API_BASE || '/api'`, so dev (Vite proxy on :5173) and production
(same origin) both work with no configuration.

### Demo vs production credentials

| Environment | Admin password | Behaviour |
| --- | --- | --- |
| Local dev (`NODE_ENV` unset) | **`admin123`** | demo credentials work out of the box at `/admin` |
| Docker / `NODE_ENV=production` | your `ADMIN_PASSWORD` | **the server refuses to boot** while `ADMIN_PASSWORD` is unset or still `admin123`, or while `TOKEN_SECRET` is missing |

### One command

```bash
cp .env.example .env && $EDITOR .env   # ADMIN_PASSWORD + TOKEN_SECRET are mandatory
docker compose up -d --build
```

| File | Purpose |
| --- | --- |
| `Dockerfile` | multi-stage build: storefront → backend prod deps → runtime `node:24-bookworm-slim`, `EXPOSE 8084`, `VOLUME /data` |
| `docker-compose.yml` | service `akrem-store`, `8084:8084`, `restart: unless-stopped`, named volume for `/data`, `env_file: .env` |
| `.env.example` (root) | container env: `ADMIN_PASSWORD`, `TOKEN_SECRET`, `PORT`, `DB_PATH`, `HOST_PORT`, `VITE_BASE` |
| `Caddyfile.snippet` | reverse proxy for a subdomain + a commented `/shop/` sub-path variant |
| `DEPLOY.md` | copy-paste VPS runbook: Docker install, clone, `.env`, build, health checks, domain, backup, reset, updates |

Server env vars: `PORT` (default `4000`), `HOST` (default `0.0.0.0`), `DB_PATH`,
`ADMIN_PASSWORD`, `TOKEN_SECRET`, `TOKEN_TTL_HOURS`. Sub-path hosting needs
`VITE_BASE=/shop/` at **build** time. Full step-by-step: **[DEPLOY.md](./DEPLOY.md)**.

## 7. Frontend routes

| Route | Page |
| --- | --- |
| `/` | hero (rotating search placeholder) · trust strip · category cards · featured · stats · marquee · new arrivals |
| `/products` | filters — text search (`?q=`), brand, category, price range, sort; reads `?category=` and `?featured=` |
| `/product/:id` | large image, specs table, quantity stepper, add to cart, related products |
| `/cart` | quantity stepper, remove, subtotal, delivery note |
| `/checkout` | customer form, 58-wilaya select with live delivery fee, COD only, blocks an empty cart |
| `/order/:reference` | confirmation: reference, items, totals, delivery, follow-up CTA |
| `/track` | public tracking by reference (`?ref=` prefills) |
| `/admin/login` · `/admin` · `/admin/products` | login · stats + orders table with status dropdown · product table, add/edit modal, delete with confirm |

State: cart in React context persisted at `localStorage["akrem-cart"]`, theme at
`akrem-theme`, language at `akrem-lang`, admin token at `akrem-admin-token`.

## 8. Design system

`frontend/src/styles/theme.css` holds the exact brand token system as HSL triplets
consumed with `hsl(var(--token) / <alpha>)`:

- dark (default on `:root` and `html.dark`): `--background: 220 51% 7%`, `--primary: 217 100% 60%`, `--card: 220 51% 7%`, `--popover: 220 51% 9%`, `--muted: 220 40% 11%`, `--border: 220 30% 16%`, `--radius: .75rem`, …
- light (`html[data-theme="light"]`): `--background: 222 40% 97%`, `--card: 0 0% 100%`, `--primary: 217 100% 55%`, …
- fonts: **Space Grotesk** (display) · **DM Sans** (body) · **Cairo** (Arabic, Tajawal fallback), loaded from Google Fonts
- `<meta name="theme-color" content="#0EA5E9">`, `lang="ar"`, `dir="rtl"`
- 12–16 px radii, soft blue glow on hover, pill badges, gradient primary CTAs, max width 1200 px, mobile-first at 360 px, `prefers-reduced-motion` respected

Prices are formatted as Latin digits with a plain-space thousands separator —
`145 000 DA` / `145 000 دج` (`formatDZD` in `frontend/src/lib/format.ts`).

## 9. Project structure

```
akrem-store/
├── README.md
├── .gitignore
├── backend/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── server.js          # express app, routes, static dist, port 4000
│       ├── db.js              # schema + migration + seed + row mappers
│       ├── seed.js            # npm run seed (reset + reseed)
│       ├── seed-data.js       # 26 catalogue rows (18 phones, 3 laptops, 5 accessories)
│       ├── wilayas.js         # 58 wilayas + delivery fee, lookup helpers
│       ├── constants.js       # categories, statuses, sort whitelist
│       └── routes/
│           ├── products.js
│           ├── orders.js
│           └── admin.js
├── frontend/
│   ├── package.json · vite.config.ts · tsconfig.json · index.html
│   └── src/
│       ├── main.tsx · App.tsx
│       ├── styles/theme.css   # design tokens
│       ├── styles/app.css     # components
│       ├── i18n/index.tsx     # ar + fr dictionary, dir/lang switching, helpers
│       ├── context/           # CartContext.tsx, ThemeContext.tsx
│       ├── lib/               # api.ts, format.ts
│       ├── components/        # Header, Footer, icons, ui (cards, badges, marquee…)
│       └── pages/             # Home, Products, ProductDetail, Cart, Checkout, Order, Admin
└── data/                      # runtime only: store.db (git-ignored, created on boot)
```

## 10. Reset the database

```bash
cd backend
npm run seed        # DROP TABLE products/orders/order_items, recreate, re-seed
```

or simply delete `backend/data/store.db*` and start the server — it is recreated and
seeded on boot. All data (products, orders, stock) lives in that one file.

## 11. Documented decisions

1. **Express + better-sqlite3, no ORM.** A single-file SQLite database with prepared
   statements and one transaction per order is the simplest thing that satisfies
   transactional stock decrements, and it runs with zero infrastructure.
2. **Vanilla ESM JavaScript on the backend** — no build step, so `npm run dev` is
   literally `node`. TypeScript where it pays: the React app.
3. **Vite + React 18 + react-router-dom v6 + plain CSS.** Tailwind is deliberately not
   used: the brand token system is a fixed HSL-triplet palette that maps 1:1 onto CSS
   custom properties, so no utility-class generation is needed.
4. **Cash on delivery only.** Card and online payment infrastructure is not
   widespread in Algeria; COD is the standard and removes any need for a payment
   provider, secrets or PCI concerns.
5. **Arabic first, French toggle.** `<html lang="ar" dir="rtl">` by default; the toggle
   swaps every string through the i18n dictionary and flips `dir`/`lang` on the root
   element. The choice is persisted (`akrem-lang`).
6. **Minimal admin auth, no customer accounts.** One shared password issues an
   HMAC-signed, expiring token stored in `localStorage`. Customers never register —
   an order is identified only by its `AKR-YYYYMMDD-XXXX` reference, which is what the
   tracking page needs.
7. **Prices always recomputed on the server.** The client sends `productId` + `quantity`
   only; the API reads the price, applies the wilaya delivery fee, and rejects
   insufficient stock before writing anything.

## 12. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `EADDRINUSE :4000` | another process owns the port: `PORT=4100 npm run dev` (and change the Vite proxy target in `frontend/vite.config.ts`), or stop the other process |
| `Vite` says "Port 5173 is in use" | `strictPort` is on by design; free the port or run `npx vite --port 5174` (then open the printed URL) |
| Frontend shows "network error: the API is not reachable" | the API on port 4000 is not running, or `VITE_API_URL` points elsewhere — check `curl localhost:4000/api/health` |
| `better-sqlite3` fails to install | it is a native module: needs Node 20+ and a working prebuild for your platform. On failure build it with `npm rebuild better-sqlite3 --build-from-source` (requires python3 + a C++ toolchain) |
| `SQLITE_CANTOPEN` | `backend/data/` is not writable; delete the directory or point `DB_PATH` elsewhere |
| Admin login returns 401 | wrong `ADMIN_PASSWORD`; restart the API after changing it |
| "unauthorized: missing or invalid token" | the token expired (`TOKEN_TTL_HOURS`) or `TOKEN_SECRET` changed — log in again |
| Image shows the "AKREM" placeholder | the Unsplash URL returned an error; `SmartImage` handles `onError` on purpose. Replace `image_url` in the catalogue with your own photo. |
| Port 5173 blank screen with mixed AR/FR text | hard-reload after switching language; `dir` is applied by the i18n provider on mount |