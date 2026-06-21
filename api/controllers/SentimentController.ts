import type { Request, Response } from 'express';
import { dataWarehouseService } from '../services/DataWarehouseService';

class SentimentController {
  async getBatch(req: Request, res: Response): Promise<void> {
    try {
      const { postIds } = req.body;

      if (!postIds || !Array.isArray(postIds)) {
        res.status(400).json({ error: 'postIds array is required' });
        return;
      }

      const sentiments = await dataWarehouseService.getSentimentBatch(postIds);
      res.json({ sentiments });
    } catch (error) {
      console.error('[SentimentController] getBatch error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const sentimentController = new SentimentController();
