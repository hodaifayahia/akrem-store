import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useI18n, type TKey } from '../i18n'
import { useCart } from '../context/CartContext'
import type { Product } from '../lib/api'
import type { Category, OrderStatus } from '../lib/format'
import { CartIcon, MapIcon, PhoneIcon, ShieldIcon, SparkIcon, StarIcon, TruckIcon, WhatsappIcon } from './icons'

/* ------------------------------------------------------------------ image */
export function SmartImage({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div className="img-placeholder" role="img" aria-label={alt}>
        <PhoneIcon size={30} />
        <span>AKREM</span>
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

/* ------------------------------------------------------------------ misc */
export function Stars({ rating }: { rating: number }) {
  return (
    <span className="stars">
      <StarIcon size={13} />
      {rating.toFixed(1)}
    </span>
  )
}

export function SectionHead({
  title,
  subtitle,
  more,
}: {
  title: string
  subtitle?: string
  more?: { to: string; label: string }
}) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {more && (
        <Link to={more.to} className="btn btn-outline btn-sm">
          {more.label}
        </Link>
      )}
    </div>
  )
}

export function Alert({ kind, children }: { kind: 'error' | 'success' | 'info'; children: ReactNode }) {
  return <div className={`alert alert-${kind}`}>{children}</div>
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <CartIcon size={30} />
      <h3 style={{ marginTop: '0.5rem' }}>{title}</h3>
      <p className="muted">{text}</p>
      {action && <div style={{ marginTop: '1rem' }}>{action}</div>}
    </div>
  )
}

const STATUS_CHIP: Record<OrderStatus, string> = {
  new: 'chip-primary',
  confirmed: 'chip-warning',
  shipped: 'chip-primary',
  delivered: 'chip-success',
  cancelled: 'chip-danger',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { statusLabel } = useI18n()
  return <span className={`chip ${STATUS_CHIP[status]}`}>{statusLabel(status)}</span>
}

export function StockBadge({ stock }: { stock: number }) {
  const { t } = useI18n()
  if (stock <= 0) return <span className="chip chip-danger">{t('common.outOfStock')}</span>
  if (stock <= 5) return <span className="chip chip-warning">{`${stock} · ${t('common.lowStock')}`}</span>
  return <span className="chip chip-success">{t('common.inStock')}</span>
}

/* ---------------------------------------------------------- product card */
export function ProductCard({ product, onAdd }: { product: Product; onAdd?: (product: Product) => void }) {
  const { t, money, productName, productDescription, categoryLabel } = useI18n()
  const { add } = useCart()
  const name = productName(product)
  const specs = [product.specs?.ram, product.specs?.storage].filter(Boolean).join(' · ')

  const handleAdd = () => {
    if (product.stock <= 0) return
    if (onAdd) onAdd(product)
    else add(product, 1)
  }

  return (
    <article className="product-card">
      <Link to={`/product/${product.id}`} className="product-media" aria-label={name}>
        <div className="media-top">
          {product.is_featured === 1 && <span className="chip chip-primary">{t('common.new')}</span>}
        </div>
        <SmartImage src={product.image_url} alt={name} />
      </Link>
      <div className="product-body">
        <span className="product-brand">
          {product.brand} · {categoryLabel(product.category as Category)}
        </span>
        <Link to={`/product/${product.id}`} className="product-name">
          {name}
        </Link>
        <p className="product-specs">
          {specs || productDescription(product).slice(0, 60)}
        </p>
        <div className="product-foot">
          <div>
            <span className="price">{money(product.price_dzd)}</span>
            {product.old_price_dzd ? <span className="price-old">{money(product.old_price_dzd)}</span> : null}
          </div>
          <Stars rating={product.rating} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{ flex: 1 }}
            disabled={product.stock <= 0}
            onClick={handleAdd}
          >
            {product.stock > 0 ? t('common.addToCart') : t('common.outOfStock')}
          </button>
          <StockBadge stock={product.stock} />
        </div>
      </div>
    </article>
  )
}

/* ------------------------------------------------------------ trust strip */
const TRUST: { key: TKey; Icon: typeof ShieldIcon }[] = [
  { key: 'trust.authentic', Icon: ShieldIcon },
  { key: 'trust.wilayas', Icon: MapIcon },
  { key: 'trust.warranty', Icon: SparkIcon },
  { key: 'trust.delivery', Icon: TruckIcon },
]

export function TrustStrip() {
  const { t } = useI18n()
  return (
    <div className="trust-strip">
      {TRUST.map(({ key, Icon }) => (
        <div className="trust-item" key={key}>
          <span className="trust-icon">
            <Icon size={17} />
          </span>
          {t(key)}
        </div>
      ))}
    </div>
  )
}

/* ---------------------------------------------------------------- marquee */
export function Marquee() {
  const { t } = useI18n()
  const words = [t('trust.delivery'), t('trust.warranty'), t('checkout.cod'), t('footer.madeIn'), t('trust.authentic')]
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {[0, 1].map((copy) => (
          <div key={copy} style={{ display: 'flex', gap: '2.5rem' }}>
            {words.map((word) => (
              <span className="marquee-item" key={`${copy}-${word}`}>
                <SparkIcon size={14} />
                {word}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/* --------------------------------------------------------- whatsapp float */
export function WhatsAppFab() {
  const { whatsappLink } = useI18n()
  return (
    <a
      className="fab"
      href={whatsappLink()}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="WhatsApp"
    >
      <WhatsappIcon size={26} />
    </a>
  )
}

/* ---------------------------------------------------------------- loading */
export function Loading() {
  const { t } = useI18n()
  return (
    <div className="center-screen">
      <div className="spinner" />
      <p className="muted">{t('common.loading')}</p>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div className="skeleton" key={index} style={{ height: 280 }} />
      ))}
    </div>
  )
}

export function categoryImage(category: Category): string {
  const map: Record<Category, string> = {
    smartphones:
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
    laptops: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    accessories:
      'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=800&q=80',
  }
  return map[category] ?? ''
}
