import { LRUCache } from 'lru-cache';
import { UserProfile, UserBehavior, Vector } from '../types';
import { generateRandomVector, weightedAverageVectors, addVectors, scaleVector } from '../utils/vector';
import { config } from '../config';
import { vectorDb } from './vectorDatabase';

const behaviorWeights: Record<string, number> = {
  purchase: 1.0,
  click: 0.3,
  view: 0.1,
  like: 0.5,
  share: 0.4,
};

export class UserProfileService {
  private profiles: LRUCache<string, UserProfile>;

  constructor() {
    this.profiles = new LRUCache({
      max: config.cache.maxItems,
      ttl: config.cache.ttl * 2,
    });
  }

  public getOrCreateProfile(userId: string): UserProfile {
    let profile = this.profiles.get(userId);
    
    if (!profile) {
      profile = this.createDefaultProfile(userId);
      this.profiles.set(userId, profile);
    }
    
    return profile;
  }

  public updateProfileWithBehavior(
    userId: string,
    behavior: UserBehavior
  ): UserProfile {
    const profile = this.getOrCreateProfile(userId);
    const product = vectorDb.getProductById(behavior.productId);

    profile.behaviorHistory.push({
      ...behavior,
      timestamp: Date.now(),
    });

    if (profile.behaviorHistory.length > 100) {
      profile.behaviorHistory = profile.behaviorHistory.slice(-100);
    }

    if (product) {
      const weight = behaviorWeights[behavior.type] || 0.1;
      const durationBonus = behavior.duration 
        ? Math.min(behavior.duration / 10, 1.0)
        : 0;
      const scrollBonus = behavior.scrollSpeed
        ? Math.max(0, 1 - Math.abs(behavior.scrollSpeed - 50) / 100)
        : 0;

      const effectiveWeight = weight * (1 + durationBonus * 0.3 + scrollBonus * 0.2);

      profile.interests[product.category] = (profile.interests[product.category] || 0) + effectiveWeight;
      profile.interests[product.subCategory] = (profile.interests[product.subCategory] || 0) + effectiveWeight * 0.5;

      profile.preferredCategories = Object.entries(profile.interests)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category]) => category);

      const recentBehaviors = profile.behaviorHistory.slice(-20);
      const vectors: Vector[] = [];
      const weights: number[] = [];

      for (const bh of recentBehaviors) {
        const p = vectorDb.getProductById(bh.productId);
        if (p) {
          vectors.push(p.embedding);
          weights.push(behaviorWeights[bh.type] || 0.1);
        }
      }

      if (vectors.length > 0) {
        const newPreferenceVector = weightedAverageVectors(vectors, weights);
        profile.preferenceVector = {
          values: profile.preferenceVector.values.map((val, i) => 
            val * 0.7 + newPreferenceVector.values[i] * 0.3
          ),
        };
      }

      const prices = profile.behaviorHistory
        .map(bh => vectorDb.getProductById(bh.productId)?.price)
        .filter((p): p is number => p !== undefined);

      if (prices.length > 0) {
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        profile.priceRange = {
          min: Math.max(0, avgPrice * 0.5),
          max: avgPrice * 2.0,
        };
      }
    }

    profile.lastUpdated = Date.now();
    this.profiles.set(userId, profile);
    
    return profile;
  }

  public getPreferenceVector(userId: string): Vector {
    const profile = this.getOrCreateProfile(userId);
    return profile.preferenceVector;
  }

  public getFilters(userId: string) {
    const profile = this.getOrCreateProfile(userId);
    return {
      priceRange: profile.priceRange,
      preferredCategories: profile.preferredCategories,
    };
  }

  private createDefaultProfile(userId: string): UserProfile {
    return {
      userId,
      interests: {},
      priceRange: { min: 50, max: 2000 },
      preferredCategories: [],
      behaviorHistory: [],
      preferenceVector: generateRandomVector(config.vectorDimension),
      lastUpdated: Date.now(),
      sessionStartTime: Date.now(),
    };
  }

  public getStats() {
    return {
      totalProfiles: this.profiles.size,
    };
  }

  public deleteProfile(userId: string): boolean {
    return this.profiles.delete(userId);
  }
}

export const userProfileService = new UserProfileService();
