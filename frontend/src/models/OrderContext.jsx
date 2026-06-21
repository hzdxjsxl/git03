import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
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
  const timerRef = useRef(null)

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
    if (currentOrder && currentOrder.status === 'pending') {
      timerRef.current = setInterval(() => {
        const cd = calculateOrderCountdown(currentOrder)
        setCountdown(cd)

        if (cd && cd.isExpired) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
          }
          setCurrentOrder(prev => prev ? { ...prev, status: 'cancelled' } : null)
        }
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
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
