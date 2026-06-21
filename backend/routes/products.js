const express = require('express');
const router = express.Router();
const products = require('../models/products');

router.get('/', (req, res) => {
  const { category, keyword, page = 1, pageSize = 10 } = req.query;
  let result = [...products];

  if (category) {
    result = result.filter(p => p.category === category);
  }

  if (keyword) {
    result = result.filter(p =>
      p.name.includes(keyword) || p.description.includes(keyword)
    );
  }

  const start = (page - 1) * pageSize;
  const end = start + parseInt(pageSize);
  const paginatedResult = result.slice(start, end);

  res.json({
    code: 200,
    data: {
      list: paginatedResult,
      total: result.length,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  });
});

router.get('/categories', (req, res) => {
  const categories = [...new Set(products.map(p => p.category))];
  res.json({
    code: 200,
    data: categories
  });
});

router.get('/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ code: 404, message: '商品不存在' });
  }
  res.json({
    code: 200,
    data: product
  });
});

module.exports = router;
