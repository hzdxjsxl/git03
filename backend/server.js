const express = require('express');
const cors = require('cors');

const productsRouter = require('./routes/products');
const inventoryRouter = require('./routes/inventory');
const promotionsRouter = require('./routes/promotions');
const ordersRouter = require('./routes/orders');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    data: {
      status: 'ok',
      timestamp: Date.now(),
      service: 'inventory-scheduling-backend'
    }
  });
});

app.use('/api/products', productsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/promotions', promotionsRouter);
app.use('/api/orders', ordersRouter);

app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在'
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    code: 500,
    message: '服务器内部错误'
  });
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║  分布式电商库存调度平台 - 后端服务           ║
║  端口: ${PORT}                                 ║
║  状态: 运行中                                ║
║  设计原则: 极简、高可用、只读为主             ║
╚══════════════════════════════════════════════╝
  `);
  console.log(`健康检查: http://localhost:${PORT}/api/health`);
  console.log(`商品接口: http://localhost:${PORT}/api/products`);
  console.log(`库存接口: http://localhost:${PORT}/api/inventory/warehouses`);
  console.log(`促销接口: http://localhost:${PORT}/api/promotions`);
  console.log(`订单接口: http://localhost:${PORT}/api/orders/create`);
});
