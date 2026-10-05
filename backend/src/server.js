import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import express from 'express'
import { seedIfEmpty, DB_PATH } from './db.js'
import productsRouter from './routes/products.js'
import ordersRouter from './routes/orders.js'
import adminRouter from './routes/admin.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 4000
const HOST = process.env.HOST || '0.0.0.0'
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

/**
 * Production guard: the demo admin password must never reach a public host.
 * Locally (NODE_ENV unset) the `admin123` default keeps the demo frictionless.
 */
if (IS_PRODUCTION) {
  const problems = []
  if (!process.env.ADMIN_PASSWORD) problems.push('ADMIN_PASSWORD is not set')
  else if (process.env.ADMIN_PASSWORD === 'admin123') problems.push('ADMIN_PASSWORD is still the demo value "admin123"')
  if (!process.env.TOKEN_SECRET) problems.push('TOKEN_SECRET is not set (admin tokens would be forgeable)')
  if (problems.length > 0) {
    console.error('\n[akrem-store] Refusing to start with NODE_ENV=production:')
    for (const problem of problems) console.error(`  - ${problem}`)
    console.error('\n  Set them before starting: docker → edit .env, bare metal → export ADMIN_TOKEN…')
    console.error('  example: ADMIN_PASSWORD="a-real-password" TOKEN_SECRET="$(openssl rand -hex 32)"\n')
    process.exit(1)
  }
}

const seeded = seedIfEmpty()

const app = express()
app.disable('x-powered-by')
app.use(cors())
app.use(express.json({ limit: '256kb' }))

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api/products', productsRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/admin', adminRouter)

// Unknown API path -> JSON 404 (registered before the SPA fallback on purpose).
app.use('/api', (_req, res) => res.status(404).json({ error: 'endpoint not found' }))

/**
 * Single-origin production mode: when the built storefront exists it is served
 * from this same process, so a reverse proxy only needs one upstream.
 *   /api/*                -> JSON (never index.html)
 *   /, /products, /cart… -> index.html (client-side routing history fallback)
 */
const DIST = path.resolve(__dirname, '..', '..', 'frontend', 'dist')
const INDEX_HTML = path.join(DIST, 'index.html')
const hasBuild = fs.existsSync(INDEX_HTML)

if (hasBuild) {
  app.use(express.static(DIST))
  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith('/api')) return next() // unreachable, /api 404 already handled
    return res.sendFile(INDEX_HTML)
  })
}

app.use((_req, res) => {
  if (hasBuild) return res.status(404).json({ error: 'endpoint not found' })
  return res.status(404).json({ error: 'endpoint not found — the frontend build was not found at frontend/dist' })
})

app.use((err, _req, res, _next) => {
  console.error('[error]', err)
  res.status(500).json({ error: 'internal server error' })
})

app.listen(PORT, HOST, () => {
  console.log(`Akrem Mobile API  ->  http://${HOST}:${PORT}`)
  console.log(`SQLite database   ->  ${DB_PATH}`)
  console.log(`Storefront        ->  ${hasBuild ? DIST : 'not built (run: cd frontend && npm run build)'}`)
  if (seeded) console.log(`Seeded ${seeded} products`)
})