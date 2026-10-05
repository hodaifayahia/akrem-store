import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useCart } from '../context/CartContext'
import { EmptyState, SmartImage } from '../components/ui'
import { MinusIcon, PlusIcon, TrashIcon } from '../components/icons'

export default function Cart() {
  const { t, money, productName } = useI18n()
  const { lines, subtotalDzd, setQuantity, remove, clear } = useCart()

  return (
    <div className="container">
      <div className="page-head">
        <h1>{t('cart.title')}</h1>
        <p>{`${lines.length} ${t('common.products')}`}</p>
      </div>

      {lines.length === 0 ? (
        <EmptyState
          title={t('cart.empty')}
          text={t('cart.emptyText')}
          action={
            <Link to="/products" className="btn btn-primary">
              {t('cart.continue')}
            </Link>
          }
        />
      ) : (
        <div className="cart-layout">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h3>{t('cart.items')}</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={clear}>
                {t('cart.clear')}
              </button>
            </div>

            {lines.map((line) => (
              <div className="cart-item" key={line.productId}>
                <Link to={`/product/${line.productId}`}>
                  <SmartImage src={line.imageUrl} alt={productName(line)} />
                </Link>
                <div>
                  <Link to={`/product/${line.productId}`} className="product-name">
                    {productName(line)}
                  </Link>
                  <p className="muted" style={{ fontSize: '0.82rem' }}>
                    {line.brand}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginTop: '0.5rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div className="qty">
                      <button
                        type="button"
                        onClick={() => setQuantity(line.productId, line.quantity - 1)}
                        aria-label="-"
                      >
                        <MinusIcon size={15} />
                      </button>
                      <span>{line.quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(line.productId, line.quantity + 1)}
                        disabled={line.quantity >= Math.max(1, line.stock)}
                        aria-label="+"
                      >
                        <PlusIcon size={15} />
                      </button>
                    </div>
                    <span className="price">{money(line.priceDzd * line.quantity)}</span>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => remove(line.productId)}
                      aria-label={t('cart.remove')}
                    >
                      <TrashIcon size={15} />
                      {t('cart.remove')}
                    </button>
                  </div>
                  {line.quantity > line.stock && (
                    <p className="error" style={{ color: 'hsl(var(--destructive))', fontSize: '0.78rem' }}>
                      {t('common.outOfStock')}
                    </p>
                  )}
                </div>
              </div>
            ))}

            <Link to="/products" className="btn btn-outline">
              {t('cart.continue')}
            </Link>
          </div>

          <aside className="summary">
            <h3>{t('common.total')}</h3>
            <div className="summary-row">
              <span>{t('cart.subtotal')}</span>
              <span>{money(subtotalDzd)}</span>
            </div>
            <div className="summary-row">
              <span>{t('cart.delivery')}</span>
              <span className="muted">{t('cart.deliveryAtCheckout')}</span>
            </div>
            <div className="summary-row total">
              <span>{t('common.total')}</span>
              <span>{money(subtotalDzd)}</span>
            </div>
            <p className="muted" style={{ fontSize: '0.8rem', margin: '0.75rem 0' }}>
              {t('checkout.cod')}
            </p>
            <Link to="/checkout" className="btn btn-primary btn-block">
              {t('cart.checkout')}
            </Link>
          </aside>
        </div>
      )}
    </div>
  )
}
