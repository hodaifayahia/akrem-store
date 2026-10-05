import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useCart } from '../context/CartContext'
import { api, type Product } from '../lib/api'
import { CATEGORY_KEYS, type Category } from '../lib/format'
import {
  Alert,
  Marquee,
  ProductCard,
  ProductGridSkeleton,
  SectionHead,
  SmartImage,
  TrustStrip,
  categoryImage,
} from '../components/ui'
import { SearchIcon, WhatsAppIcon } from '../components/icons'

export default function Home() {
  const { t, categoryLabel } = useI18n()
  const navigate = useNavigate()
  const { add } = useCart()
  const [term, setTerm] = useState('')
  const [rotating, setRotating] = useState(0)
  const [featured, setFeatured] = useState<Product[]>([])
  const [latest, setLatest] = useState<Product[]>([])
  const [stats, setStats] = useState({ products: 0, wilayas: 58, rating: 4.7 })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const placeholders = useMemo(
    () => [t('hero.p1'), t('hero.p2'), t('hero.p3')],
    [t]
  )

  useEffect(() => {
    const timer = window.setInterval(() => setRotating((index) => (index + 1) % placeholders.length), 3200)
    return () => window.clearInterval(timer)
  }, [placeholders.length])

  useEffect(() => {
    let alive = true
    setLoading(true)
    Promise.all([api.products({ featured: '1', sort: 'newest' }), api.products({ sort: 'newest' })])
      .then(([featuredProducts, newestProducts]) => {
        if (!alive) return
        setFeatured(featuredProducts)
        setLatest(newestProducts)
        setStats({
          products: newestProducts.length,
          wilayas: 58,
          rating: newestProducts.length
            ? newestProducts.reduce((sum, p) => sum + p.rating, 0) / newestProducts.length
            : 0,
        })
        setError('')
      })
      .catch((err: Error) => alive && setError(err.message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    navigate(`/products?q=${encodeURIComponent(term.trim())}`)
  }

  return (
    <>
      <section className="container">
        <div className="hero">
          <div className="hero-overlay" />
          <div className="hero-content">
            <span className="hero-badge">
              <span className="pulse-dot" />
              {t('hero.badge')}
            </span>
            <h1>
              {t('hero.title').split(' ').slice(0, 3).join(' ')}{' '}
              <span className="gradient-text">{t('hero.title').split(' ').slice(3).join(' ')}</span>
            </h1>
            <p>{t('hero.subtitle')}</p>

            <form className="hero-search" onSubmit={submitSearch} role="search">
              <SearchIcon size={18} />
              <input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder={placeholders[rotating]}
                aria-label={t('hero.search')}
                enterKeyHint="search"
              />
              <button type="submit" className="btn btn-primary btn-sm">
                {t('hero.search')}
              </button>
            </form>

            <div className="hero-actions">
              <a className="btn btn-whatsapp" href="https://wa.me/213660607788" target="_blank" rel="noreferrer noopener">
                <WhatsappIcon size={18} />
                {t('hero.cta')}
              </a>
              <Link to="/products" className="btn btn-outline">
                {t('hero.ctaShop')}
              </Link>
            </div>
          </div>
        </div>
        <TrustStrip />
      </section>

      {error && (
        <div className="container">
          <div style={{ marginTop: '1rem' }}>
            <Alert kind="error">{`${t('common.error')} — ${error}`}</Alert>
          </div>
        </div>
      )}

      <section className="container section">
        <SectionHead title={t('home.catTitle')} subtitle={t('home.catSubtitle')} />
        <div className="cat-grid">
          {CATEGORY_KEYS.map((category) => (
            <Link
              key={category}
              to={`/products?category=${category}`}
              className="cat-card"
              style={{ backgroundImage: `url(${categoryImage(category)})` }}
            >
              <div>
                <h3>{categoryLabel(category as Category)}</h3>
                <span>{t('hero.ctaShop')}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section">
        <SectionHead
          title={t('home.featuredTitle')}
          subtitle={t('home.featuredSubtitle')}
          more={{ to: '/products?featured=1', label: t('home.viewAll') }}
        />
        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <div className="product-grid">
            {featured.map((product) => (
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
      </section>

      <section className="container section">
        <div className="stats">
          <div>
            <div className="stat-value">{stats.products || 26}</div>
            <div className="stat-label">{t('home.statProducts')}</div>
          </div>
          <div>
            <div className="stat-value">{stats.wilayas + 11}</div>
            <div className="stat-label">{t('home.statWilayas')}</div>
          </div>
          <div>
            <div className="stat-value">{stats.rating.toFixed(1)}</div>
            <div className="stat-label">{t('home.statRating')}</div>
          </div>
        </div>
        <div style={{ marginTop: '1.25rem', maxWidth: '70ch' }}>
          <h3>{t('home.statsTitle')}</h3>
          <p className="muted" style={{ marginTop: '0.4rem' }}>
            {t('home.statsText')}
          </p>
        </div>
      </section>

      <Marquee />

      <section className="container section">
        <SectionHead
          title={t('home.newTitle')}
          subtitle={t('home.newSubtitle')}
          more={{ to: '/products', label: t('home.viewAll') }}
        />
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : (
          <div className="product-grid">
            {latest.slice(0, 8).map((product) => (
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
      </section>

      <section className="container section" style={{ paddingTop: 0 }}>
        <div className="panel" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: 96, flex: 'none' }}>
            <SmartImage src={categoryImage('smartphones')} alt={t('cat.smartphones')} />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <h3>{t('home.statsTitle')}</h3>
            <p className="muted">{t('footer.tagline')}</p>
          </div>
          <Link to="/products" className="btn btn-primary">
            {t('hero.ctaShop')}
          </Link>
        </div>
      </section>
    </>
  )
}
