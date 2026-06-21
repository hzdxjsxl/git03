import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { productApi } from '../services/api.js'

const ProductContext = createContext()

export const useProduct = () => {
  const context = useContext(ProductContext)
  if (!context) {
    throw new Error('useProduct must be used within a ProductProvider')
  }
  return context
}

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentProduct, setCurrentProduct] = useState(null)

  const fetchProducts = useCallback(async (params = {}) => {
    setLoading(true)
    try {
      const data = await productApi.getProducts(params)
      setProducts(data.list)
      return data
    } catch (error) {
      console.error('获取商品列表失败:', error)
      return { list: [], total: 0 }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const data = await productApi.getCategories()
      setCategories(data)
      return data
    } catch (error) {
      console.error('获取分类失败:', error)
      return []
    }
  }, [])

  const fetchProductDetail = useCallback(async (id) => {
    setLoading(true)
    try {
      const data = await productApi.getProduct(id)
      setCurrentProduct(data)
      return data
    } catch (error) {
      console.error('获取商品详情失败:', error)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [fetchProducts, fetchCategories])

  const value = {
    products,
    categories,
    loading,
    currentProduct,
    fetchProducts,
    fetchCategories,
    fetchProductDetail,
    setCurrentProduct
  }

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  )
}
