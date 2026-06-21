import { Router, Request, Response } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { config } from '../config';

const router = Router();

const proxyOptions: any = {
  target: config.recommendationServiceUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/api/recommend': '/api/recommend',
    '^/api/user': '/api/user',
  },
  proxyTimeout: 30000,
  timeout: 30000,
  onProxyReq: (proxyReq: any, req: Request) => {
    const userId = req.headers['x-user-id'];
    if (userId) {
      proxyReq.setHeader('X-User-Id', userId as string);
    }
    const requestId = (req as any).requestId;
    if (requestId) {
      proxyReq.setHeader('X-Request-Id', requestId);
    }
  },
  onError: (err: Error, req: Request, res: Response) => {
    console.error(`Proxy error for ${req.url}:`, err.message);
    if (!res.headersSent) {
      res.status(503).json({
        status: 'error',
        message: 'Recommendation service is temporarily unavailable',
      });
    }
  },
};

const recommendationProxy = createProxyMiddleware(proxyOptions);

router.use('/api/recommend', recommendationProxy);
router.use('/api/user', recommendationProxy);

export default router;
