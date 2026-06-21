import { Router, Request, Response } from 'express';
import { recommenderService } from '../services/recommender';
import { extractUserId } from '../middleware/auth';
import { config } from '../config';

const router = Router();

router.get('/feed', extractUserId, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const limit = parseInt(req.query.limit as string) || config.recommendation.defaultLimit;
  const page = parseInt(req.query.page as string) || 0;
  const category = req.query.category as string | undefined;

  const startTime = Date.now();
  const result = recommenderService.getRecommendations(userId, limit, page, { category });
  const latency = Date.now() - startTime;

  res.setHeader('X-Response-Time', `${latency}ms`);
  
  res.json({
    status: 'success',
    data: result,
    meta: {
      latency,
      timestamp: Date.now(),
    },
  });
});

router.get('/similar/:productId', (req: Request, res: Response) => {
  const { productId } = req.params;
  const limit = parseInt(req.query.limit as string) || 10;

  const startTime = Date.now();
  const result = recommenderService.getSimilarProducts(productId, limit);
  const latency = Date.now() - startTime;

  if (!result) {
    return res.status(404).json({
      status: 'error',
      message: 'Product not found',
    });
  }

  res.setHeader('X-Response-Time', `${latency}ms`);
  
  res.json({
    status: 'success',
    data: result,
    meta: {
      latency,
      timestamp: Date.now(),
    },
  });
});

router.get('/trending', (_req: Request, res: Response) => {
  const limit = parseInt(_req.query.limit as string) || 10;

  const startTime = Date.now();
  const result = recommenderService.getTrending(limit);
  const latency = Date.now() - startTime;

  res.setHeader('X-Response-Time', `${latency}ms`);
  
  res.json({
    status: 'success',
    data: result,
    meta: {
      latency,
      timestamp: Date.now(),
    },
  });
});

export default router;
