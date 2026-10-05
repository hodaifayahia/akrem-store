import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useI18n } from '../i18n'
import { api, ApiError, type AdminStats, type Order, type Product } from '../lib/api'
import { storageKeys, ORDER_STATUSES, type Category, type OrderStatus } from '../lib/format'
import { Alert, Loading } from '../components/ui'
import { CloseIcon, PlusIcon, TrashIcon } from '../components/icons'

const TOKEN_KEY = storageKeys().adminToken

const readToken = (): string => {
  try {
    return window.localStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

const saveToken = (token: string) => {
  try {
    window.localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* ignore */
  }
}

const clearToken = () => {
  try {
    window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

/** Sends the visitor to the login screen when the signed token is missing/expired. */
function useAdminToken(): string {
  const [token, setToken] = useState(readToken)
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail
      setToken(detail)
    }
    window.addEventListener('akrem-token', handler)
    return () => window.removeEventListener('akrem-token', handler)
  }, [])
  return token
}

function logout(navigate: ReturnType<typeof useNavigate>) {
  clearToken()
  window.dispatchEvent(new CustomEvent('akrem-token', { detail: '' }))
  navigate('/admin/login', { replace: true })
}

/* ------------------------------------------------------------------ login */
export function AdminLogin() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const token = useAdminToken()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (token) return <Navigate to="/admin" replace />

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await api.adminLogin(password)
      saveToken(result.token)
      window.dispatchEvent(new CustomEvent('akrem-token', { detail: result.token }))
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? t('admin.loginFailed') : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container">
      <div className="login-wrap panel">
        <h1 style={{ fontSize: '1.5rem' }}>{t('admin.login')}</h1>
        {error && <Alert kind="error">{error}</Alert>}
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="password">{t('admin.password')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              dir="ltr"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? t('common.loading') : t('admin.signin')}
          </button>
        </form>
        <p className="muted" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
          <Link to="/">{t('common.home')}</Link>
        </p>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------- dashboard */
export function AdminDashboard() {
  const { t, money } = useI18n()
  const navigate = useNavigate()
  const token = useAdminToken()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const reload = () => {
    if (!token) return
    setLoading(true)
    Promise.all([api.adminStats(token), api.adminOrders(token)])
      .then(([statsResult, ordersResult]) => {
        setStats(statsResult)
        setOrders(ordersResult)
        setError('')
      })
      .catch((err: Error) => {
        setError(err.message)
        if (err instanceof ApiError && err.status === 401) {
          clearToken()
          window.dispatchEvent(new CustomEvent('akrem-token', { detail: '' }))
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(reload, [token])

  if (!token) return <Navigate to="/admin/login" replace />
  if (loading && !stats) return <Loading />

  const changeStatus = async (id: number, status: OrderStatus) => {
    try {
      const updated = await api.adminSetOrderStatus(token, id, status)
      setOrders((current) => current.map((order) => (order.id === id ? updated : order)))
    } catch (err) {
      setError(String(err))
    }
  }

  return (
    <div className="container">
      <div className="page-head">
        <h1>{t('admin.dashboard')}</h1>
      </div>

      <div className="admin-shell">
        <div className="admin-nav">
          <nav style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/admin" className="btn btn-outline btn-sm">
              {t('admin.dashboard')}
            </Link>
            <Link to="/admin/products" className="btn btn-outline btn-sm">
              {t('admin.products')}
            </Link>
          </nav>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => logout(navigate)}>
            {t('admin.logout')}
          </button>
        </div>

        {error && <Alert kind="error">{error}</Alert>}

        <div className="kpi-grid">
          <div className="kpi">
            <div className="kpi-value">{stats?.products ?? 0}</div>
            <div className="kpi-label">{t('admin.statProducts')}</div>
          </div>
          <div className="kpi">
            <div className="kpi-value">{stats?.orders ?? 0}</div>
            <div className="kpi-label">{t('admin.statOrders')}</div>
          </div>
          <div className="kpi">
            <div className="kpi-value">{money(stats?.revenue_dzd ?? 0)}</div>
            <div className="kpi-label">{t('admin.statRevenue')}</div>
          </div>
          <div className="kpi">
            <div className="kpi-value">{stats?.low_stock ?? 0}</div>
            <div className="kpi-label">{t('admin.statLowStock')}</div>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{t('admin.ref')}</th>
                <th>{t('admin.customer')}</th>
                <th>{t('order.items')}</th>
                <th>{t('common.total')}</th>
                <th>{t('admin.status')}</th>
                <th>{t('admin.date')}</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center' }}>
                    {t('admin.noOrders')}
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td dir="ltr">
                      <Link to={`/order/${order.reference}`}>{order.reference}</Link>
                    </td>
                    <td>
                      {order.customer_name}
                      <div className="order-items-cell" dir="ltr">
                        {order.phone} · {order.commune}
                      </div>
                    </td>
                    <td className="order-items-cell">
                      {order.items.map((item) => `${item.product_name} ×${item.quantity}`).join(' · ')}
                    </td>
                    <td>{money(order.total_dzd)}</td>
                    <td>
                      <select
                        className="status-select"
                        value={order.status}
                        onChange={(event) => changeStatus(order.id, event.target.value as OrderStatus)}
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {t(`status.${status}`)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------- admin products */
type Draft = {
  name: string
  name_fr: string
  brand: string
  category: string
  price_dzd: string
  old_price_dzd: string
  stock: string
  rating: string
  image_url: string
  description: string
  ram: string
  storage: string
  screen: string
  battery: string
  is_featured: boolean
}

const emptyDraft: Draft = {
  name: '',
  name_fr: '',
  brand: '',
  category: 'smartphones',
  price_dzd: '',
  old_price_dzd: '',
  stock: '0',
  rating: '4.5',
  image_url: '',
  description: '',
  ram: '',
  storage: '',
  screen: '',
  battery: '',
  is_featured: false,
}

const toDraft = (product: Product): Draft => ({
  name: product.name,
  name_fr: product.name_fr,
  brand: product.brand,
  category: product.category,
  price_dzd: String(product.price_dzd),
  old_price_dzd: product.old_price_dzd === null ? '' : String(product.old_price_dzd),
  stock: String(product.stock),
  rating: String(product.rating),
  image_url: product.image_url,
  description: product.description,
  ram: product.specs?.ram || '',
  storage: product.specs?.storage || '',
  screen: product.specs?.screen || '',
  battery: product.specs?.battery || '',
  is_featured: product.is_featured === 1,
})

export function AdminProductsPage() {
  const { t, money } = useI18n()
  const navigate = useNavigate()
  const token = useAdminToken()
  const [products, setProducts] = useState<Product[]>([])
  const [draft, setDraft] = useState<Draft | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    if (!token) return
    setLoading(true)
    api
      .adminProducts(token)
      .then((list) => {
        setProducts(list)
        setError('')
      })
      .catch((err: Error) => {
        setError(err.message)
        if (err instanceof ApiError && err.status === 401) {
          clearToken()
          window.dispatchEvent(new CustomEvent('akrem-token', { detail: '' }))
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [token])

  if (!token) return <Navigate to="/admin/login" replace />

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft) return
    const payload: Partial<Product> = {
      name: draft.name,
      name_fr: draft.name_fr || draft.name,
      brand: draft.brand,
      category: draft.category as Category,
      price_dzd: Number(draft.price_dzd),
      old_price_dzd: draft.old_price_dzd === '' ? null : Number(draft.old_price_dzd),
      stock: Number(draft.stock),
      rating: Number(draft.rating),
      image_url: draft.image_url,
      description: draft.description,
      description_fr: draft.description,
      specs: { ram: draft.ram, storage: draft.storage, screen: draft.screen, battery: draft.battery },
      is_featured: draft.is_featured ? 1 : 0,
    }
    try {
      if (editingId) await api.adminUpdateProduct(token, editingId, payload)
      else await api.adminCreateProduct(token, payload)
      setDraft(null)
      setEditingId(null)
      setNotice(t('admin.saved'))
      load()
    } catch (err) {
      const message = err instanceof ApiError ? `${err.message}${err.details.length ? ` — ${err.details.join(' · ')}` : ''}` : String(err)
      setError(message)
    }
  }

  const remove = async (product: Product) => {
    if (!window.confirm(`${t('admin.deleteConfirm')} — ${product.name}`)) return
    try {
      await api.adminDeleteProduct(token, product.id)
      setNotice(t('admin.deleted'))
      load()
    } catch (err) {
      setError(String(err))
    }
  }

  const field = (key: keyof Draft, label: string, type = 'text') => (
    <div className="field">
      <label htmlFor={`f-${key}`}>{label}</label>
      <input
        id={`f-${key}`}
        type={type}
        value={draft ? draft[key] : ''}
        onChange={(event) => setDraft((current) => (current ? { ...current, [key]: event.target.value } : current))}
      />
    </div>
  )

  return (
    <div className="container">
      <div className="page-head">
        <h1>{t('admin.products')}</h1>
      </div>

      <div className="admin-shell">
        <div className="admin-nav">
          <nav style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/admin" className="btn btn-outline btn-sm">
              {t('admin.dashboard')}
            </Link>
            <Link to="/admin/products" className="btn btn-outline btn-sm">
              {t('admin.products')}
            </Link>
          </nav>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setDraft({ ...emptyDraft })
                setEditingId(null)
              }}
            >
              <PlusIcon size={15} />
              {t('admin.newProduct')}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => logout(navigate)}>
              {t('admin.logout')}
            </button>
          </div>
        </div>

        {error && <Alert kind="error">{error}</Alert>}
        {notice && <Alert kind="success">{notice}</Alert>}

        {loading ? (
          <Loading />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('admin.name')}</th>
                  <th>{t('common.brand')}</th>
                  <th>{t('common.price')}</th>
                  <th>{t('product.qty')}</th>
                  <th>{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center' }}>
                      {t('admin.noProducts')}
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td style={{ whiteSpace: 'normal' }}>
                        <Link to={`/product/${product.id}`}>{product.name}</Link>
                      </td>
                      <td>{product.brand}</td>
                      <td>{money(product.price_dzd)}</td>
                      <td>{product.stock}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              setDraft(toDraft(product))
                              setEditingId(product.id)
                            }}
                          >
                            {t('common.edit')}
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => remove(product)}
                            aria-label={t('common.delete')}
                          >
                            <TrashIcon size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {draft && (
        <div className="modal-backdrop" onClick={() => setDraft(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-head">
              <h2 style={{ fontSize: '1.2rem' }}>{editingId ? t('admin.editProduct') : t('admin.newProduct')}</h2>
              <button type="button" className="icon-btn" onClick={() => setDraft(null)} aria-label={t('common.close')}>
                <CloseIcon size={18} />
              </button>
            </div>
            <form onSubmit={save}>
              <div className="form-grid">
                {field('name', t('admin.name'))}
                {field('name_fr', t('admin.nameFr'))}
                {field('brand', t('common.brand'))}
                <div className="field">
                  <label htmlFor="f-category">{t('nav.categories')}</label>
                  <select
                    id="f-category"
                    value={draft.category}
                    onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                  >
                    <option value="smartphones">smartphones</option>
                    <option value="laptops">laptops</option>
                    <option value="accessories">accessories</option>
                  </select>
                </div>
                {field('price_dzd', t('common.price'), 'number')}
                {field('old_price_dzd', t('admin.statProducts'), 'number')}
                {field('stock', t('product.qty'), 'number')}
                {field('rating', t('common.rating'), 'number')}
                <div className="field span-2">
                  <label htmlFor="f-image">{t('admin.image')}</label>
                  <input
                    id="f-image"
                    value={draft.image_url}
                    onChange={(event) => setDraft({ ...draft, image_url: event.target.value })}
                    dir="ltr"
                  />
                </div>
                <div className="field span-2">
                  <label htmlFor="f-description">{t('admin.description')}</label>
                  <textarea
                    id="f-description"
                    value={draft.description}
                    onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                  />
                </div>
                {field('ram', t('product.ram'))}
                {field('storage', t('product.storage'))}
                {field('screen', t('product.screen'))}
                {field('battery', t('product.battery'))}
                <div className="field span-2">
                  <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={draft.is_featured}
                      onChange={(event) => setDraft({ ...draft, is_featured: event.target.checked })}
                    />
                    {t('admin.featured')}
                  </label>
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-block">
                {t('common.save')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}