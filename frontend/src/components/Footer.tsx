import { Link } from 'react-router-dom'
import { useI18n, type TKey } from '../i18n'
import { FacebookIcon, InstagramIcon, MailIcon, MapIcon, PhoneIcon, WhatsappIcon } from './icons'

const QUICK: { to: string; key: TKey }[] = [
  { to: '/', key: 'nav.home' },
  { to: '/products', key: 'nav.shop' },
  { to: '/track', key: 'nav.track' },
  { to: '/admin/login', key: 'nav.admin' },
]

const CATEGORIES: { to: string; key: TKey }[] = [
  { to: '/products?category=smartphones', key: 'cat.smartphones' },
  { to: '/products?category=laptops', key: 'cat.laptops' },
  { to: '/products?category=accessories', key: 'cat.accessories' },
]

const ADDRESS = 'Wilaya El Mghaier, Oum Tieur'

export default function Footer() {
  const { t, whatsappLink } = useI18n()

  return (
    <footer className="site-footer" id="about">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <Link to="/" className="logo">
              <span className="logo-mark" aria-hidden="true">
                <PhoneIcon size={18} />
              </span>
              <span className="logo-text">
                أكـرم موبايل
                <small>AKREM MOBILE</small>
              </span>
            </Link>
            <p className="muted" style={{ marginTop: '0.8rem', fontSize: '0.9rem' }}>
              {t('footer.tagline')}
            </p>
            <div className="socials">
              <a className="icon-btn" href={whatsappLink()} target="_blank" rel="noreferrer noopener" aria-label="WhatsApp">
                <WhatsappIcon size={18} />
              </a>
              <a className="icon-btn" href="https://facebook.com" target="_blank" rel="noreferrer noopener" aria-label="Facebook">
                <FacebookIcon size={18} />
              </a>
              <a className="icon-btn" href="https://instagram.com" target="_blank" rel="noreferrer noopener" aria-label="Instagram">
                <InstagramIcon size={18} />
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h4>{t('footer.quickLinks')}</h4>
            <ul>
              {QUICK.map((link) => (
                <li key={link.to}>
                  <Link to={link.to}>{t(link.key)}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h4>{t('footer.categories')}</h4>
            <ul>
              {CATEGORIES.map((link) => (
                <li key={link.to}>
                  <Link to={link.to}>{t(link.key)}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h4>{t('footer.contact')}</h4>
            <ul>
              <li className="contact-line">
                <PhoneIcon size={15} />
                <a href="tel:0660607788" dir="ltr">
                  0660607788
                </a>
              </li>
              <li className="contact-line">
                <MailIcon size={15} />
                <a href="mailto:akrem.mobile57@gmail.com">akrem.mobile57@gmail.com</a>
              </li>
              <li className="contact-line">
                <MapIcon size={15} />
                <span>{ADDRESS}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>{t('footer.rights')}</span>
          <span>{t('footer.madeIn')}</span>
        </div>
      </div>
    </footer>
  )
}
