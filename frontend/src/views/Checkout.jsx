import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../models/CartContext.jsx'
import { useOrder } from '../models/OrderContext.jsx'
import { usePromotion } from '../models/PromotionContext.jsx'
import { formatPrice } from '../utils/priceCalculator.js'

const Checkout = () => {
  const navigate = useNavigate()
  const { cartTotal, getSelectedCartItems, clearCart } = useCart()
  const { createOrder, loading } = useOrder()
  const { getActivePromotions } = usePromotion()

  const [address, setAddress] = useState({
    name: '',
    phone: '',
    address: ''
  })
  const [paymentMethod, setPaymentMethod] = useState('alipay')

  const activePromotions = useMemo(() => getActivePromotions(), [getActivePromotions])
  const selectedItems = getSelectedCartItems()

  const handleInputChange = (field, value) => {
    setAddress(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmitOrder = async () => {
    if (!address.name || !address.phone || !address.address) {
      alert('请填写完整的收货信息')
      return
    }

    if (selectedItems.length === 0) {
      alert('请选择要结算的商品')
      navigate('/cart')
      return
    }

    const orderData = {
      items: selectedItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        finalPrice: cartTotal.items.find(i => i.id === item.id && i.spec === item.spec)?.finalPrice || item.price,
        quantity: item.quantity,
        spec: item.spec,
        image: item.image,
        warehouse: item.warehouse
      })),
      totalAmount: cartTotal.itemTotal,
      discountAmount: cartTotal.totalDiscount,
      finalAmount: cartTotal.finalAmount,
      address,
      paymentMethod,
      promotions: cartTotal.discountDetail.map(d => d.promotion).filter(Boolean)
    }

    try {
      const result = await createOrder(orderData)
      navigate(`/order/${result.id}`)
    } catch (error) {
      alert('订单创建失败，请重试')
    }
  }

  if (selectedItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <p>请先选择要结算的商品</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/cart')}
            style={{ marginTop: '16px' }}
          >
            返回购物车
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-page">
      <div>
        <div className="checkout-section">
          <h2>📦 收货地址</h2>
          <div className="address-form">
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder="收货人姓名"
                value={address.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
              <input
                type="text"
                className="form-input"
                placeholder="联系电话"
                value={address.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
            <input
              type="text"
              className="form-input"
              placeholder="详细地址"
              value={address.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
            />
          </div>
        </div>

        <div className="checkout-section" style={{ marginTop: '20px' }}>
          <h2>💳 支付方式</h2>
          <div className="payment-methods">
            <div
              className={`payment-method${paymentMethod === 'alipay' ? ' selected' : ''}`}
              onClick={() => setPaymentMethod('alipay')}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>💙</div>
              <div>支付宝</div>
            </div>
            <div
              className={`payment-method${paymentMethod === 'wechat' ? ' selected' : ''}`}
              onClick={() => setPaymentMethod('wechat')}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>💚</div>
              <div>微信支付</div>
            </div>
            <div
              className={`payment-method${paymentMethod === 'bank' ? ' selected' : ''}`}
              onClick={() => setPaymentMethod('bank')}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏦</div>
              <div>银行卡</div>
            </div>
          </div>
        </div>

        <div className="checkout-section" style={{ marginTop: '20px' }}>
          <h2>🛍️ 商品清单</h2>
          <div className="checkout-items">
            {selectedItems.map(item => {
              const itemWithPrice = cartTotal.items.find(
                i => i.id === item.id && i.spec === item.spec
              )
              const finalPrice = itemWithPrice?.finalPrice || item.price

              return (
                <div key={`${item.id}-${item.spec}`} className="checkout-item">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="checkout-item-image"
                  />
                  <div className="checkout-item-info">
                    <div className="checkout-item-name">{item.name}</div>
                    <div className="checkout-item-meta">
                      <span>{item.spec || '标准款'}</span>
                      <span>x{item.quantity}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#ff4757', fontWeight: 'bold' }}>
                      {formatPrice(finalPrice * item.quantity)}
                    </div>
                    {finalPrice < item.price && (
                      <div style={{ fontSize: '12px', color: '#999', textDecoration: 'line-through' }}>
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div>
        <div className="order-summary">
          <h2 style={{ marginBottom: '16px', fontSize: '16px' }}>💰 订单汇总</h2>

          {cartTotal.discountDetail.length > 0 && (
            <div style={{
              background: '#f6ffed',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '16px'
            }}>
              <p style={{ fontWeight: 'bold', color: '#52c41a', marginBottom: '8px', fontSize: '14px' }}>
                🎉 已享优惠
              </p>
              {cartTotal.discountDetail.map((detail, index) => (
                <div key={index} style={{ fontSize: '12px', color: '#52c41a', marginBottom: '4px' }}>
                  【{detail.type}】 - {formatPrice(detail.amount)}
                </div>
              ))}
              {cartTotal.gifts && cartTotal.gifts.length > 0 && cartTotal.gifts.map((gift, index) => (
                <div key={`gift-${index}`} style={{ fontSize: '12px', color: '#52c41a' }}>
                  【买赠活动】赠送礼品
                </div>
              ))}
            </div>
          )}

          <div className="summary-row">
            <span>商品件数</span>
            <span>{selectedItems.reduce((sum, item) => sum + item.quantity, 0)} 件</span>
          </div>
          <div className="summary-row">
            <span>商品金额</span>
            <span>{formatPrice(cartTotal.itemTotal)}</span>
          </div>
          <div className="summary-row">
            <span>运费</span>
            <span style={{ color: '#52c41a' }}>免运费</span>
          </div>
          <div className="summary-row">
            <span>优惠金额</span>
            <span className="summary-discount">- {formatPrice(cartTotal.totalDiscount)}</span>
          </div>
          <div className="summary-row total">
            <span>应付金额</span>
            <span>{formatPrice(cartTotal.finalAmount)}</span>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleSubmitOrder}
            disabled={loading}
            style={{
              width: '100%',
              marginTop: '20px',
              padding: '14px',
              fontSize: '16px'
            }}
          >
            {loading ? '提交中...' : '提交订单'}
          </button>

          <p style={{
            fontSize: '12px',
            color: '#999',
            textAlign: 'center',
            marginTop: '12px'
          }}>
            提交订单后，请在30分钟内完成支付
          </p>
        </div>
      </div>
    </div>
  )
}

export default Checkout
