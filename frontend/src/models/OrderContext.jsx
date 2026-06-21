import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { orderApi } from '../services/api.js'
import { useCart } from './CartContext.jsx'

const OrderContext = createContext()

export const useOrder = () => {
  const context = useContext(OrderContext)
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider')
  }
  return context
}

export const OrderProvider = ({ children }) => {
  const [currentOrder, setCurrentOrder] = useState(null)
  const [orderHistory, setOrderHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const { clearCart } = useCart()

  const createOrder = useCallback(async (orderData) => {
    setLoading(true)
    try {
      const data = await orderApi.createOrder(orderData)
      setCurrentOrder(data)
      setOrderHistory(prev => [data, ...prev])
      clearCart()
      return data
    } catch (error) {
      console.error('创建订单失败:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [clearCart])

  const fetchOrder = useCallback(async (orderId) => {
    setLoading(true)
    try {
      const data = await orderApi.getOrder(orderId)
      setCurrentOrder(data)
      return data
    } catch (error) {
      console.error('获取订单失败:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const payOrder = useCallback(async (orderId) => {
    setLoading(true)
    try {
      const data = await orderApi.payOrder(orderId)
      setCurrentOrder(data)
      setOrderHistory(prev => prev.map(o => o.id === orderId ? data : o))
      return data
    } catch (error) {
      console.error('支付订单失败:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const calculateOrderCountdown = useCallback((order) => {
    if (!order || order.status !== 'pending') {
      return null
    }

    const diff = Math.max(0, order.expireTime - Date.now())
    const minutes = Math.floor(diff / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return {
      minutes,
      seconds,
      totalMs: diff,
      isExpired: diff <= 0
    }
  }, [])

  useEffect(() => {
    let countdownTimer = null
    let pollTimer = null

    if (currentOrder && currentOrder.status === 'pending') {
      countdownTimer = setInterval(() => {
        const cd = calculateOrderCountdown(currentOrder)
        setCountdown(cd)

        if (cd && cd.isExpired) {
          if (countdownTimer) {
            clearInterval(countdownTimer)
          }
          if (pollTimer) {
            clearInterval(pollTimer)
          }
          setCurrentOrder(prev => prev ? { ...prev, status: 'cancelled' } : null)
        }
      }, 1000)

      pollTimer = setInterval(async () => {
        try {
          const freshOrder = await orderApi.getOrder(currentOrder.id)
          if (freshOrder && freshOrder.status !== currentOrder.status) {
            setCurrentOrder(freshOrder)
            setOrderHistory(prev => prev.map(o => o.id === freshOrder.id ? freshOrder : o))
            if (freshOrder.status !== 'pending' && countdownTimer) {
              clearInterval(countdownTimer)
            }
            if (freshOrder.status !== 'pending' && pollTimer) {
              clearInterval(pollTimer)
            }
          }
        } catch (e) {
          console.error('轮询订单状态失败:', e)
        }
      }, 5000)
    }

    return () => {
      if (countdownTimer) {
        clearInterval(countdownTimer)
      }
      if (pollTimer) {
        clearInterval(pollTimer)
      }
    }
  }, [currentOrder, calculateOrderCountdown])

  const value = {
    currentOrder,
    orderHistory,
    loading,
    countdown,
    createOrder,
    fetchOrder,
    payOrder,
    calculateOrderCountdown
  }

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  )
}
