import express from 'express';
import cors from 'cors';
import apiRoutes from './routes';
import { dataWarehouseService } from './services/DataWarehouseService';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

const PORT = process.env.API_PORT || 3001;

async function startServer() {
  try {
    await dataWarehouseService.initialize();

    app.listen(PORT, () => {
      console.log(`\n========================================`);
      console.log(`  舆情分析服务已启动`);
      console.log(`  后端服务端口: ${PORT}`);
      console.log(`  健康检查: http://localhost:${PORT}/api/health`);
      console.log(`========================================\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

export { app, startServer };
