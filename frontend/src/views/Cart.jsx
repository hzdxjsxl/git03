import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../models/CartContext.jsx'
import { usePromotion } from '../models/PromotionContext.jsx'
import { formatPrice } from '../utils/priceCalculator.js'

const Cart = () => {
  const navigate = useNavigate()
  const {
    cartItems,
    cartTotal,
    isAllSelected,
    toggleSelectItem,
    toggleSelectAll,
    updateQuantity,
    removeFromCart,
    getSelectedCartItems
  } = useCart()
  const { getActivePromotions, getPromotionCountdown } = usePromotion()

  const activePromotions = getActivePromotions()
  const flashSalePromo = activePromotions.find(p => p.type === 'flash_sale')
  const fullReductionPromo = activePromotions.find(p => p.type === 'full_reduction')
  const comboPromos = activePromotions.filter(p => p.type === 'combo')

  const flashSaleCountdown = flashSalePromo ? getPromotionCountdown(flashSalePromo) : null

  const handleQuantityChange = (item, delta) => {
    const newQty = item.quantity + delta
    updateQuantity(item.id, item.spec, newQty)
  }

  const handleCheckout = () => {
    if (getSelectedCartItems().length === 0) {
      alert('请选择要结算的商品')
      return
    }
    navigate('/checkout')
  }

  const isSelected = (item) => {
    const key = `${item.id}_${item.spec || 'default'}`
    return cartTotal.items.some(i => i.id === item.id && i.spec === item.spec)
  }

  const getAppliedPromotions = (item) => {
    const itemWithPromo = cartTotal.items.find(
      i => i.id === item.id && i.spec === item.spec
    )
    return itemWithPromo?.appliedPromotion ? [itemWithPromo.appliedPromotion] : []
  }

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <h1 className="cart-title">购物车</h1>
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <p>购物车是空的</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/products')}
            style={{ marginTop: '16px' }}
          >
            去逛逛
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <h1 className="cart-title">购物车 ({cartItems.length}件商品)</h1>

      {flashSalePromo && flashSaleCountdown && !flashSaleCountdown.isEnded && (
        <div className="promotion-banner" style={{ marginBottom: '20px' }}>
          <span>⚡ 限时秒杀进行中 - {flashSalePromo.description}</span>
          <div className="countdown">
            <span>{flashSaleCountdown.statusText}:</span>
            <span className="countdown-item">
              {String(flashSaleCountdown.hours).padStart(2, '0')}
            </span>
            <span className="countdown-item">
              {String(flashSaleCountdown.minutes).padStart(2, '0')}
            </span>
            <span className="countdown-item">
              {String(flashSaleCountdown.seconds).padStart(2, '0')}
            </span>
          </div>
        </div>
      )}

      <div className="cart-header">
        <div className="cart-checkbox">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={toggleSelectAll}
          />
        </div>
        <div>商品</div>
        <div style={{ textAlign: 'center' }}>单价</div>
        <div style={{ textAlign: 'center' }}>数量</div>
        <div style={{ textAlign: 'center' }}>小计</div>
        <div style={{ textAlign: 'center' }}>操作</div>
      </div>

      {cartItems.map(item => {
        const isItemSelected = isSelected(item)
        const itemWithPrice = cartTotal.items.find(
          i => i.id === item.id && i.spec === item.spec
        )
        const appliedPromos = getAppliedPromotions(item)
        const showPrice = itemWithPrice ? itemWithPrice.finalPrice : item.price
        const subtotal = showPrice * item.quantity

        return (
          <div key={`${item.id}-${item.spec}`} className="cart-item">
            <div className="cart-checkbox">
              <input
                type="checkbox"
                checked={isItemSelected}
                onChange={() => toggleSelectItem(item.id, item.spec)}
              />
            </div>
            <div className="cart-product">
              <img
                src={item.image}
                alt={item.name}
                className="cart-product-image"
                onClick={() => navigate(`/products/${item.id}`)}
                style={{ cursor: 'pointer' }}
              />
              <div className="cart-product-info">
                <div
                  className="cart-product-name"
                  onClick={() => navigate(`/products/${item.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {item.name}
                </div>
                {item.spec && (
                  <div className="cart-product-spec">规格：{item.spec}</div>
                )}
                <div className="cart-product-spec">
                  <span className="warehouse-tag">{item.warehouse}</span>
                </div>
                {appliedPromos.length > 0 && (
                  <div style={{ marginTop: '4px' }}>
                    {appliedPromos.map(promo => (
                      <span key={promo.id} className="flash-sale-badge" style={{ fontSize: '11px' }}>
                        {promo.type === 'flash_sale' ? '限时秒杀' : promo.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="cart-price">
              <div className="current">{formatPrice(showPrice)}</div>
              {showPrice < item.price && (
                <div style={{ fontSize: '12px', color: '#999', textDecoration: 'line-through' }}>
                  {formatPrice(item.price)}
                </div>
              )}
            </div>
            <div className="cart-quantity">
              <div className="quantity-control">
                <button
                  className="quantity-btn"
                  onClick={() => handleQuantityChange(item, -1)}
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <input
                  type="text"
                  className="quantity-input"
                  value={item.quantity}
                  readOnly
                />
                <button
                  className="quantity-btn"
                  onClick={() => handleQuantityChange(item, 1)}
                  disabled={item.quantity >= item.stock}
                >
                  +
                </button>
              </div>
            </div>
            <div className="cart-subtotal">
              {formatPrice(subtotal)}
              {showPrice < item.price && (
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                  已省 {formatPrice((item.price - showPrice) * item.quantity)}
                </div>
              )}
            </div>
            <div
              className="cart-remove"
              onClick={() => removeFromCart(item.id, item.spec)}
            >
              删除
            </div>
          </div>
        )
      })}

      {cartTotal.discountDetail.length > 0 && (
        <div className="discount-list" style={{ marginTop: '20px' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '8px', color: '#52c41a' }}>
            🎉 优惠明细
          </p>
          {cartTotal.discountDetail.map((detail, index) => (
            <div key={index} className="discount-item">
              【{detail.type}】 - {formatPrice(detail.amount)}
            </div>
          ))}
          {cartTotal.gifts.length > 0 && cartTotal.gifts.map((gift, index) => (
            <div key={`gift-${index}`} className="discount-item">
              【买赠活动】赠送 {gift.name}
            </div>
          ))}
        </div>
      )}

      <div className="cart-footer">
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} />
            全选
          </label>
        </div>
        <div className="cart-summary">
          <div className="cart-summary-row">
            <span className="cart-summary-label">商品件数：</span>
            <span className="cart-summary-value">
              {getSelectedCartItems().reduce((sum, item) => sum + item.quantity, 0)} 件
            </span>
          </div>
          <div className="cart-summary-row">
            <span className="cart-summary-label">商品金额：</span>
            <span className="cart-summary-value">{formatPrice(cartTotal.itemTotal)}</span>
          </div>
          <div className="cart-summary-row">
            <span className="cart-summary-label">优惠金额：</span>
            <span className="cart-summary-value cart-discount">
              - {formatPrice(cartTotal.totalDiscount)}
            </span>
          </div>
          <div className="cart-summary-row">
            <span className="cart-summary-label" style={{ fontSize: '16px' }}>应付金额：</span>
            <span className="cart-total">{formatPrice(cartTotal.finalAmount)}</span>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleCheckout}
            disabled={getSelectedCartItems().length === 0}
            style={{
              marginTop: '16px',
              padding: '12px 48px',
              fontSize: '16px',
              opacity: getSelectedCartItems().length === 0 ? 0.5 : 1
            }}
          >
            去结算
          </button>
        </div>
      </div>
    </div>
  )
}

export default Cart
