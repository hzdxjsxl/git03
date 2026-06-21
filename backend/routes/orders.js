const express = require('express');
const router = express.Router();

let orders = [];
let orderIdCounter = 10000;

router.post('/create', (req, res) => {
  const { items, totalAmount, discountAmount, finalAmount, address, paymentMethod, promotions } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ code: 400, message: '订单项不能为空' });
  }

  if (!finalAmount || finalAmount <= 0) {
    return res.status(400).json({ code: 400, message: '订单金额无效' });
  }

  const orderId = 'ORD' + (++orderIdCounter);
  const order = {
    id: orderId,
    items,
    totalAmount,
    discountAmount,
    finalAmount,
    address: address || {},
    paymentMethod: paymentMethod || 'alipay',
    promotions: promotions || [],
    status: 'pending',
    createTime: Date.now(),
    expireTime: Date.now() + 1800000
  };

  orders.push(order);

  setTimeout(() => {
    const o = orders.find(x => x.id === orderId);
    if (o && o.status === 'pending') {
      o.status = 'cancelled';
    }
  }, 1800000);

  res.json({
    code: 200,
    data: order
  });
});

router.get('/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ code: 404, message: '订单不存在' });
  }
  if (order.status === 'pending' && Date.now() > order.expireTime) {
    order.status = 'cancelled';
  }
  res.json({
    code: 200,
    data: order
  });
});

router.post('/:id/pay', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ code: 404, message: '订单不存在' });
  }
  if (order.status !== 'pending') {
    return res.status(400).json({ code: 400, message: '订单状态不正确' });
  }
  if (Date.now() > order.expireTime) {
    order.status = 'cancelled';
    return res.status(400).json({ code: 400, message: '订单已过期' });
  }

  order.status = 'paid';
  order.payTime = Date.now();

  res.json({
    code: 200,
    data: order
  });
});

module.exports = router;
