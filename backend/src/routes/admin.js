import crypto from 'node:crypto'
import { Router } from 'express'
import { db, mapProduct, mapOrder } from '../db.js'
import { CATEGORIES, ORDER_STATUSES } from '../constants.js'

const SECRET = process.env.TOKEN_SECRET || 'akrem-dev-secret'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
const TTL_MS = (Number(process.env.TOKEN_TTL_HOURS) || 12) * 3600 * 1000

const router = Router()

/** Stateless HMAC-signed token: <base64url payload>.<base64url signature>. */
export function signToken() {
  const payload = Buffer.from(JSON.stringify({ role: 'admin', exp: Date.now() + TTL_MS })).toString('base64url')
  const signature = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

function verifyToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return false
  const [payload, signature] = token.split('.')
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url')
  const a = Buffer.from(signature || '')
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return data.role === 'admin' && typeof data.exp === 'number' && data.exp > Date.now()
  } catch {
    return false
  }
}

function requireAdmin(req, res, next) {
  const header = req.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!verifyToken(token)) return res.status(401).json({ error: 'unauthorized: missing or invalid token' })
  return next()
}

/** Normalise + validate a product payload coming from the admin UI. */
function readProductBody(body) {
  const errors = []
  const name = String(body.name || '').trim()
  const nameFr = String(body.name_fr || '').trim()
  const brand = String(body.brand || '').trim()
  const category = String(body.category || '').trim()
  const price = Math.round(Number(body.price_dzd))
  const oldPrice = body.old_price_dzd === '' || body.old_price_dzd === null || body.old_price_dzd === undefined
    ? null
    : Math.round(Number(body.old_price_dzd))
  const stock = Math.round(Number(body.stock))
  const rating = Number(body.rating)
  let specs = {}
  if (body.specs && typeof body.specs === 'object' && !Array.isArray(body.specs)) {
    specs = {
      ram: String(body.specs.ram ?? '').trim(),
      storage: String(body.specs.storage ?? '').trim(),
      screen: String(body.specs.screen ?? '').trim(),
      battery: String(body.specs.battery ?? '').trim(),
    }
  }

  if (name.length < 2) errors.push('name is required')
  if (brand.length < 1) errors.push('brand is required')
  if (!CATEGORIES.includes(category)) errors.push(`category must be one of ${CATEGORIES.join(', ')}`)
  if (!Number.isFinite(price) || price < 0) errors.push('price_dzd must be a positive number')
  if (oldPrice !== null && (!Number.isFinite(oldPrice) || oldPrice < 0)) errors.push('old_price_dzd must be null or a positive number')
  if (!Number.isFinite(stock) || stock < 0) errors.push('stock must be 0 or more')
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) errors.push('rating must be between 0 and 5')
  if (errors.length) return { errors }

  return {
    value: {
      name,
      name_fr: nameFr || name,
      brand,
      category,
      price_dzd: price,
      old_price_dzd: oldPrice,
      description: String(body.description || '').trim(),
      description_fr: String(body.description_fr || '').trim(),
      image_url: String(body.image_url || '').trim(),
      specs: JSON.stringify(specs),
      stock,
      rating,
      is_featured: body.is_featured ? 1 : 0,
    },
  }
}

// ------------------------------------------------------------------ auth
router.post('/login', (req, res) => {
  const password = String((req.body || {}).password || '')
  if (password.length !== ADMIN_PASSWORD.length ||
      !crypto.timingSafeEqual(Buffer.from(password), Buffer.from(ADMIN_PASSWORD))) {
    return res.status(401).json({ error: 'invalid password' })
  }
  return res.json({ token: signToken(), expiresInHours: Math.round(TTL_MS / 3600000) })
})

// Everything below requires a valid token.
router.use(requireAdmin)

// ------------------------------------------------------------------ products
router.get('/products', (_req, res) => {
  res.json(db.prepare('SELECT * FROM products ORDER BY created_at DESC, id DESC').all().map(mapProduct))
})

router.post('/products', (req, res) => {
  const { value, errors } = readProductBody(req.body || {})
  if (errors) return res.status(400).json({ error: 'validation failed', details: errors })
  const info = db
    .prepare(
      `INSERT INTO products
         (name, name_fr, brand, category, price_dzd, old_price_dzd, description, description_fr, image_url, specs, stock, rating, is_featured)
       VALUES
         (@name, @name_fr, @brand, @category, @price_dzd, @old_price_dzd, @description, @description_fr, @image_url, @specs, @stock, @rating, @is_featured)`
    )
    .run(value)
  res.status(201).json(mapProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(Number(info.lastInsertRowid))))
})

router.put('/products/:id', (req, res) => {
  const id = Number(req.params.id)
  const existing = Number.isInteger(id) ? db.prepare('SELECT * FROM products WHERE id = ?').get(id) : null
  if (!existing) return res.status(404).json({ error: 'product not found' })
  const { value, errors } = readProductBody(req.body || {})
  if (errors) return res.status(400).json({ error: 'validation failed', details: errors })
  db.prepare(
    `UPDATE products SET
       name = @name, name_fr = @name_fr, brand = @brand, category = @category,
       price_dzd = @price_dzd, old_price_dzd = @old_price_dzd, description = @description,
       description_fr = @description_fr, image_url = @image_url, specs = @specs,
       stock = @stock, rating = @rating, is_featured = @is_featured
     WHERE id = @id`
  ).run({ ...value, id })
  res.json(mapProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(id)))
})

router.delete('/products/:id', (req, res) => {
  const id = Number(req.params.id)
  const info = Number.isInteger(id) ? db.prepare('DELETE FROM products WHERE id = ?').run(id) : { changes: 0 }
  if (!info.changes) return res.status(404).json({ error: 'product not found' })
  res.json({ deleted: true, id })
})

// -------------------------------------------------------------------- orders
router.get('/orders', (_req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC, id DESC').all()
  res.json(rows.map(mapOrder))
})

router.patch('/orders/:id', (req, res) => {
  const id = Number(req.params.id)
  const existing = Number.isInteger(id) ? db.prepare('SELECT * FROM orders WHERE id = ?').get(id) : null
  if (!existing) return res.status(404).json({ error: 'order not found' })
  const status = String((req.body || {}).status || '')
  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of ${ORDER_STATUSES.join(', ')}` })
  }
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id)
  res.json(mapOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(id)))
})

// --------------------------------------------------------------------- stats
router.get('/stats', (_req, res) => {
  const products = db.prepare('SELECT COUNT(*) AS n FROM products').get().n
  const orders = db.prepare('SELECT COUNT(*) AS n FROM orders').get().n
  const revenue = db
    .prepare("SELECT COALESCE(SUM(total_dzd), 0) AS n FROM orders WHERE status != 'cancelled'")
    .get().n
  const lowStock = db.prepare('SELECT COUNT(*) AS n FROM products WHERE stock <= 5').get().n
  const byStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, db.prepare('SELECT COUNT(*) AS n FROM orders WHERE status = ?').get(s).n]))
  res.json({ products, orders, revenue_dzd: revenue, low_stock: lowStock, by_status: byStatus })
})

export default router
