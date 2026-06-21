const express = require('express');
const cors = require('cors');
const path = require('path');

const generateRoutes = require('./routes/generate');
const libraryRoutes = require('./routes/library');
const scriptRoutes = require('./routes/script');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/static', express.static(path.join(__dirname, 'data', 'library')));

app.use('/api/generate', generateRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/script', scriptRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[Comic Generator] 后端服务已启动: http://localhost:${PORT}`);
  console.log(`[Comic Generator] 健康检查: http://localhost:${PORT}/api/health`);
});

module.exports = app;
