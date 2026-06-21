import { RecommendationResult, ScrollBehavior, DwellTimeRecord } from '../types';

export interface RerankConfig {
  scrollSpeedWeight: number;
  dwellTimeWeight: number;
  baseScoreWeight: number;
  diversityWeight: number;
  recencyWeight: number;
}

const DEFAULT_CONFIG: RerankConfig = {
  scrollSpeedWeight: 0.25,
  dwellTimeWeight: 0.35,
  baseScoreWeight: 0.3,
  diversityWeight: 0.05,
  recencyWeight: 0.05,
};

export class FrontendReRanker {
  private config: RerankConfig;
  private dwellTimeMap: Map<string, number>;
  private categoryViewCounts: Map<string, number>;

  constructor(config?: Partial<RerankConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.dwellTimeMap = new Map();
    this.categoryViewCounts = new Map();
  }

  public updateDwellTime(dwellRecords: DwellTimeRecord[]): void {
    for (const record of dwellRecords) {
      const current = this.dwellTimeMap.get(record.productId) || 0;
      this.dwellTimeMap.set(record.productId, current + record.duration);
    }
  }

  public updateCategoryView(category: string): void {
    const count = this.categoryViewCounts.get(category) || 0;
    this.categoryViewCounts.set(category, count + 1);
  }

  public rerank(
    results: RecommendationResult[],
    scrollBehavior: ScrollBehavior
  ): RecommendationResult[] {
    const reranked = results.map((item) => {
      const frontendScore = this.calculateFrontendScore(item, scrollBehavior);
      return {
        ...item,
        frontendScore,
      };
    });

    reranked.sort((a, b) => (b.frontendScore || 0) - (a.frontendScore || 0));

    return reranked.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }

  private calculateFrontendScore(
    item: RecommendationResult,
    scrollBehavior: ScrollBehavior
  ): number {
    const baseScore = item.score;
    const scrollSpeedScore = this.calculateScrollSpeedScore(scrollBehavior);
    const dwellTimeScore = this.calculateDwellTimeScore(item.product.id);
    const diversityScore = this.calculateDiversityScore(item.product.category);
    const recencyScore = this.calculateRecencyScore(item.product.createdAt);

    const finalScore =
      baseScore * this.config.baseScoreWeight +
      scrollSpeedScore * this.config.scrollSpeedWeight +
      dwellTimeScore * this.config.dwellTimeWeight +
      diversityScore * this.config.diversityWeight +
      recencyScore * this.config.recencyWeight;

    return Math.max(0, Math.min(1, finalScore));
  }

  private calculateScrollSpeedScore(scrollBehavior: ScrollBehavior): number {
    const { avgSpeed, direction } = scrollBehavior;
    
    if (direction === 'none' || avgSpeed === 0) {
      return 0.8;
    }

    const normalizedSpeed = Math.min(avgSpeed / 200, 1);
    
    if (direction === 'down') {
      if (avgSpeed < 50) {
        return 1.0;
      } else if (avgSpeed < 100) {
        return 0.7;
      } else if (avgSpeed < 200) {
        return 0.4;
      } else {
        return 0.1;
      }
    } else {
      return 0.3 + (1 - normalizedSpeed) * 0.5;
    }
  }

  private calculateDwellTimeScore(productId: string): number {
    const dwellTime = this.dwellTimeMap.get(productId) || 0;
    if (dwellTime === 0) {
      return 0.5;
    }
    return Math.min(dwellTime / 5000, 1);
  }

  private calculateDiversityScore(category: string): number {
    const viewCount = this.categoryViewCounts.get(category) || 0;
    const totalViews = Array.from(this.categoryViewCounts.values()).reduce(
      (a, b) => a + b,
      0
    );
    
    if (totalViews === 0) {
      return 1;
    }
    
    const ratio = viewCount / totalViews;
    return Math.max(0, 1 - ratio * 2);
  }

  private calculateRecencyScore(createdAt: string): number {
    const createdDate = new Date(createdAt).getTime();
    const now = Date.now();
    const ageInDays = (now - createdDate) / (1000 * 60 * 60 * 24);
    return Math.max(0, 1 - ageInDays / 365);
  }

  public reset(): void {
    this.dwellTimeMap.clear();
    this.categoryViewCounts.clear();
  }
}

export const reranker = new FrontendReRanker();
