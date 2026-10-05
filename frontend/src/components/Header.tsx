import { NavLink, Link } from 'react-router-dom'
import { useI18n, type TKey } from '../i18n'
import { useCart } from '../context/CartContext'
import { useTheme } from '../context/ThemeContext'
import { CartIcon, GlobeIcon, MoonIcon, PhoneIcon, SunIcon } from './icons'

const LINKS: { to: string; key: TKey }[] = [
  { to: '/', key: 'nav.home' },
  { to: '/products', key: 'nav.shop' },
  { to: '/products?category=smartphones', key: 'nav.categories' },
  { to: '/track', key: 'nav.track' },
  { to: '/#about', key: 'nav.about' },
]

export default function Header() {
  const { t, lang, toggleLang } = useI18n()
  const { count } = useCart()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="site-header">
      <div className="container">
        <div className="header-inner">
          <Link to="/" className="logo" aria-label="Akrem Mobile">
            <span className="logo-mark" aria-hidden="true">
              <PhoneIcon size={18} />
            </span>
            <span className="logo-text">
              أكـرم موبايل
              <small>AKREM MOBILE</small>
            </span>
          </Link>

          <nav className="main-nav" aria-label="main">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => (isActive ? 'active' : undefined)}
                end={link.to === '/'}
              >
                {t(link.key)}
              </NavLink>
            ))}
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className="icon-btn lang-btn"
              onClick={toggleLang}
              title={t('header.lang')}
              aria-label={t('header.lang')}
            >
              <GlobeIcon size={16} />
              {lang === 'ar' ? 'FR' : 'AR'}
            </button>

            <button
              type="button"
              className="icon-btn"
              onClick={toggleTheme}
              title={t('header.theme')}
              aria-label={t('header.theme')}
            >
              {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
            </button>

            <Link to="/cart" className="icon-btn" title={t('header.cart')} aria-label={t('header.cart')}>
              <CartIcon size={18} />
              {count > 0 && <span className="cart-count">{count}</span>}
            </Link>
          </div>
        </div>

        <nav className="mobile-nav" aria-label="mobile">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'}>
              {t(link.key)}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
