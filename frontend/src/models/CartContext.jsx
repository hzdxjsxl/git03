import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { usePromotion } from './PromotionContext.jsx'
import { calculateCartTotal } from '../utils/priceCalculator.js'

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([])
  const [selectedItems, setSelectedItems] = useState([])
  const { getActivePromotions } = usePromotion()

  const addToCart = useCallback((product, quantity = 1, spec = null) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(
        item => item.id === product.id && item.spec === spec
      )

      if (existingIndex > -1) {
        const newItems = [...prev]
        newItems[existingIndex].quantity += quantity
        return newItems
      }

      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        spec: spec || product.specs?.[0] || null,
        quantity,
        stock: product.stock,
        warehouse: product.warehouse
      }]
    })

    setSelectedItems(prev => {
      const key = `${product.id}_${spec || 'default'}`
      if (!prev.includes(key)) {
        return [...prev, key]
      }
      return prev
    })
  }, [])

  const removeFromCart = useCallback((productId, spec = null) => {
    setCartItems(prev => prev.filter(
      item => !(item.id === productId && item.spec === spec)
    ))
    const key = `${productId}_${spec || 'default'}`
    setSelectedItems(prev => prev.filter(k => k !== key))
  }, [])

  const updateQuantity = useCallback((productId, spec, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, spec)
      return
    }
    setCartItems(prev => prev.map(item => {
      if (item.id === productId && item.spec === spec) {
        return { ...item, quantity: Math.min(quantity, item.stock) }
      }
      return item
    }))
  }, [removeFromCart])

  const toggleSelectItem = useCallback((productId, spec = null) => {
    const key = `${productId}_${spec || 'default'}`
    setSelectedItems(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key)
      }
      return [...prev, key]
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([])
    } else {
      const allKeys = cartItems.map(item => `${item.id}_${item.spec || 'default'}`)
      setSelectedItems(allKeys)
    }
  }, [cartItems, selectedItems])

  const clearCart = useCallback(() => {
    setCartItems([])
    setSelectedItems([])
  }, [])

  const getSelectedCartItems = useMemo(() => {
    return cartItems.filter(item => {
      const key = `${item.id}_${item.spec || 'default'}`
      return selectedItems.includes(key)
    })
  }, [cartItems, selectedItems])

  const cartTotal = useMemo(() => {
    const activePromotions = getActivePromotions()
    return calculateCartTotal(getSelectedCartItems, activePromotions)
  }, [getSelectedCartItems, getActivePromotions])

  const cartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0)
  }, [cartItems])

  const isAllSelected = useMemo(() => {
    return cartItems.length > 0 && selectedItems.length === cartItems.length
  }, [cartItems, selectedItems])

  const value = {
    cartItems,
    selectedItems,
    cartCount,
    cartTotal,
    isAllSelected,
    getSelectedCartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    toggleSelectItem,
    toggleSelectAll,
    clearCart
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}
