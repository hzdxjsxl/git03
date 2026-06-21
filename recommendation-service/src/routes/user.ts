import { Router, Request, Response } from 'express';
import { userProfileService } from '../services/userProfile';
import { extractUserId } from '../middleware/auth';
import { UserBehavior } from '../types';

const router = Router();

router.get('/profile', extractUserId, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const profile = userProfileService.getOrCreateProfile(userId);

  res.json({
    status: 'success',
    data: {
      userId: profile.userId,
      interests: profile.interests,
      priceRange: profile.priceRange,
      preferredCategories: profile.preferredCategories,
      lastUpdated: profile.lastUpdated,
      behaviorCount: profile.behaviorHistory.length,
    },
  });
});

router.post('/behavior', extractUserId, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const behavior = req.body as UserBehavior;

  if (!behavior.type || !behavior.productId) {
    return res.status(400).json({
      status: 'error',
      message: 'Behavior type and productId are required',
    });
  }

  const validTypes: UserBehavior['type'][] = ['view', 'click', 'purchase', 'like', 'share'];
  if (!validTypes.includes(behavior.type)) {
    return res.status(400).json({
      status: 'error',
      message: `Invalid behavior type. Must be one of: ${validTypes.join(', ')}`,
    });
  }

  const profile = userProfileService.updateProfileWithBehavior(userId, behavior);

  res.json({
    status: 'success',
    data: {
      userId: profile.userId,
      message: 'Behavior recorded successfully',
      preferredCategories: profile.preferredCategories,
    },
  });
});

router.delete('/profile', extractUserId, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const deleted = userProfileService.deleteProfile(userId);

  res.json({
    status: 'success',
    data: {
      deleted,
      message: deleted ? 'Profile deleted successfully' : 'Profile not found',
    },
  });
});

export default router;
