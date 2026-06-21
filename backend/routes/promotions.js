const express = require('express');
const router = express.Router();
const promotions = require('../models/promotions');

router.get('/', (req, res) => {
  const now = Date.now();
  const activePromotions = promotions.filter(
    p => p.startTime <= now && p.endTime >= now
  );
  res.json({
    code: 200,
    data: activePromotions
  });
});

router.get('/product/:productId', (req, res) => {
  const now = Date.now();
  const productPromotions = promotions.filter(p => {
    if (p.startTime > now || p.endTime < now) return false;
    if (p.productIds && p.productIds.length > 0) {
      return p.productIds.includes(req.params.productId) ||
             p.buyProductId === req.params.productId;
    }
    return p.type === 'full_reduction';
  });
  res.json({
    code: 200,
    data: productPromotions
  });
});

router.get('/:id', (req, res) => {
  const promotion = promotions.find(p => p.id === req.params.id);
  if (!promotion) {
    return res.status(404).json({ code: 404, message: '活动不存在' });
  }
  res.json({
    code: 200,
    data: promotion
  });
});

module.exports = router;
