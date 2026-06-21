const express = require('express');
const router = express.Router();
const { warehouses, inventory } = require('../models/inventory');

router.get('/warehouses', (req, res) => {
  res.json({
    code: 200,
    data: warehouses
  });
});

router.get('/product/:productId', (req, res) => {
  const productInventory = inventory[req.params.productId];
  if (!productInventory) {
    return res.status(404).json({ code: 404, message: '无库存信息' });
  }
  res.json({
    code: 200,
    data: productInventory
  });
});

router.post('/batch', (req, res) => {
  const { productIds } = req.body;
  if (!Array.isArray(productIds)) {
    return res.status(400).json({ code: 400, message: '参数错误' });
  }

  const result = {};
  productIds.forEach(id => {
    result[id] = inventory[id] || [];
  });

  res.json({
    code: 200,
    data: result
  });
});

module.exports = router;
