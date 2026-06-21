import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { CartProvider } from './models/CartContext.jsx'
import { ProductProvider } from './models/ProductContext.jsx'
import { PromotionProvider } from './models/PromotionContext.jsx'
import { OrderProvider } from './models/OrderContext.jsx'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ProductProvider>
        <PromotionProvider>
          <CartProvider>
            <OrderProvider>
              <App />
            </OrderProvider>
          </CartProvider>
        </PromotionProvider>
      </ProductProvider>
    </BrowserRouter>
  </React.StrictMode>
)
