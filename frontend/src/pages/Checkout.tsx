import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useCart } from '../context/CartContext'
import { api, ApiError, type Wilaya } from '../lib/api'
import { Alert, EmptyState, SmartImage } from '../components/ui'
import { CheckIcon, WhatsappIcon } from '../components/icons'

const PHONE_RE = /^0[567]\d{8}$/

type Errors = { name?: string; phone?: string; wilaya?: string; commune?: string; address?: string }

export default function Checkout() {
  const { t, money, productName, lang } = useI18n()
  const { lines, subtotalDzd, clear, outOfStockIds } = useCart()
  const navigate = useNavigate()

  const [wilayas, setWilayas] = useState<Wilaya[]>([])
  const [form, setForm] = useState({
    name: '',
    phone: '',
    wilaya: '',
    commune: '',
    address: '',
    note: '',
  })
  const [errors, setErrors] = useState<Errors>({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let alive = true
    api.wilayas().then((list) => alive && setWilayas(list)).catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])

  const selected = useMemo(
    () => wilayas.find((item) => String(item.code) === form.wilaya) || null,
    [wilayas, form.wilaya]
  )
  const deliveryFee = selected ? selected.fee : 0
  const total = subtotalDzd + (lines.length ? deliveryFee : 0)
  const wilayaName = (code: string) => {
    const found = wilayas.find((item) => String(item.code) === code)
    return found ? (lang === 'ar' ? found.ar : found.fr) : code
  }

  const set = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const validate = (): Errors => {
    const next: Errors = {}
    if (form.name.trim().length < 3) next.name = t('checkout.errName')
    if (!PHONE_RE.test(form.phone.replace(/[\s.\-()]/g, ''))) next.phone = t('checkout.errPhone')
    if (!form.wilaya) next.wilaya = t('checkout.errWilaya')
    if (form.commune.trim().length < 2) next.commune = t('checkout.errCommune')
    if (form.address.trim().length < 5) next.address = t('checkout.errAddress')
    return next
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setServerError('')
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      const order = await api.createOrder({
        customer: {
          name: form.name.trim(),
          phone: form.phone.replace(/[\s.\-()]/g, ''),
          wilaya: form.wilaya,
          commune: form.commune.trim(),
          address: form.address.trim(),
          note: form.note.trim(),
        },
        items: lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
      })
      clear()
      navigate(`/order/${order.reference}`, { replace: true })
    } catch (err) {
      const message = err instanceof ApiError ? `${err.message}${err.details.length ? ` — ${err.details.join(' · ')}` : ''}` : String(err)
      setServerError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (lines.length === 0) {
    return (
      <div className="container">
        <div className="page-head">
          <h1>{t('checkout.title')}</h1>
        </div>
        <EmptyState
          title={t('checkout.emptyCart')}
          text={t('cart.emptyText')}
          action={
            <Link to="/products" className="btn btn-primary">
              {t('cart.continue')}
            </Link>
          }
        />
      </div>
    )
  }

  const blocked = outOfStockIds()

  return (
    <div className="container">
      <div className="page-head">
        <h1>{t('checkout.title')}</h1>
        <p>{t('checkout.sub')}</p>
      </div>

      {serverError && <Alert kind="error">{serverError}</Alert>}
      {blocked.length > 0 && <Alert kind="error">{t('common.outOfStock')}</Alert>}

      <div className="cart-layout">
        <form onSubmit={submit} noValidate>
          <div className="panel">
            <h3 style={{ marginBottom: '0.9rem' }}>{t('checkout.name')}</h3>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="name">{t('checkout.name')}</label>
                <input
                  id="name"
                  value={form.name}
                  onChange={(event) => set('name', event.target.value)}
                  placeholder={t('checkout.namePlaceholder')}
                  autoComplete="name"
                />
                {errors.name && <span className="error">{errors.name}</span>}
              </div>

              <div className="field">
                <label htmlFor="phone">{t('checkout.phone')}</label>
                <input
                  id="phone"
                  value={form.phone}
                  onChange={(event) => set('phone', event.target.value)}
                  placeholder={t('checkout.phonePlaceholder')}
                  inputMode="tel"
                  autoComplete="tel"
                  dir="ltr"
                />
                {errors.phone && <span className="error">{errors.phone}</span>}
              </div>

              <div className="field">
                <label htmlFor="wilaya">{t('checkout.wilaya')}</label>
                <select id="wilaya" value={form.wilaya} onChange={(event) => set('wilaya', event.target.value)}>
                  <option value="">{t('checkout.wilayaPlaceholder')}</option>
                  {wilayas.map((wilaya) => (
                    <option key={wilaya.code} value={String(wilaya.code)}>
                      {String(wilaya.code).padStart(2, '0')} — {lang === 'ar' ? wilaya.ar : wilaya.fr} ·{' '}
                      {money(wilaya.fee)}
                    </option>
                  ))}
                </select>
                {errors.wilaya && <span className="error">{errors.wilaya}</span>}
              </div>

              <div className="field">
                <label htmlFor="commune">{t('checkout.commune')}</label>
                <input
                  id="commune"
                  value={form.commune}
                  onChange={(event) => set('commune', event.target.value)}
                  placeholder={t('checkout.communePlaceholder')}
                />
                {errors.commune && <span className="error">{errors.commune}</span>}
              </div>

              <div className="field span-2">
                <label htmlFor="address">{t('checkout.address')}</label>
                <input
                  id="address"
                  value={form.address}
                  onChange={(event) => set('address', event.target.value)}
                  placeholder={t('checkout.addressPlaceholder')}
                  autoComplete="street-address"
                />
                {errors.address && <span className="error">{errors.address}</span>}
              </div>

              <div className="field span-2">
                <label htmlFor="note">{t('checkout.note')}</label>
                <textarea
                  id="note"
                  value={form.note}
                  onChange={(event) => set('note', event.target.value)}
                  placeholder={t('checkout.notePlaceholder')}
                />
              </div>
            </div>
          </div>

          <div className="panel" style={{ marginTop: '1rem' }}>
            <h3 style={{ marginBottom: '0.6rem' }}>{t('checkout.payment')}</h3>
            <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', cursor: 'pointer' }}>
              <input type="radio" checked readOnly />
              <span>{t('checkout.cod')}</span>
            </label>
            <button
              type="submit"
              className="btn btn-primary btn-block"
              style={{ marginTop: '1rem' }}
              disabled={submitting || blocked.length > 0}
            >
              {submitting ? t('checkout.placing') : t('checkout.submit')}
            </button>
            <a
              className="btn btn-whatsapp btn-block"
              style={{ marginTop: '0.6rem' }}
              href="https://wa.me/213660607788"
              target="_blank"
              rel="noreferrer noopener"
            >
              <WhatsappIcon size={18} />
              {t('hero.cta')}
            </a>
          </div>
        </form>

        <aside className="summary">
          <h3>{t('cart.items')}</h3>
          {lines.map((line) => (
            <div className="summary-row" key={line.productId}>
              <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ width: 34, height: 34, borderRadius: 8, overflow: 'hidden', flex: 'none' }}>
                  <SmartImage src={line.imageUrl} alt={productName(line)} />
                </span>
                <span>
                  {productName(line)} × {line.quantity}
                </span>
              </span>
              <span>{money(line.priceDzd * line.quantity)}</span>
            </div>
          ))}
          <div className="summary-row">
            <span>{t('cart.subtotal')}</span>
            <span>{money(subtotalDzd)}</span>
          </div>
          <div className="summary-row">
            <span>
              {t('cart.delivery')}
              {selected ? ` — ${wilayaName(form.wilaya)}` : ''}
            </span>
            <span>{selected ? money(deliveryFee) : '—'}</span>
          </div>
          <div className="summary-row total">
            <span>{t('common.total')}</span>
            <span>{money(total)}</span>
          </div>
          <p className="muted" style={{ display: 'flex', gap: '0.4rem', fontSize: '0.8rem', marginTop: '0.6rem' }}>
            <CheckIcon size={15} />
            {t('checkout.cod')}
          </p>
        </aside>
      </div>
    </div>
  )
}
