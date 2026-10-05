import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useI18n } from '../i18n'
import { api, type Product } from '../lib/api'
import { CATEGORY_KEYS, isCategory, type Category } from '../lib/format'
import { Alert, ProductCard, ProductGridSkeleton } from '../components/ui'
import { useCart } from '../context/CartContext'

export default function Products() {
  const { t, categoryLabel } = useI18n()
  const { add } = useCart()
  const [params, setParams] = useSearchParams()
  const [brands, setBrands] = useState<string[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const q = params.get('q') ?? ''
  const brand = params.get('brand') ?? ''
  const rawCategory = params.get('category') ?? ''
  const category = isCategory(rawCategory) ? rawCategory : ''
  const minPrice = params.get('minPrice') ?? ''
  const maxPrice = params.get('maxPrice') ?? ''
  const sort = params.get('sort') ?? 'newest'
  const featured = params.get('featured') ?? ''

  const [searchInput, setSearchInput] = useState(q)
  useEffect(() => setSearchInput(q), [q])

  useEffect(() => {
    let alive = true
    api.brands().then((list) => alive && setBrands(list)).catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    let alive = true
    setLoading(true)
    api
      .products({ search: q, brand, category, minPrice, maxPrice, sort, featured })
      .then((list) => {
        if (!alive) return
        setProducts(list)
        setError('')
      })
      .catch((err: Error) => alive && setError(err.message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [q, brand, category, minPrice, maxPrice, sort, featured])

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    update('q', searchInput.trim())
  }

  const title = category ? categoryLabel(category as Category) : t('nav.shop')

  return (
    <div className="container">
      <div className="page-head">
        <h1>{title}</h1>
        <p>{q ? `${t('common.results')}: ${products.length} — "${q}"` : `${products.length} ${t('common.products')}`}</p>
      </div>

      <form className="filters" onSubmit={submitSearch}>
        <div className="field">
          <label htmlFor="search">{t('hero.search')}</label>
          <input
            id="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t('hero.p1')}
          />
        </div>

        <div className="field">
          <label htmlFor="brand">{t('common.brand')}</label>
          <select id="brand" value={brand} onChange={(event) => update('brand', event.target.value)}>
            <option value="">{t('common.brand')} — </option>
            {brands.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="category">{t('nav.categories')}</label>
          <select id="category" value={category} onChange={(event) => update('category', event.target.value)}>
            <option value="">{t('nav.categories')} — </option>
            {CATEGORY_KEYS.map((item) => (
              <option key={item} value={item}>
                {categoryLabel(item as Category)}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="sort">{t('common.total')}</label>
          <select id="sort" value={sort} onChange={(event) => update('sort', event.target.value)}>
            <option value="newest">{t('common.new')}</option>
            <option value="price_asc">{t('common.price')} ↑</option>
            <option value="price_desc">{t('common.price')} ↓</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="minPrice">{`${t('common.price')} (دج)`}</label>
          <div className="price-range">
            <input
              id="minPrice"
              type="number"
              min="0"
              inputMode="numeric"
              value={minPrice}
              placeholder="0"
              onChange={(event) => update('minPrice', event.target.value)}
            />
            <span className="muted">—</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={maxPrice}
              placeholder="350000"
              onChange={(event) => update('maxPrice', event.target.value)}
            />
          </div>
        </div>
      </form>

      {error && <Alert kind="error">{error}</Alert>}

      {loading ? (
        <ProductGridSkeleton count={8} />
      ) : products.length === 0 ? (
        <div className="empty-state">
          <h3>{t('common.noResults')}</h3>
          <button type="button" className="btn btn-outline" style={{ marginTop: '0.75rem' }} onClick={() => setParams(new URLSearchParams(), { replace: true })}>
            {t('common.retry')}
          </button>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={(item) => {
                add(item, 1)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
