export const calculateFlashSalePrice = (product, promotion) => {
  if (!promotion || promotion.type !== 'flash_sale') return product.price
  return Math.floor(product.price * promotion.discount * 100) / 100
}

export const calculateFullReduction = (totalAmount, promotion) => {
  if (!promotion || promotion.type !== 'full_reduction') return 0
  const rules = [...promotion.rules].sort((a, b) => b.threshold - a.threshold)
  for (const rule of rules) {
    if (totalAmount >= rule.threshold) {
      return rule.reduce
    }
  }
  return 0
}

export const isComboApplicable = (cartItems, promotion) => {
  if (!promotion || promotion.type !== 'combo') return false
  const productIds = cartItems.map(item => item.id)
  return promotion.productIds.every(id => productIds.includes(id))
}

export const calculateComboDiscount = (cartItems, promotion) => {
  if (!isComboApplicable(cartItems, promotion)) return 0
  const comboItems = cartItems.filter(item => promotion.productIds.includes(item.id))
  const originalTotal = comboItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  return Math.max(0, originalTotal - promotion.comboPrice)
}

export const calculateItemFinalPrice = (product, promotions) => {
  let finalPrice = product.price
  let appliedPromotion = null

  const flashSalePromo = promotions.find(p =>
    p.type === 'flash_sale' && p.productIds.includes(product.id)
  )

  if (flashSalePromo) {
    finalPrice = calculateFlashSalePrice(product, flashSalePromo)
    appliedPromotion = flashSalePromo
  }

  return { finalPrice, appliedPromotion, originalPrice: product.price }
}

export const calculateCartTotal = (cartItems, promotions) => {
  let itemTotal = 0
  let discountDetail = []

  const itemsWithPrice = cartItems.map(item => {
    const productPromotions = promotions.filter(p => {
      if (p.type === 'flash_sale') return p.productIds.includes(item.id)
      if (p.type === 'combo') return true
      if (p.type === 'full_reduction') return true
      if (p.type === 'buy_gift') return p.buyProductId === item.id || p.giftProductId === item.id
      return false
    })

    const { finalPrice, appliedPromotion } = calculateItemFinalPrice(item, productPromotions)
    const subtotal = finalPrice * item.quantity
    itemTotal += subtotal

    return {
      ...item,
      finalPrice,
      originalPrice: item.price,
      subtotal,
      itemDiscount: (item.price - finalPrice) * item.quantity,
      appliedPromotion
    }
  })

  const fullReductionPromo = promotions.find(p => p.type === 'full_reduction')
  const fullReductionAmount = calculateFullReduction(itemTotal, fullReductionPromo)
  if (fullReductionAmount > 0) {
    discountDetail.push({
      type: '满减优惠',
      amount: fullReductionAmount,
      promotion: fullReductionPromo
    })
  }

  const comboPromotions = promotions.filter(p => p.type === 'combo')
  let comboDiscount = 0
  comboPromotions.forEach(promo => {
    if (isComboApplicable(cartItems, promo)) {
      const discount = calculateComboDiscount(itemsWithPrice, promo)
      comboDiscount += discount
      discountDetail.push({
        type: '组合套餐',
        amount: discount,
        promotion: promo
      })
    }
  })

  const giftPromotions = promotions.filter(p => p.type === 'buy_gift')
  const gifts = []
  giftPromotions.forEach(promo => {
    const hasBuyProduct = cartItems.some(item => item.id === promo.buyProductId)
    if (hasBuyProduct) {
      gifts.push(promo)
    }
  })

  const totalDiscount = discountDetail.reduce((sum, d) => sum + d.amount, 0) +
    itemsWithPrice.reduce((sum, item) => sum + item.itemDiscount, 0)
  const finalAmount = Math.max(0, itemTotal - totalDiscount + comboDiscount - comboDiscount)

  const actualItemDiscount = itemsWithPrice.reduce((sum, item) => sum + item.itemDiscount, 0)
  const totalDiscountAmount = actualItemDiscount + fullReductionAmount + comboDiscount

  return {
    items: itemsWithPrice,
    itemTotal,
    totalDiscount: totalDiscountAmount,
    finalAmount: Math.max(0, itemTotal - totalDiscountAmount),
    discountDetail,
    gifts
  }
}

export const formatPrice = (price) => {
  return '¥' + price.toFixed(2)
}
