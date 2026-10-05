import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { PRODUCTS } from './seed-data.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const DATA_DIR = path.resolve(__dirname, '..', 'data')
export const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.cwd(), process.env.DB_PATH)
  : path.join(DATA_DIR, 'store.db')

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

export const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const SCHEMA = `
CREATE TABLE IF NOT EXISTS products (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT    NOT NULL,
  name_fr        TEXT    NOT NULL DEFAULT '',
  brand          TEXT    NOT NULL,
  category       TEXT    NOT NULL CHECK (category IN ('smartphones','laptops','accessories')),
  price_dzd      INTEGER NOT NULL,
  old_price_dzd  INTEGER,
  description    TEXT    NOT NULL DEFAULT '',
  description_fr TEXT    NOT NULL DEFAULT '',
  image_url      TEXT    NOT NULL DEFAULT '',
  specs          TEXT    NOT NULL DEFAULT '{}',
  stock          INTEGER NOT NULL DEFAULT 0,
  rating         REAL    NOT NULL DEFAULT 0,
  is_featured    INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  reference        TEXT    NOT NULL UNIQUE,
  customer_name    TEXT    NOT NULL,
  phone            TEXT    NOT NULL,
  wilaya           TEXT    NOT NULL,
  commune          TEXT    NOT NULL DEFAULT '',
  address          TEXT    NOT NULL DEFAULT '',
  note             TEXT    NOT NULL DEFAULT '',
  delivery_method  TEXT    NOT NULL DEFAULT 'cod',
  delivery_fee_dzd INTEGER NOT NULL DEFAULT 0,
  subtotal_dzd     INTEGER NOT NULL DEFAULT 0,
  total_dzd        INTEGER NOT NULL DEFAULT 0,
  status           TEXT    NOT NULL DEFAULT 'new'
                   CHECK (status IN ('new','confirmed','shipped','delivered','cancelled')),
  created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id       INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id     INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name   TEXT    NOT NULL,
  unit_price_dzd INTEGER NOT NULL,
  quantity       INTEGER NOT NULL,
  line_total_dzd INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand    ON products(brand);
CREATE INDEX IF NOT EXISTS idx_orders_created    ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
`

/** Create tables if they do not exist yet (idempotent migration). */
export function migrate() {
  db.exec(SCHEMA)
}



/** Insert the catalogue. created_at is staggered so "newest" ordering is stable. */
export function insertSeedProducts() {
  // Prepared here, not at module scope: the table only exists after migrate().
  const insertProduct = db.prepare(`
    INSERT INTO products
      (name, name_fr, brand, category, price_dzd, old_price_dzd, description, description_fr,
       image_url, specs, stock, rating, is_featured, created_at)
    VALUES
      (@name, @name_fr, @brand, @category, @price_dzd, @old_price_dzd, @description, @description_fr,
       @image_url, @specs, @stock, @rating, @is_featured, @created_at)
  `)
  const base = Date.now() - PRODUCTS.length * 36e5
  const tx = db.transaction((rows) => {
    for (const [i, p] of rows.entries()) {
      insertProduct.run({ ...p, specs: JSON.stringify(p.specs || {}), created_at: new Date(base + i * 36e5).toISOString() })
    }
  })
  tx(PRODUCTS)
  return PRODUCTS.length
}

/** Seed only when the catalogue is empty (called on server boot). */
export function seedIfEmpty() {
  migrate()
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM products').get()
  if (n > 0) return 0
  return insertSeedProducts()
}

/** Drop everything and re-create the schema + catalogue. Used by `npm run seed`. */
export function resetAndSeed() {
  db.exec(`
    DROP TABLE IF EXISTS order_items;
    DROP TABLE IF EXISTS orders;
    DROP TABLE IF EXISTS products;
  `)
  migrate()
  return { products: insertSeedProducts(), db: DB_PATH }
}

/** Row -> API shape (specs JSON is parsed into an object). */
export function mapProduct(row) {
  if (!row) return null
  let specs = {}
  try {
    specs = row.specs ? JSON.parse(row.specs) : {}
  } catch {
    specs = {}
  }
  return { ...row, is_featured: Number(row.is_featured), specs }
}

export function mapOrder(row) {
  if (!row) return null
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id').all(row.id)
  return { ...row, items }
}
