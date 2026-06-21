import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useCart } from '../models/CartContext.jsx'

const Header = () => {
  const { cartCount } = useCart()

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/products" className="logo" style={{ color: 'white', textDecoration: 'none' }}>
          <span>📦</span>
          <span>库存调度平台</span>
        </Link>

        <nav className="nav">
          <NavLink
            to="/products"
            className={({ isActive }) =>
              `nav-link${isActive ? ' active' : ''}`
            }
          >
            商品广场
          </NavLink>
          <NavLink
            to="/cart"
            className={({ isActive }) =>
              `nav-link${isActive ? ' active' : ''}`
            }
          >
            <span className="cart-badge">
              🛒 购物车
              {cartCount > 0 && (
                <span className="cart-count">{cartCount}</span>
              )}
            </span>
          </NavLink>
        </nav>
      </div>
    </header>
  )
}

export default Header
