import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { promotionApi } from '../services/api.js'

const PromotionContext = createContext()

export const usePromotion = () => {
  const context = useContext(PromotionContext)
  if (!context) {
    throw new Error('usePromotion must be used within a PromotionProvider')
  }
  return context
}

export const PromotionProvider = ({ children }) => {
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(false)
  const [now, setNow] = useState(Date.now())
  const timerRef = useRef(null)

  const fetchPromotions = useCallback(async () => {
    setLoading(true)
    try {
      const data = await promotionApi.getPromotions()
      setPromotions(data)
      return data
    } catch (error) {
      console.error('获取促销活动失败:', error)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchProductPromotions = useCallback(async (productId) => {
    try {
      const data = await promotionApi.getProductPromotions(productId)
      return data
    } catch (error) {
      console.error('获取商品促销失败:', error)
      return []
    }
  }, [])

  useEffect(() => {
    fetchPromotions()
  }, [fetchPromotions])

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const getActivePromotions = useCallback(() => {
    return promotions.filter(p => p.startTime <= now && p.endTime >= now)
  }, [promotions, now])

  const getFlashSalePromotions = useCallback(() => {
    return getActivePromotions().filter(p => p.type === 'flash_sale')
  }, [getActivePromotions])

  const getPromotionCountdown = useCallback((promotion) => {
    if (!promotion) return { days: 0, hours: 0, minutes: 0, seconds: 0, isActive: false, isEnded: false }

    const isActive = promotion.startTime <= now && promotion.endTime >= now
    const isEnded = now > promotion.endTime
    const isNotStarted = now < promotion.startTime

    let targetTime
    if (isNotStarted) {
      targetTime = promotion.startTime
    } else if (isActive) {
      targetTime = promotion.endTime
    } else {
      targetTime = promotion.endTime
    }

    let diff = Math.max(0, targetTime - now)

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return {
      days,
      hours,
      minutes,
      seconds,
      isActive,
      isEnded,
      isNotStarted,
      statusText: isNotStarted ? '距开始' : (isActive ? '距结束' : '已结束')
    }
  }, [now])

  const value = {
    promotions,
    loading,
    now,
    fetchPromotions,
    fetchProductPromotions,
    getActivePromotions,
    getFlashSalePromotions,
    getPromotionCountdown
  }

  return (
    <PromotionContext.Provider value={value}>
      {children}
    </PromotionContext.Provider>
  )
}
