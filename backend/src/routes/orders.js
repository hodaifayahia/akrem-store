import crypto from 'node:crypto'
import { Router } from 'express'
import { db, mapOrder } from '../db.js'
import { findWilaya, deliveryFeeFor } from '../wilayas.js'

const router = Router()

/** Algerian mobile numbers: 05/06/07 + 8 digits, spaces/dashes ignored. */
const PHONE_RE = /^0[567]\d{8}$/
const REFERENCE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

/** AKR-YYYYMMDD-XXXX */
function makeReference() {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  let suffix = ''
  for (let i = 0; i < 4; i += 1) suffix += REFERENCE_ALPHABET[crypto.randomInt(REFERENCE_ALPHABET.length)]
  return `AKR-${ymd}-${suffix}`
}

const fail = (res, status, error, details) => res.status(status).json(details ? { error, details } : { error })

router.post('/', (req, res) => {
  const body = req.body || {}
  const customer = body.customer || {}
  const items = Array.isArray(body.items) ? body.items : []

  const name = String(customer.name || '').trim()
  const phone = String(customer.phone || '').replace(/[\s.\-()]/g, '')
  const commune = String(customer.commune || '').trim()
  const address = String(customer.address || '').trim()
  const note = String(customer.note || '').trim().slice(0, 500)
  const wilaya = findWilaya(customer.wilaya)

  const details = []
  if (name.length < 3) details.push('customer.name: full name required (3+ characters)')
  if (!PHONE_RE.test(phone)) details.push('customer.phone: valid Algerian mobile required (0[5-7] + 8 digits)')
  if (!wilaya) details.push('customer.wilaya: unknown wilaya (send the code, e.g. 16)')
  if (commune.length < 2) details.push('customer.commune: commune required')
  if (address.length < 5) details.push('customer.address: address required (5+ characters)')
  if (items.length === 0) details.push('items: at least one product is required')
  if (details.length) return fail(res, 400, 'validation failed', details)

  // Resolve products server-side. Client-sent prices/quantities are never trusted.
  const selectProduct = db.prepare('SELECT id, name, price_dzd, stock FROM products WHERE id = ?')
  const merged = new Map()
  for (const raw of items) {
    const productId = Number(raw && raw.productId)
    const quantity = Math.floor(Number(raw && raw.quantity))
    if (!Number.isInteger(productId) || productId <= 0) {
      return fail(res, 400, 'validation failed', [`items: invalid productId "${raw && raw.productId}"`])
    }
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 50) {
      return fail(res, 400, 'validation failed', [`items: invalid quantity for product ${productId} (1-50)`])
    }
    const product = selectProduct.get(productId)
    if (!product) return fail(res, 404, `product ${productId} not found`)
    const line = merged.get(productId) || { product, quantity: 0 }
    line.quantity += quantity
    merged.set(productId, line)
  }

  const lines = []
  for (const { product, quantity } of merged.values()) {
    if (product.stock < quantity) {
      return fail(res, 400, `insufficient stock for ${product.name} (available: ${product.stock}, requested: ${quantity})`)
    }
    lines.push({
      product_id: product.id,
      product_name: product.name,
      unit_price_dzd: product.price_dzd,
      quantity,
      line_total_dzd: product.price_dzd * quantity,
    })
  }

  const subtotal = lines.reduce((sum, l) => sum + l.line_total_dzd, 0)
  const deliveryFee = deliveryFeeFor(wilaya)
  const total = subtotal + deliveryFee
  const reference = makeReference()

  const insertOrder = db.prepare(
    `INSERT INTO orders
       (reference, customer_name, phone, wilaya, commune, address, note, delivery_method, delivery_fee_dzd, subtotal_dzd, total_dzd, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'cod', ?, ?, ?, 'new')`
  )
  const insertItem = db.prepare(
    'INSERT INTO order_items (order_id, product_id, product_name, unit_price_dzd, quantity, line_total_dzd) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const decrementStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?')

  try {
    const createOrder = db.transaction(() => {
      const info = insertOrder.run(
        reference, name, phone, String(wilaya.code), commune, address, note, deliveryFee, subtotal, total
      )
      const orderId = Number(info.lastInsertRowid)
      for (const line of lines) {
        const done = decrementStock.run(line.quantity, line.product_id, line.quantity)
        if (done.changes !== 1) {
          const error = new Error(`insufficient stock for ${line.product_name}`)
          error.status = 400
          throw error
        }
        insertItem.run(orderId, line.product_id, line.product_name, line.unit_price_dzd, line.quantity, line.line_total_dzd)
      }
      return orderId
    })
    const orderId = createOrder()
    res.status(201).json(mapOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)))
  } catch (err) {
    const status = err && err.status === 400 ? 400 : 500
    fail(res, status, (err && err.message) || 'could not create the order')
  }
})

/** Public order tracking: GET /api/orders/track/AKR-20260101-AB12 */
router.get('/track/:reference', (req, res) => {
  const reference = String(req.params.reference || '').trim().toUpperCase()
  const row = db.prepare('SELECT * FROM orders WHERE UPPER(reference) = ?').get(reference)
  if (!row) return fail(res, 404, 'order not found')
  res.json(mapOrder(row))
})

export default router
