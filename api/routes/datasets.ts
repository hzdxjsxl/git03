import { Router, type Request, type Response } from 'express';
import { datasetRegistry } from '../generators/DatasetRegistry.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const datasets = datasetRegistry.getDatasetList();
    res.status(200).json(datasets);
  } catch (error) {
    console.error('Error fetching datasets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch datasets',
    });
  }
});

export default router;
