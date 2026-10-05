/**
 * DZD formatting.
 *
 * The brand rule is a Latin-digit number grouped with a plain space and a
 * local currency suffix: `145 000 DA` (fr) / `145 000 دج` (ar).
 * `Intl.NumberFormat('ar-DZ')` returns Arabic-Indic digits (٠١٢٣), which the
 * brand does not use, so grouping is done manually and `Intl` is only used for
 * the thousands fallback when the manual path is unavailable.
 */
import type { Lang } from '../i18n'

const CURRENCY: Record<Lang, string> = { ar: 'دج', fr: 'DA' }

/** Group the integer part in threes with a plain space, keep up to 2 decimals. */
function groupThousands(value: number): string {
  const negative = value < 0
  const [intPart, decPart] = Math.abs(value).toFixed(2).split('.')
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  const decimals = decPart === '00' ? '' : `.${decPart.replace(/0$/, '')}`
  return `${negative ? '-' : ''}${grouped}${decimals}`
}

/** 145000 -> "145 000 دج" / "145 000 DA" */
export function formatDZD(value: number | null | undefined, lang: Lang): string {
  const amount = Number(value ?? 0)
  const safe = Number.isFinite(amount) ? amount : 0
  let body: string
  try {
    body = groupThousands(safe)
  } catch {
    body = new Intl.NumberFormat(lang === 'ar' ? 'ar-DZ' : 'fr-DZ', { maximumFractionDigits: 0 }).format(safe)
  }
  return `${body} ${CURRENCY[lang]}`
}

/** Price with the crossed-out reference price when there is a discount. */
export function priceParts(product: { price_dzd: number; old_price_dzd: number | null }, lang: Lang) {
  return {
    price: formatDZD(product.price_dzd, lang),
    oldPrice: product.old_price_dzd ? formatDZD(product.old_price_dzd, lang) : null,
  }
}

export const CATEGORY_KEYS = ['smartphones', 'laptops', 'accessories'] as const
export type Category = (typeof CATEGORY_KEYS)[number]

export const ORDER_STATUSES = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export function isCategory(value: string): value is Category {
  return (CATEGORY_KEYS as readonly string[]).includes(value)
}

export function storageKeys() {
  return { cart: 'akrem-cart', theme: 'akrem-theme', lang: 'akrem-lang', adminToken: 'akrem-admin-token' }
}

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full or blocked — the app still works in-memory */
  }
}
