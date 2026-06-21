import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProduct } from '../models/ProductContext.jsx'
import { usePromotion } from '../models/PromotionContext.jsx'
import { useCart } from '../models/CartContext.jsx'
import { formatPrice, calculateItemFinalPrice } from '../utils/priceCalculator.js'

const ProductDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { fetchProductDetail, currentProduct, loading } = useProduct()
  const { getActivePromotions, getPromotionCountdown, fetchProductPromotions } = usePromotion()
  const { addToCart } = useCart()

  const [quantity, setQuantity] = useState(1)
  const [selectedSpec, setSelectedSpec] = useState(null)
  const [productPromotions, setProductPromotions] = useState([])

  useEffect(() => {
    fetchProductDetail(id)
  }, [id, fetchProductDetail])

  useEffect(() => {
    if (id) {
      fetchProductPromotions(id).then(data => {
        setProductPromotions(data || [])
      })
    }
  }, [id, fetchProductPromotions])

  useEffect(() => {
    if (currentProduct && currentProduct.specs && currentProduct.specs.length > 0) {
      setSelectedSpec(currentProduct.specs[0])
    }
  }, [currentProduct])

  const activePromotions = useMemo(() => getActivePromotions(), [getActivePromotions])

  const { finalPrice, appliedPromotion } = useMemo(() => {
    if (!currentProduct) return { finalPrice: 0, appliedPromotion: null }
    return calculateItemFinalPrice(currentProduct, productPromotions)
  }, [currentProduct, productPromotions])

  const flashSalePromo = useMemo(() =>
    productPromotions.find(p => p.type === 'flash_sale')
  , [productPromotions])

  const flashSaleCountdown = flashSalePromo ? getPromotionCountdown(flashSalePromo) : null

  const comboPromos = useMemo(() =>
    productPromotions.filter(p => p.type === 'combo')
  , [productPromotions])

  const buyGiftPromos = useMemo(() =>
    productPromotions.filter(p => p.type === 'buy_gift' && p.buyProductId === id)
  , [productPromotions, id])

  const handleQuantityChange = (delta) => {
    if (!currentProduct) return
    const newQty = quantity + delta
    if (newQty >= 1 && newQty <= currentProduct.stock) {
      setQuantity(newQty)
    }
  }

  const handleAddToCart = () => {
    if (currentProduct) {
      addToCart(currentProduct, quantity, selectedSpec)
    }
  }

  const handleBuyNow = () => {
    if (currentProduct) {
      addToCart(currentProduct, quantity, selectedSpec)
      navigate('/cart')
    }
  }

  if (loading && !currentProduct) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }

  if (!currentProduct) {
    return (
      <div className="empty-cart">
        <div className="empty-cart-icon">❓</div>
        <p>商品不存在</p>
        <button className="btn btn-primary" onClick={() => navigate('/products')} style={{ marginTop: '16px' }}>
          返回商品列表
        </button>
      </div>
    )
  }

  return (
    <div className="product-detail">
      <div>
        <img src={currentProduct.image} alt={currentProduct.name} className="detail-image" />
      </div>
      <div className="detail-info">
        <h1>{currentProduct.name}</h1>
        <p style={{ color: '#666', marginBottom: '16px' }}>{currentProduct.description}</p>

        {flashSalePromo && flashSaleCountdown && !flashSaleCountdown.isEnded && (
          <div className="promotion-banner" style={{ marginBottom: '16px' }}>
            <span>⚡ 限时秒杀 - {flashSalePromo.description}</span>
            <div className="countdown">
              <span>{flashSaleCountdown.statusText}:</span>
              {flashSaleCountdown.hours > 0 && (
                <span className="countdown-item">
                  {String(flashSaleCountdown.hours).padStart(2, '0')}
                </span>
              )}
              <span className="countdown-item">
                {String(flashSaleCountdown.minutes).padStart(2, '0')}
              </span>
              <span className="countdown-item">
                {String(flashSaleCountdown.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>
        )}

        {comboPromos.length > 0 && (
          <div style={{
            background: '#f6ffed',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '16px',
            border: '1px solid #b7eb8f'
          }}>
            <p style={{ color: '#52c41a', fontWeight: 'bold', marginBottom: '8px' }}>🎁 组合套餐优惠</p>
            {comboPromos.map(promo => (
              <p key={promo.id} style={{ fontSize: '14px', color: '#52c41a' }}>
                {promo.description} - 套餐价 {formatPrice(promo.comboPrice)}
              </p>
            ))}
          </div>
        )}

        {buyGiftPromos.length > 0 && (
          <div style={{
            background: '#fff7e6',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '16px',
            border: '1px solid #ffd591'
          }}>
            <p style={{ color: '#fa8c16', fontWeight: 'bold', marginBottom: '8px' }}>🎁 买赠活动</p>
            {buyGiftPromos.map(promo => (
              <p key={promo.id} style={{ fontSize: '14px', color: '#fa8c16' }}>
                {promo.description}
              </p>
            ))}
          </div>
        )}

        <div className="detail-price-section">
          <div className="detail-price">
            <span className="detail-current-price">{formatPrice(finalPrice)}</span>
            {finalPrice < currentProduct.price && (
              <span className="detail-original-price">
                {formatPrice(currentProduct.price)}
              </span>
            )}
            {finalPrice < currentProduct.price && (
              <span style={{
                background: '#ff4757',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                省 {formatPrice(currentProduct.price - finalPrice)}
              </span>
            )}
          </div>
        </div>

        {currentProduct.specs && currentProduct.specs.length > 0 && (
          <div className="spec-section">
            <div className="spec-title">规格选择</div>
            <div className="spec-options">
              {currentProduct.specs.map(spec => (
                <div
                  key={spec}
                  className={`spec-option${selectedSpec === spec ? ' selected' : ''}`}
                  onClick={() => setSelectedSpec(spec)}
                >
                  {spec}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="quantity-section">
          <span className="spec-title">数量</span>
          <div className="quantity-control">
            <button className="quantity-btn" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
              -
            </button>
            <input
              type="text"
              className="quantity-input"
              value={quantity}
              readOnly
            />
            <button
              className="quantity-btn"
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= currentProduct.stock}
            >
              +
            </button>
          </div>
          <span className={`stock-info${currentProduct.stock < 20 ? ' stock-low' : ''}`}>
            库存 {currentProduct.stock} 件
          </span>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <span className="warehouse-tag">发货仓：{currentProduct.warehouse}</span>
        </div>

        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={handleAddToCart}>
            加入购物车
          </button>
          <button className="btn btn-primary" onClick={handleBuyNow}>
            立即购买
          </button>
        </div>

        {productPromotions.filter(p => p.type === 'full_reduction').length > 0 && (
          <div style={{ marginTop: '20px', padding: '16px', background: '#fafafa', borderRadius: '6px' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>💰 全场满减</p>
            {productPromotions.filter(p => p.type === 'full_reduction').map(promo => (
              <div key={promo.id}>
                {promo.rules.map((rule, index) => (
                  <span key={index} style={{
                    display: 'inline-block',
                    marginRight: '8px',
                    padding: '4px 8px',
                    background: '#fff1f0',
                    color: '#ff4757',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    满{rule.threshold}减{rule.reduce}
                  </span>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductDetail
