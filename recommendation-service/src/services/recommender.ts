import { LRUCache } from 'lru-cache';
import { RecommendationResult, RecommendationResponse, UserProfile } from '../types';
import { vectorDb } from './vectorDatabase';
import { userProfileService } from './userProfile';
import { config } from '../config';

interface CachedRecommendation {
  results: RecommendationResult[];
  timestamp: number;
}

export class RecommenderService {
  private sessionCache: LRUCache<string, CachedRecommendation>;
  private sessionTTL: number = 5 * 60 * 1000;

  constructor() {
    this.sessionCache = new LRUCache<string, CachedRecommendation>({
      max: 5000,
      ttl: this.sessionTTL,
    });
  }

  private buildCacheKey(
    userId: string,
    options?: {
      category?: string;
    }
  ): string {
    const parts: string[] = [`rec:${userId}`];
    if (options?.category) {
      parts.push(`cat:${options.category}`);
    }
    return parts.join('|');
  }

  public getRecommendations(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    options?: {
      category?: string;
      refresh?: boolean;
    }
  ): RecommendationResponse {
    const effectiveLimit = Math.min(
      Math.max(limit, config.recommendation.minLimit),
      config.recommendation.maxLimit
    );

    const cacheKey = this.buildCacheKey(userId, options);
    let cached = this.sessionCache.get(cacheKey);
    const shouldRefresh = options?.refresh || !cached;

    if (shouldRefresh) {
      cached = this.buildFullRecommendationList(userId, options?.category);
      this.sessionCache.set(cacheKey, cached);
    }

    if (!cached) {
      cached = this.buildFullRecommendationList(userId, options?.category);
      this.sessionCache.set(cacheKey, cached);
    }

    const allResults = cached.results;
    const paginatedResults = allResults.slice(offset, offset + effectiveLimit);
    const hasMore = offset + effectiveLimit < allResults.length;

    return {
      userId,
      results: paginatedResults.map((r, i) => ({ ...r, rank: offset + i + 1 })),
      timestamp: Date.now(),
      totalCount: allResults.length,
      hasMore,
      offset,
      nextOffset: hasMore ? offset + effectiveLimit : undefined,
    };
  }

  private buildFullRecommendationList(
    userId: string,
    category?: string
  ): CachedRecommendation {
    const profile = userProfileService.getOrCreateProfile(userId);
    const preferenceVector = userProfileService.getPreferenceVector(userId);
    const filters = userProfileService.getFilters(userId);

    const vectorResults = vectorDb.searchAll(preferenceVector, {
      category,
      priceRange: filters.priceRange,
    });

    const results: RecommendationResult[] = vectorResults.map((item, index) => {
      const baseScore = item.similarity;
      const categoryBoost = this.getCategoryBoost(item.product.category, profile);
      const popularityBoost = this.getPopularityBoost(item.product);
      const recencyBoost = this.getRecencyBoost(item.product);
      const diversityPenalty = this.getDiversityPenalty(index, vectorResults.length);

      const finalScore =
        baseScore * 0.5 +
        categoryBoost * 0.2 +
        popularityBoost * 0.15 +
        recencyBoost * 0.1 +
        diversityPenalty * 0.05;

      const reasoning = this.generateReasoning(item.product, profile, baseScore, categoryBoost, popularityBoost);

      return {
        product: item.product,
        score: Math.max(0, Math.min(1, finalScore)),
        rank: index + 1,
        reasoning,
      };
    });

    results.sort((a, b) => b.score - a.score);

    results.forEach((r, i) => {
      r.rank = i + 1;
    });

    return {
      results,
      timestamp: Date.now(),
    };
  }

  public invalidateSession(userId: string, category?: string): void {
    const cacheKey = this.buildCacheKey(userId, { category });
    this.sessionCache.delete(cacheKey);
  }

  public invalidateAllUserSessions(userId: string): void {
    for (const key of this.sessionCache.keys()) {
      if (key.startsWith(`rec:${userId}|`) || key === `rec:${userId}`) {
        this.sessionCache.delete(key);
      }
    }
  }

  private getCategoryBoost(category: string, profile: UserProfile): number {
    const interest = profile.interests[category] || 0;
    const maxInterest = Math.max(...Object.values(profile.interests), 1);
    return Math.min(interest / maxInterest, 1);
  }

  private getPopularityBoost(product: {
    sales: number;
    rating: number;
    reviewCount: number;
  }): number {
    const normalizedSales = Math.log10(product.sales + 1) / Math.log10(50001);
    const normalizedRating = product.rating / 5;
    const normalizedReviews = Math.log10(product.reviewCount + 1) / Math.log10(5001);
    return (normalizedSales * 0.5 + normalizedRating * 0.3 + normalizedReviews * 0.2);
  }

  private getRecencyBoost(product: { createdAt: string }): number {
    const createdDate = new Date(product.createdAt).getTime();
    const now = Date.now();
    const ageInDays = (now - createdDate) / (1000 * 60 * 60 * 24);
    return Math.max(0, 1 - ageInDays / 365);
  }

  private getDiversityPenalty(index: number, total: number): number {
    return 1 - (index / total) * 0.3;
  }

  private generateReasoning(
    product: { category: string; tags: string[]; rating: number },
    profile: UserProfile,
    similarity: number,
    categoryBoost: number,
    popularityBoost: number
  ): string[] {
    const reasoning: string[] = [];

    if (similarity > 0.7) {
      reasoning.push('与您的喜好高度匹配');
    } else if (similarity > 0.5) {
      reasoning.push('符合您的兴趣偏好');
    }

    if (categoryBoost > 0.5 && profile.preferredCategories.includes(product.category)) {
      reasoning.push(`您感兴趣的${product.category}类商品`);
    }

    if (popularityBoost > 0.7) {
      reasoning.push('热门畅销商品');
    } else if (popularityBoost > 0.5) {
      reasoning.push('广受好评');
    }

    if (product.rating >= 4.5) {
      reasoning.push('高评分商品');
    }

    const matchingTags = product.tags.filter(tag =>
      Object.keys(profile.interests).includes(tag));
    if (matchingTags.length > 0) {
      reasoning.push(`包含您喜欢的特点：${matchingTags.slice(0, 2).join('、')}`);
    }

    if (reasoning.length === 0) {
      reasoning.push('为您精选推荐');
    }

    return reasoning.slice(0, 3);
  }

  public getSimilarProducts(
    productId: string,
    limit: number = 10
  ) {
    const product = vectorDb.getProductById(productId);
    if (!product) {
      return null;
    }
    return vectorDb.search(product.embedding, limit + 1)
      .filter(r => r.product.id !== productId)
      .slice(0, limit)
      .map(r => ({
        product: r.product,
        similarity: r.similarity,
      }));
  }

  public getTrending(limit: number = 10) {
    const allProducts = vectorDb.getAllProducts();
    return allProducts
      .sort((a, b) => {
        const scoreA = a.sales * 0.6 + a.reviewCount * 0.3 + a.rating * 0.1;
        const scoreB = b.sales * 0.6 + b.reviewCount * 0.3 + b.rating * 0.1;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }
}

export const recommenderService = new RecommenderService();
