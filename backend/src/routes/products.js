import { Router } from 'express'
import { db, mapProduct } from '../db.js'
import { CATEGORIES, SORTS } from '../constants.js'
import { WILAYAS } from '../wilayas.js'

const router = Router()

/** Distinct brands present in the catalogue. Declared before /:id on purpose. */
router.get('/brands', (_req, res) => {
  const rows = db.prepare('SELECT DISTINCT brand FROM products ORDER BY brand COLLATE NOCASE').all()
  res.json(rows.map((r) => r.brand))
})

/** The 58 wilayas + their home-delivery fee (used by the checkout form). */
router.get('/wilayas', (_req, res) => {
  res.json(WILAYAS)
})

router.get('/', (req, res) => {
  const { search, brand, category, minPrice, maxPrice, sort, featured } = req.query
  const where = []
  const params = {}

  if (search && String(search).trim()) {
    where.push(
      '(p.name LIKE @q OR p.name_fr LIKE @q OR p.brand LIKE @q OR p.description LIKE @q OR p.description_fr LIKE @q)'
    )
    params.q = `%${String(search).trim()}%`
  }
  if (brand && String(brand).trim()) {
    where.push('p.brand = @brand')
    params.brand = String(brand).trim()
  }
  if (category && String(category).trim()) {
    if (!CATEGORIES.includes(String(category))) {
      return res.status(400).json({ error: `invalid category "${category}"`, allowed: CATEGORIES })
    }
    where.push('p.category = @category')
    params.category = String(category)
  }
  const toNumber = (v) => {
    if (v === undefined || v === null || v === '') return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  const min = toNumber(minPrice)
  const max = toNumber(maxPrice)
  if (min !== null) {
    where.push('p.price_dzd >= @min')
    params.min = min
  }
  if (max !== null) {
    where.push('p.price_dzd <= @max')
    params.max = max
  }
  if (featured === '1' || featured === 'true') where.push('p.is_featured = 1')

  const order = SORTS[String(sort)] || SORTS.newest
  const sql = `SELECT p.* FROM products p ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${order}`
  res.json(db.prepare(sql).all(params).map(mapProduct))
})

router.get('/:id', (req, res) => {
  const id = Number(req.params.id)
  const product = Number.isInteger(id) ? mapProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(id)) : null
  if (!product) return res.status(404).json({ error: 'product not found' })
  res.json(product)
})

export default router
