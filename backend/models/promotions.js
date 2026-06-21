const promotions = [
  {
    id: 'PROMO001',
    name: '限时秒杀',
    type: 'flash_sale',
    discount: 0.8,
    startTime: Date.now() - 3600000,
    endTime: Date.now() + 7200000,
    productIds: ['P001', 'P003', 'P006'],
    description: '限时2小时，全场8折'
  },
  {
    id: 'PROMO002',
    name: '满减优惠',
    type: 'full_reduction',
    rules: [
      { threshold: 1000, reduce: 100 },
      { threshold: 3000, reduce: 400 },
      { threshold: 5000, reduce: 800 },
      { threshold: 10000, reduce: 2000 }
    ],
    startTime: Date.now() - 86400000,
    endTime: Date.now() + 604800000,
    productIds: [],
    description: '全场满减，上不封顶'
  },
  {
    id: 'PROMO003',
    name: '组合套餐',
    type: 'combo',
    comboPrice: 9999,
    productIds: ['P001', 'P003'],
    originalTotal: 9798,
    startTime: Date.now() - 86400000,
    endTime: Date.now() + 2592000000,
    description: 'iPhone + AirPods 组合套餐更优惠'
  },
  {
    id: 'PROMO004',
    name: '买赠活动',
    type: 'buy_gift',
    giftProductId: 'P006',
    buyProductId: 'P002',
    startTime: Date.now() - 86400000,
    endTime: Date.now() + 1209600000,
    description: '买MacBook送小米手环'
  }
];

module.exports = promotions;
