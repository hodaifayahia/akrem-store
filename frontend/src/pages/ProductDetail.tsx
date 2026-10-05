import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useCart } from '../context/CartContext'
import { api, type Product } from '../lib/api'
import { Alert, Loading, ProductCard, SectionHead, SmartImage, Stars, StockBadge } from '../components/ui'
import { CartIcon, MinusIcon, PlusIcon } from '../components/icons'

export default function ProductDetail() {
  const { id } = useParams()
  const { t, money, productName, productDescription, categoryLabel, whatsappLink } = useI18n()
  const { add } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    api
      .product(id ?? '')
      .then(async (found) => {
        if (!alive) return
        setProduct(found)
        setQuantity(1)
        setError('')
        const sameCategory = await api.products({ category: found.category, sort: 'newest' })
        if (alive) setRelated(sameCategory.filter((item) => item.id !== found.id).slice(0, 4))
      })
      .catch((err: Error) => alive && setError(err.message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [id])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(false), 2200)
    return () => window.clearTimeout(timer)
  }, [toast])

  if (loading) return <Loading />
  if (error || !product) {
    return (
      <div className="container">
        <div style={{ marginTop: '2rem' }}>
          <Alert kind="error">{error || t('common.error')}</Alert>
          <Link to="/products" className="btn btn-outline">
            {t('product.back')}
          </Link>
        </div>
      </div>
    )
  }

  const name = productName(product)
  const specs: [string, string][] = [
    [t('product.ram'), product.specs?.ram || '-'],
    [t('product.storage'), product.specs?.storage || '-'],
    [t('product.screen'), product.specs?.screen || '-'],
    [t('product.battery'), product.specs?.battery || '-'],
  ]

  return (
    <div className="container">
      <div className="breadcrumb">
        <Link to="/">{t('common.home')}</Link>
        <span>/</span>
        <Link to={`/products?category=${product.category}`}>{categoryLabel(product.category)}</Link>
        <span>/</span>
        <span>{name}</span>
      </div>

      <div className="product-layout" style={{ marginTop: '1rem' }}>
        <div className="product-gallery">
          <SmartImage src={product.image_url} alt={name} />
        </div>

        <div>
          <span className="chip chip-primary">{product.brand}</span>
          <h1 style={{ margin: '0.6rem 0 0.35rem', fontSize: 'clamp(1.4rem, 3.4vw, 2.1rem)' }}>{name}</h1>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.9rem' }}>
            <Stars rating={product.rating} />
            <StockBadge stock={product.stock} />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span className="price" style={{ fontSize: '1.6rem' }}>
              {money(product.price_dzd)}
            </span>
            {product.old_price_dzd ? <span className="price-old">{money(product.old_price_dzd)}</span> : null}
          </div>

          <p className="muted" style={{ margin: '0.9rem 0' }}>
            {productDescription(product)}
          </p>

          <h3 style={{ marginBottom: '0.5rem' }}>{t('product.specs')}</h3>
          <table className="specs-table">
            <tbody>
              {specs.map(([label, value]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', margin: '1.25rem 0 0.75rem', flexWrap: 'wrap' }}>
            <span className="muted">{t('product.qty')}</span>
            <div className="qty">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                disabled={quantity <= 1}
                aria-label="-"
              >
                <MinusIcon size={16} />
              </button>
              <span>{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.min(Math.max(1, product.stock), value + 1))}
                disabled={quantity >= Math.max(1, product.stock)}
                aria-label="+"
              >
                <PlusIcon size={16} />
              </button>
            </div>
            <span className="price" style={{ marginInlineStart: 'auto' }}>
              {money(product.price_dzd * quantity)}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={product.stock <= 0}
              onClick={() => {
                add(product, quantity)
                setToast(true)
              }}
            >
              <CartIcon size={18} />
              {product.stock > 0 ? t('common.addToCart') : t('common.outOfStock')}
            </button>
            <a
              className="btn btn-whatsapp"
              href={whatsappLink(`${name} — ${money(product.price_dzd)}`)}
              target="_blank"
              rel="noreferrer noopener"
            >
              {t('hero.cta')}
            </a>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section">
          <SectionHead title={t('product.related')} />
          <div className="product-grid">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      {toast && <div className="toast">{t('common.added')}</div>}
    </div>
  )
}
