import { Router, type Request, type Response } from 'express';
import { datasetRegistry } from '../generators/DatasetRegistry.js';

const router = Router();

router.get('/:datasetId/metadata', async (req: Request, res: Response): Promise<void> => {
  try {
    const { datasetId } = req.params;
    const metadata = datasetRegistry.getMetadata(datasetId);

    if (!metadata) {
      res.status(404).json({ success: false, error: 'Dataset not found' });
      return;
    }

    res.status(200).json(metadata);
  } catch (error) {
    console.error('Error fetching metadata:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch metadata' });
  }
});

router.get('/:datasetId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { datasetId } = req.params;
    const chunkSize = parseInt(req.query.chunkSize as string) || 50000;
    const generator = datasetRegistry.getGenerator(datasetId);

    if (!generator) {
      res.status(404).json({ success: false, error: 'Dataset not found' });
      return;
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const totalPoints = generator.getPointCount();
    const totalChunks = Math.ceil(totalPoints / chunkSize);

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const startIndex = chunkIndex * chunkSize;
      const pointsInChunk = Math.min(chunkSize, totalPoints - startIndex);

      const pointData = generator.generateChunk(startIndex, pointsInChunk);

      const header = Buffer.alloc(8);
      header.writeUInt32LE(chunkIndex, 0);
      header.writeUInt32LE(pointsInChunk, 4);

      const dataBuffer = Buffer.from(pointData.buffer, pointData.byteOffset, pointData.byteLength);

      const chunk = Buffer.concat([header, dataBuffer]);

      if (!res.write(chunk)) {
        await new Promise<void>((resolve) => {
          res.once('drain', resolve);
        });
      }
    }

    res.end();
  } catch (error) {
    console.error('Error streaming point cloud:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Failed to stream point cloud' });
    } else {
      res.end();
    }
  }
});

export default router;
