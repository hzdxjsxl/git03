import { Request, Response, NextFunction } from 'express';

export const extractUserId = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const userId = (req.headers['x-user-id'] as string) || req.query.userId as string;
  
  if (!userId) {
    return _res.status(400).json({
      status: 'error',
      message: 'User ID is required. Please provide X-User-Id header or userId query parameter',
    });
  }

  (req as any).userId = userId;
  next();
};
