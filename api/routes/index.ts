import { Router } from 'express';
import { postsController } from '../controllers/PostsController';
import { sentimentController } from '../controllers/SentimentController';

const router = Router();

router.get('/posts/batch', postsController.getBatch.bind(postsController));
router.get('/posts/stream', postsController.getStream.bind(postsController));
router.get('/posts/stats', postsController.getStats.bind(postsController));
router.post('/sentiment/batch', sentimentController.getBatch.bind(sentimentController));

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

export default router;
