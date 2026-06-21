import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProductList from '../views/ProductList.jsx'
import ProductDetail from '../views/ProductDetail.jsx'
import Cart from '../views/Cart.jsx'
import Checkout from '../views/Checkout.jsx'
import OrderResult from '../views/OrderResult.jsx'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/products" replace />} />
      <Route path="/products" element={<ProductList />} />
      <Route path="/products/:id" element={<ProductDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/order/:id" element={<OrderResult />} />
      <Route path="*" element={<Navigate to="/products" replace />} />
    </Routes>
  )
}

export default AppRoutes
