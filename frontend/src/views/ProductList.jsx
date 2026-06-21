import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProduct } from '../models/ProductContext.jsx'
import { usePromotion } from '../models/PromotionContext.jsx'
import { useCart } from '../models/CartContext.jsx'
import { formatPrice, calculateItemFinalPrice } from '../utils/priceCalculator.js'

const ProductList = () => {
  const navigate = useNavigate()
  const { products, categories, loading } = useProduct()
  const { getActivePromotions, getPromotionCountdown } = usePromotion()
  const { addToCart } = useCart()

  const [activeCategory, setActiveCategory] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')

  const activePromotions = useMemo(() => getActivePromotions(), [getActivePromotions])

  const filteredProducts = useMemo(() => {
    let result = [...products]

    if (activeCategory) {
      result = result.filter(p => p.category === activeCategory)
    }

    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(keyword) ||
        p.description.toLowerCase().includes(keyword)
      )
    }

    return result
  }, [products, activeCategory, searchKeyword])

  const flashSalePromo = useMemo(() =>
    activePromotions.find(p => p.type === 'flash_sale')
  , [activePromotions])

  const flashSaleCountdown = flashSalePromo ? getPromotionCountdown(flashSalePromo) : null

  const handleAddToCart = (e, product) => {
    e.stopPropagation()
    addToCart(product, 1)
  }

  const getTagClass = (tag) => {
    if (tag === '新品') return 'tag new'
    if (tag === '热销') return 'tag hot'
    if (tag === '超值') return 'tag value'
    return 'tag'
  }

  const getProductFinalPrice = (product) => {
    const productPromos = activePromotions.filter(p => {
      if (p.type === 'flash_sale') return p.productIds.includes(product.id)
      return false
    })
    return calculateItemFinalPrice(product, productPromos)
  }

  if (loading && products.length === 0) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }

  return (
    <div>
      {flashSalePromo && flashSaleCountdown && !flashSaleCountdown.isEnded && (
        <div className="promotion-banner">
          <div>
            <span style={{ fontWeight: 'bold', fontSize: '18px' }}>⚡ 限时秒杀</span>
            <span style={{ marginLeft: '12px' }}>{flashSalePromo.description}</span>
          </div>
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

      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="搜索商品..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
        <div className="category-tabs">
          <button
            className={`category-tab${!activeCategory ? ' active' : ''}`}
            onClick={() => setActiveCategory('')}
          >
            全部
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-tab${activeCategory === cat ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="product-list">
        {filteredProducts.map(product => {
          const { finalPrice, appliedPromotion } = getProductFinalPrice(product)
          const isFlashSale = appliedPromotion && appliedPromotion.type === 'flash_sale'

          return (
            <div
              key={product.id}
              className="product-card"
              onClick={() => navigate(`/products/${product.id}`)}
            >
              <div style={{ position: 'relative' }}>
                <img src={product.image} alt={product.name} className="product-image" />
                {isFlashSale && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px'
                  }}>
                    <span className="flash-sale-badge">限时特惠</span>
                  </div>
                )}
              </div>
              <div className="product-info">
                <div className="product-name">{product.name}</div>
                <div className="product-desc">{product.description}</div>
                <div className="product-price">
                  <span className="current-price">{formatPrice(finalPrice)}</span>
                  {finalPrice < product.price && (
                    <span className="original-price">{formatPrice(product.price)}</span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="product-tags">
                    {product.tags?.map(tag => (
                      <span key={tag} className={getTagClass(tag)}>{tag}</span>
                    ))}
                  </div>
                  <span className="warehouse-tag">{product.warehouse}</span>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '12px', padding: '8px' }}
                  onClick={(e) => handleAddToCart(e, product)}
                >
                  加入购物车
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="empty-cart">
          <div className="empty-cart-icon">🔍</div>
          <p>没有找到相关商品</p>
        </div>
      )}
    </div>
  )
}

export default ProductList
