import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { readJSON, storageKeys, writeJSON } from '../lib/format'
import { api, type Product } from '../lib/api'

export type CartLine = {
  productId: number
  name: string
  name_fr: string
  brand: string
  imageUrl: string
  priceDzd: number
  stock: number
  quantity: number
}

type CartValue = {
  lines: CartLine[]
  count: number
  subtotalDzd: number
  add: (product: Product, quantity?: number) => void
  setQuantity: (productId: number, quantity: number) => void
  remove: (productId: number) => void
  clear: () => void
  /** Local sanity check; the server re-validates everything on POST /api/orders. */
  outOfStockIds: () => number[]
}

const CartContext = createContext<CartValue | null>(null)
const KEY = storageKeys().cart

function readCart(): CartLine[] {
  const raw = readJSON<CartLine[]>(KEY, [])
  return Array.isArray(raw)
    ? raw.filter((line) => line && typeof line.productId === 'number' && typeof line.quantity === 'number')
    : []
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(readCart)

  useEffect(() => {
    writeJSON(KEY, lines)
  }, [lines])

  const add = useCallback((product: Product, quantity = 1) => {
    setLines((current) => {
      const existing = current.find((line) => line.productId === product.id)
      const wanted = (existing?.quantity ?? 0) + quantity
      const capped = Math.max(1, Math.min(wanted, Math.max(1, product.stock)))
      const next: CartLine = {
        productId: product.id,
        name: product.name,
        name_fr: product.name_fr,
        brand: product.brand,
        imageUrl: product.image_url,
        priceDzd: product.price_dzd,
        stock: product.stock,
        quantity: capped,
      }
      return existing
        ? current.map((line) => (line.productId === product.id ? next : line))
        : [...current, next]
    })
  }, [])

  const setQuantity = useCallback((productId: number, quantity: number) => {
    setLines((current) =>
      current
        .map((line) =>
          line.productId === productId
            ? { ...line, quantity: Math.max(0, Math.min(Math.floor(quantity) || 0, Math.max(1, line.stock))) }
            : line
        )
        .filter((line) => line.quantity > 0)
    )
  }, [])

  const remove = useCallback((productId: number) => {
    setLines((current) => current.filter((line) => line.productId !== productId))
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const value = useMemo<CartValue>(() => {
    const count = lines.reduce((sum, line) => sum + line.quantity, 0)
    const subtotalDzd = lines.reduce((sum, line) => sum + line.priceDzd * line.quantity, 0)
    return {
      lines,
      count,
      subtotalDzd,
      add,
      setQuantity,
      remove,
      clear,
      outOfStockIds: () => lines.filter((line) => line.quantity > line.stock).map((line) => line.productId),
    }
  }, [lines, add, setQuantity, remove, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartValue {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside <CartProvider>')
  return context
}

/** Re-exported so pages can build the order payload without importing the api module twice. */
export { api }
