const BASE_URL = '/api'

const request = async (url, options = {}) => {
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })
    const data = await response.json()
    if (data.code === 200) {
      return data.data
    }
    throw new Error(data.message || '请求失败')
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

export const productApi = {
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return request(`/products${query ? '?' + query : ''}`)
  },
  getProduct: (id) => request(`/products/${id}`),
  getCategories: () => request('/products/categories')
}

export const inventoryApi = {
  getWarehouses: () => request('/inventory/warehouses'),
  getProductInventory: (productId) => request(`/inventory/product/${productId}`),
  getBatchInventory: (productIds) =>
    request('/inventory/batch', {
      method: 'POST',
      body: JSON.stringify({ productIds })
    })
}

export const promotionApi = {
  getPromotions: () => request('/promotions'),
  getPromotion: (id) => request(`/promotions/${id}`),
  getProductPromotions: (productId) => request(`/promotions/product/${productId}`)
}

export const orderApi = {
  createOrder: (orderData) =>
    request('/orders/create', {
      method: 'POST',
      body: JSON.stringify(orderData)
    }),
  getOrder: (id) => request(`/orders/${id}`),
  payOrder: (id) =>
    request(`/orders/${id}/pay`, {
      method: 'POST'
    })
}
