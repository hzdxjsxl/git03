import type { Request, Response } from 'express';
import { dataWarehouseService } from '../services/DataWarehouseService';

class PostsController {
  async getBatch(req: Request, res: Response): Promise<void> {
    try {
      const { startTime, endTime, limit, offset } = req.query;

      if (!startTime || !endTime) {
        res.status(400).json({ error: 'startTime and endTime are required' });
        return;
      }

      const result = await dataWarehouseService.getPostsBatch(
        Number(startTime),
        Number(endTime),
        limit ? Number(limit) : 10000,
        offset ? Number(offset) : 0
      );

      res.json(result);
    } catch (error) {
      console.error('[PostsController] getBatch error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getStream(req: Request, res: Response): Promise<void> {
    try {
      const { count } = req.query;
      const result = await dataWarehouseService.getStreamPosts(
        count ? Number(count) : 10
      );
      res.json(result);
    } catch (error) {
      console.error('[PostsController] getStream error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await dataWarehouseService.getStats();
      res.json(stats);
    } catch (error) {
      console.error('[PostsController] getStats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const postsController = new PostsController();
