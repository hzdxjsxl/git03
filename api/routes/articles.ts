import { Router } from 'express';
import type { ArticlesRequest, ArticlesResponse } from '../../shared/types';
import { searchIndex, articleContents } from '../app';

const router = Router();

router.post('/meta', (req, res) => {
  const { ids }: ArticlesRequest = req.body;
  
  const articles = searchIndex.getArticles(ids);
  
  const response: ArticlesResponse = {
    articles,
  };
  
  res.json(response);
});

router.get('/:id/content', (req, res) => {
  const { id } = req.params;
  const content = articleContents.get(id);
  
  if (!content) {
    res.status(404).json({ error: 'Article not found' });
    return;
  }
  
  res.json(content);
});

router.get('/:id/meta', (req, res) => {
  const { id } = req.params;
  const meta = searchIndex.getArticle(id);
  
  if (!meta) {
    res.status(404).json({ error: 'Article not found' });
    return;
  }
  
  res.json(meta);
});

export default router;
