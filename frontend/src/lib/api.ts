import type { Category, OrderStatus } from './format'

/**
 * Same-origin by default: the Vite dev server proxies /api to localhost:4000, and
 * in production the Express server serves both the API and the built storefront.
 * Point VITE_API_BASE at an absolute URL only when the API lives on another host.
 */
const BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '')

export type Specs = { ram?: string; storage?: string; screen?: string; battery?: string }

export type Product = {
  id: number
  name: string
  name_fr: string
  brand: string
  category: Category
  price_dzd: number
  old_price_dzd: number | null
  description: string
  description_fr: string
  image_url: string
  specs: Specs
  stock: number
  rating: number
  is_featured: number
  created_at: string
}

export type OrderItem = {
  id: number
  order_id: number
  product_id: number | null
  product_name: string
  unit_price_dzd: number
  quantity: number
  line_total_dzd: number
}

export type Order = {
  id: number
  reference: string
  customer_name: string
  phone: string
  /** wilaya code (1-58) as stored by the server */
  wilaya: string
  commune: string
  address: string
  note: string
  delivery_method: 'cod'
  delivery_fee_dzd: number
  subtotal_dzd: number
  total_dzd: number
  status: OrderStatus
  created_at: string
  items: OrderItem[]
}

export type Wilaya = { code: number; ar: string; fr: string; fee: number }

export type AdminStats = {
  products: number
  orders: number
  revenue_dzd: number
  low_stock: number
  by_status: Record<string, number>
}

export class ApiError extends Error {
  status: number
  details: string[]
  constructor(status: number, message: string, details: string[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE}${path}`, {
      headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
      ...init,
    })
  } catch {
    throw new ApiError(0, 'network error: the API is not reachable')
  }
  const text = await response.text()
  let payload: unknown = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }
  if (!response.ok) {
    const data = (payload || {}) as { error?: string; details?: string[] }
    throw new ApiError(response.status, data.error || `request failed (${response.status})`, data.details || [])
  }
  return payload as T
}

const query = (params: Record<string, string | number | undefined | null>) => {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

/* ------------------------------------------------------------------ public */
export const api = {
  health: () => request<{ ok: boolean }>('/health'),

  products: (params: {
    search?: string
    brand?: string
    category?: string
    minPrice?: string
    maxPrice?: string
    sort?: string
    featured?: string
  } = {}) => request<Product[]>(`/products${query(params)}`),

  brands: () => request<string[]>('/products/brands'),

  wilayas: () => request<Wilaya[]>('/products/wilayas'),

  product: (id: number | string) => request<Product>(`/products/${id}`),

  createOrder: (payload: {
    customer: { name: string; phone: string; wilaya: string | number; commune: string; address: string; note?: string }
    items: { productId: number; quantity: number }[]
  }) => request<Order>('/orders', { method: 'POST', body: JSON.stringify(payload) }),

  trackOrder: (reference: string) => request<Order>(`/orders/track/${encodeURIComponent(reference)}`),

  /* ------------------------------------------------------------------ admin */
  adminLogin: (password: string) => request<{ token: string; expiresInHours: number }>('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  }),

  adminProducts: (token: string) => request<Product[]>('/admin/products', auth(token)),

  adminCreateProduct: (token: string, product: Partial<Product>) =>
    request<Product>('/admin/products', { ...auth(token), method: 'POST', body: JSON.stringify(product) }),

  adminUpdateProduct: (token: string, id: number, product: Partial<Product>) =>
    request<Product>(`/admin/products/${id}`, { ...auth(token), method: 'PUT', body: JSON.stringify(product) }),

  adminDeleteProduct: (token: string, id: number) =>
    request<{ deleted: boolean; id: number }>(`/admin/products/${id}`, { ...auth(token), method: 'DELETE' }),

  adminOrders: (token: string) => request<Order[]>('/admin/orders', auth(token)),

  adminSetOrderStatus: (token: string, id: number, status: OrderStatus) =>
    request<Order>(`/admin/orders/${id}`, { ...auth(token), method: 'PATCH', body: JSON.stringify({ status }) }),

  adminStats: (token: string) => request<AdminStats>('/admin/stats', auth(token)),
}

function auth(token: string): RequestInit {
  return { headers: { Authorization: `Bearer ${token}` } }
}
