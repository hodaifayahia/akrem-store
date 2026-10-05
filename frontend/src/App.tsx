import { useEffect } from 'react'
import { Route, Routes, useLocation, Link } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import { WhatsAppFab } from './components/ui'
import { useI18n } from './i18n'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import { OrderConfirmation, Track } from './pages/Order'
import { AdminLogin, AdminDashboard, AdminProductsPage } from './pages/Admin'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])
  return null
}

function NotFound() {
  const { t } = useI18n()
  return (
    <div className="center-screen">
      <h1>404</h1>
      <p className="muted">{t('common.noResults')}</p>
      <Link to="/" className="btn btn-primary">
        {t('nav.home')}
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <div className="app">
      <ScrollToTop />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:reference" element={<OrderConfirmation />} />
          <Route path="/track" element={<Track />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <WhatsAppFab />
    </div>
  )
}
