import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { I18nProvider } from './i18n'
import { CartProvider } from './context/CartContext'
import { ThemeProvider } from './context/ThemeContext'
import './styles/theme.css'
import './styles/app.css'

const container = document.getElementById('root')
if (!container) throw new Error('#root element is missing from index.html')

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <I18nProvider>
      <ThemeProvider>
        <CartProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </CartProvider>
      </ThemeProvider>
    </I18nProvider>
  </React.StrictMode>
)
