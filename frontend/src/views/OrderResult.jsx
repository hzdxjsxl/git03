import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useOrder } from '../models/OrderContext.jsx'
import { formatPrice } from '../utils/priceCalculator.js'

const OrderResult = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { fetchOrder, currentOrder, loading, countdown, payOrder, calculateOrderCountdown } = useOrder()

  const [localCountdown, setLocalCountdown] = useState(null)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    if (id) {
      fetchOrder(id)
    }
  }, [id, fetchOrder])

  useEffect(() => {
    if (currentOrder && currentOrder.status === 'pending') {
      const timer = setInterval(() => {
        const cd = calculateOrderCountdown(currentOrder)
        setLocalCountdown(cd)
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [currentOrder, calculateOrderCountdown])

  const handlePay = async () => {
    if (!currentOrder) return
    setPaying(true)
    try {
      await payOrder(currentOrder.id)
    } catch (error) {
      alert('支付失败，请重试')
    } finally {
      setPaying(false)
    }
  }

  const getStatusText = (status) => {
    const statusMap = {
      pending: '待支付',
      paid: '已支付',
      shipped: '已发货',
      completed: '已完成',
      cancelled: '已取消'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status) => {
    const colorMap = {
      pending: '#ff4757',
      paid: '#52c41a',
      shipped: '#1890ff',
      completed: '#666',
      cancelled: '#999'
    }
    return colorMap[status] || '#333'
  }

  const displayCountdown = localCountdown || countdown

  if (loading && !currentOrder) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }

  if (!currentOrder) {
    return (
      <div className="cart-page">
        <div className="empty-cart">
          <div className="empty-cart-icon">❓</div>
          <p>订单不存在</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/products')}
            style={{ marginTop: '16px' }}
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="order-result">
      {currentOrder.status === 'paid' ? (
        <>
          <div className="order-result-icon success">✅</div>
          <h2>支付成功</h2>
          <p className="order-result-info">
            订单号：{currentOrder.id}
          </p>
        </>
      ) : currentOrder.status === 'cancelled' ? (
        <>
          <div className="order-result-icon">❌</div>
          <h2>订单已取消</h2>
          <p className="order-result-info">订单已超时或已被取消</p>
        </>
      ) : (
        <>
          <div className="order-result-icon">📋</div>
          <h2>订单提交成功</h2>
          <p className="order-result-info">
            订单号：{currentOrder.id}
          </p>
        </>
      )}

      <div className="order-amount">
        {formatPrice(currentOrder.finalAmount)}
      </div>

      {currentOrder.status === 'pending' && displayCountdown && !displayCountdown.isExpired && (
        <div className="order-countdown">
          <p style={{ marginBottom: '8px' }}>⏰ 请在以下时间内完成支付</p>
          <div className="countdown" style={{ justifyContent: 'center', fontSize: '24px' }}>
            <span className="countdown-item" style={{ padding: '8px 12px' }}>
              {String(displayCountdown.minutes).padStart(2, '0')}
            </span>
            <span>:</span>
            <span className="countdown-item" style={{ padding: '8px 12px' }}>
              {String(displayCountdown.seconds).padStart(2, '0')}
            </span>
          </div>
        </div>
      )}

      <div className="order-detail">
        <div className="order-detail-row">
          <span style={{ color: '#666' }}>订单状态</span>
          <span style={{ color: getStatusColor(currentOrder.status), fontWeight: 'bold' }}>
            {getStatusText(currentOrder.status)}
          </span>
        </div>
        <div className="order-detail-row">
          <span style={{ color: '#666' }}>商品数量</span>
          <span>{currentOrder.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} 件</span>
        </div>
        <div className="order-detail-row">
          <span style={{ color: '#666' }}>商品总额</span>
          <span>{formatPrice(currentOrder.totalAmount)}</span>
        </div>
        {currentOrder.discountAmount > 0 && (
          <div className="order-detail-row">
            <span style={{ color: '#666' }}>优惠金额</span>
            <span style={{ color: '#52c41a' }}>- {formatPrice(currentOrder.discountAmount)}</span>
          </div>
        )}
        <div className="order-detail-row">
          <span style={{ color: '#666' }}>实付金额</span>
          <span style={{ color: '#ff4757', fontWeight: 'bold', fontSize: '18px' }}>
            {formatPrice(currentOrder.finalAmount)}
          </span>
        </div>
        {currentOrder.address && (
          <>
            <div className="order-detail-row">
              <span style={{ color: '#666' }}>收货人</span>
              <span>{currentOrder.address.name}</span>
            </div>
            <div className="order-detail-row">
              <span style={{ color: '#666' }}>联系电话</span>
              <span>{currentOrder.address.phone}</span>
            </div>
            <div className="order-detail-row">
              <span style={{ color: '#666' }}>收货地址</span>
              <span>{currentOrder.address.address}</span>
            </div>
          </>
        )}
        <div className="order-detail-row">
          <span style={{ color: '#666' }}>下单时间</span>
          <span>{new Date(currentOrder.createTime).toLocaleString()}</span>
        </div>
      </div>

      {currentOrder.items && currentOrder.items.length > 0 && (
        <div style={{
          maxWidth: '500px',
          margin: '20px auto',
          textAlign: 'left'
        }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>商品清单</h3>
          {currentOrder.items.map((item, index) => (
            <div key={index} style={{
              display: 'flex',
              gap: '12px',
              padding: '12px 0',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <img
                src={item.image}
                alt={item.name}
                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}>{item.name}</div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {item.spec || '标准款'} x{item.quantity}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#ff4757' }}>
                  {formatPrice((item.finalPrice || item.price) * item.quantity)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
        {currentOrder.status === 'pending' && !displayCountdown?.isExpired && (
          <button
            className="btn btn-primary"
            onClick={handlePay}
            disabled={paying}
            style={{ padding: '12px 32px' }}
          >
            {paying ? '支付中...' : '立即支付'}
          </button>
        )}
        <button
          className="btn btn-outline"
          onClick={() => navigate('/products')}
          style={{ padding: '12px 32px' }}
        >
          继续购物
        </button>
      </div>
    </div>
  )
}

export default OrderResult
