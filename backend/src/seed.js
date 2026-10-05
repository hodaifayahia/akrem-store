/**
 * `npm run seed` — rebuild the SQLite database from scratch and reload the
 * catalogue. Safe to re-run: it drops products/orders/order_items first.
 */
import { resetAndSeed, DB_PATH } from './db.js'

const { products, db } = resetAndSeed()
console.log(`[seed] database rebuilt: ${db}`)
console.log(`[seed] ${products} products inserted`)
