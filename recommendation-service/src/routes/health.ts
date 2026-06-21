import { Router, Request, Response } from 'express';
import { vectorDb } from '../services/vectorDatabase';
import { userProfileService } from '../services/userProfile';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'recommendation-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    stats: {
      vectorDb: vectorDb.getStats(),
      userProfiles: userProfileService.getStats(),
    },
  });
});

router.get('/categories', (_req: Request, res: Response) => {
  const categories = vectorDb.getCategories();
  res.json({
    status: 'success',
    data: categories,
  });
});

export default router;
