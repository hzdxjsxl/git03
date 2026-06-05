import { Router } from 'express';
import type { RecommendRequest, RecommendResponse } from '../../shared/types';
import { searchIndex, articleContents } from '../app';

const router = Router();

router.post('/', (req, res) => {
  const { features, pageSize = 20, excludeIds = [] }: RecommendRequest = req.body;
  
  const excludeSet = new Set(excludeIds);
  
  const matchedIds = searchIndex.search(features, excludeSet);
  
  const resultIds = matchedIds.slice(0, pageSize);
  const hasMore = matchedIds.length > pageSize;
  
  const response: RecommendResponse = {
    articleIds: resultIds,
    hasMore,
  };
  
  res.json(response);
});

router.get('/random', (req, res) => {
  const count = parseInt(req.query.count as string) || 20;
  const excludeIds = (req.query.exclude as string)?.split(',') || [];
  
  const excludeSet = new Set(excludeIds);
  const randomIds = searchIndex.getRandomArticles(count, excludeSet);
  
  res.json({
    articleIds: randomIds,
    hasMore: searchIndex.size() > excludeSet.size + count,
  });
});

export default router;
