import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useI18n } from '../i18n'
import { api, ApiError, type Order } from '../lib/api'
import { Alert, Loading, StatusBadge } from '../components/ui'
import { CheckIcon } from '../components/icons'

function OrderDetails({ order, wilayaName }: { order: Order; wilayaName: (code: string) => string }) {
  const { t, money } = useI18n()
  return (
    <>
      <div className="panel" style={{ marginTop: '1rem' }}>
        <div className="summary-row">
          <span>{t('order.reference')}</span>
          <strong dir="ltr">{order.reference}</strong>
        </div>
        <div className="summary-row">
          <span>{t('admin.date')}</span>
          <span>{new Date(order.created_at).toLocaleString()}</span>
        </div>
        <div className="summary-row">
          <span>{t('admin.customer')}</span>
          <span>{order.customer_name}</span>
        </div>
        <div className="summary-row">
          <span>{t('checkout.phone')}</span>
          <span dir="ltr">{order.phone}</span>
        </div>
        <div className="summary-row">
          <span>{t('admin.wilaya')}</span>
          <span>{wilayaName(order.wilaya)}</span>
        </div>
        <div className="summary-row">
          <span>{t('checkout.commune')}</span>
          <span>{order.commune}</span>
        </div>
        <div className="summary-row">
          <span>{t('checkout.address')}</span>
          <span>{order.address}</span>
        </div>
        {order.note ? (
          <div className="summary-row">
            <span>{t('checkout.note')}</span>
            <span>{order.note}</span>
          </div>
        ) : null}
        <div className="summary-row">
          <span>{t('track.status')}</span>
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="table-wrap" style={{ marginTop: '1rem' }}>
        <table className="data">
          <thead>
            <tr>
              <th>{t('order.items')}</th>
              <th>{t('common.quantity')}</th>
              <th>{t('common.price')}</th>
              <th>{t('common.total')}</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td style={{ whiteSpace: 'normal' }}>{item.product_name}</td>
                <td>{item.quantity}</td>
                <td>{money(item.unit_price_dzd)}</td>
                <td>{money(item.line_total_dzd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="summary" style={{ marginTop: '1rem', position: 'static' }}>
        <div className="summary-row">
          <span>{t('cart.subtotal')}</span>
          <span>{money(order.subtotal_dzd)}</span>
        </div>
        <div className="summary-row">
          <span>{t('order.delivery')}</span>
          <span>{money(order.delivery_fee_dzd)}</span>
        </div>
        <div className="summary-row total">
          <span>{t('common.total')}</span>
          <span>{money(order.total_dzd)}</span>
        </div>
        <p className="muted" style={{ display: 'flex', gap: '0.4rem', fontSize: '0.82rem', marginTop: '0.5rem' }}>
          <CheckIcon size={15} />
          {t('order.cod')}
        </p>
      </div>
    </>
  )
}

/* ---------------------------------------------------- order confirmation */
export function OrderConfirmation() {
  const { reference = '' } = useParams()
  const { t, lang } = useI18n()
  const [order, setOrder] = useState<Order | null>(null)
  const [wilayas, setWilayas] = useState<{ code: number; ar: string; fr: string; fee: number }[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    api.wilayas().then((list) => alive && setWilayas(list)).catch(() => undefined)
    api
      .trackOrder(reference)
      .then((found) => alive && setOrder(found))
      .catch((err: Error) => alive && setError(err.message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [reference])

  const wilayaName = (code: string) => {
    const found = wilayas.find((item) => String(item.code) === code)
    return found ? (lang === 'ar' ? found.ar : found.fr) : code
  }

  if (loading) return <Loading />

  return (
    <div className="container">
      <div className="center-screen" style={{ minHeight: 'auto', paddingTop: '1rem' }}>
        <span className="logo-mark" style={{ width: 54, height: 54 }}>
          <CheckIcon size={28} />
        </span>
        <h1>{order ? t('order.successTitle') : t('track.notFound')}</h1>
        <p className="muted">{t('order.successText')}</p>
        <h2 dir="ltr" style={{ letterSpacing: '0.08em' }}>
          {reference}
        </h2>
      </div>

      {error && <Alert kind="error">{error}</Alert>}
      {order && <OrderDetails order={order} wilayaName={wilayaName} />}

      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
        <Link to={`/track?ref=${reference}`} className="btn btn-primary">
          {t('order.trackCta')}
        </Link>
        <Link to="/products" className="btn btn-outline">
          {t('order.continue')}
        </Link>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ track */
export function Track() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const [reference, setReference] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [wilayas, setWilayas] = useState<{ code: number; ar: string; fr: string; fee: number }[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const wilayaName = (code: string) => {
    const found = wilayas.find((item) => String(item.code) === code)
    return found ? (lang === 'ar' ? found.ar : found.fr) : code
  }

  const lookup = async (value: string) => {
    const clean = value.trim().toUpperCase()
    if (!clean) return
    setLoading(true)
    setError('')
    setOrder(null)
    try {
      const found = await api.trackOrder(clean)
      setOrder(found)
      api.wilayas().then(setWilayas).catch(() => undefined)
    } catch (err) {
      setError(err instanceof ApiError ? t('track.notFound') : String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const initial = params.get('ref')
    if (initial) {
      setReference(initial)
      lookup(initial)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="container">
      <div className="page-head">
        <h1>{t('track.title')}</h1>
        <p>{t('track.sub')}</p>
      </div>

      <form
        className="panel"
        style={{ maxWidth: 520, display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}
        onSubmit={(event) => {
          event.preventDefault()
          lookup(reference)
          navigate(`/track?ref=${encodeURIComponent(reference.trim().toUpperCase())}`, { replace: true })
        }}
      >
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <label htmlFor="ref">{t('order.reference')}</label>
          <input
            id="ref"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder={t('track.placeholder')}
            dir="ltr"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? t('common.loading') : t('track.submit')}
        </button>
      </form>

      {error && (
        <div style={{ marginTop: '1rem' }}>
          <Alert kind="error">{error}</Alert>
        </div>
      )}

      {order && (
        <div>
          <Alert kind="success">{`${t('order.reference')}: ${order.reference}`}</Alert>
          <OrderDetails order={order} wilayaName={wilayaName} />
        </div>
      )}
    </div>
  )
}
