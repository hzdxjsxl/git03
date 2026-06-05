import type { ArticleMeta } from '../../shared/types';

interface FeedItem extends ArticleMeta {
  relevanceScore: number;
  freshnessScore: number;
  finalScore: number;
}

export class NewsFeedEngine {
  private readHistory: Set<string>;
  private categoryPreference: Map<string, number>;
  private featureWeights: Map<string, number>;

  constructor(
    readHistory: Set<string> = new Set(),
    categoryPreference: Map<string, number> = new Map(),
    featureWeights: Map<string, number> = new Map()
  ) {
    this.readHistory = readHistory;
    this.categoryPreference = categoryPreference;
    this.featureWeights = featureWeights;
  }

  setReadHistory(history: Set<string>): void {
    this.readHistory = history;
  }

  setCategoryPreference(pref: Map<string, number>): void {
    this.categoryPreference = pref;
  }

  setFeatureWeights(weights: Map<string, number>): void {
    this.featureWeights = weights;
  }

  dedupeByHistory(articles: ArticleMeta[]): ArticleMeta[] {
    return articles.filter(a => !this.readHistory.has(a.id));
  }

  calculateRelevance(article: ArticleMeta): number {
    let score = 0;
    
    for (const keyword of article.keywords) {
      score += this.featureWeights.get(keyword) || 0;
    }
    
    const categoryScore = this.categoryPreference.get(article.category) || 0;
    score += categoryScore * 0.5;
    
    return score;
  }

  calculateFreshness(article: ArticleMeta): number {
    const now = Date.now();
    const ageMs = now - article.publishTime;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    
    return Math.exp(-ageDays / 7);
  }

  calculateFinalScore(article: ArticleMeta): number {
    const relevance = this.calculateRelevance(article);
    const freshness = this.calculateFreshness(article);
    
    const normalizedRelevance = Math.min(relevance / 10, 1);
    
    return 0.6 * normalizedRelevance + 0.4 * freshness;
  }

  sortByRelevance(articles: ArticleMeta[]): ArticleMeta[] {
    const scored: FeedItem[] = articles.map(article => ({
      ...article,
      relevanceScore: this.calculateRelevance(article),
      freshnessScore: this.calculateFreshness(article),
      finalScore: this.calculateFinalScore(article),
    }));
    
    return scored
      .sort((a, b) => b.finalScore - a.finalScore)
      .map(({ relevanceScore, freshnessScore, finalScore, ...article }) => article);
  }

  ensureDiversity(articles: ArticleMeta[], maxPerCategory: number = 3): ArticleMeta[] {
    const categoryCount: Map<string, number> = new Map();
    const result: ArticleMeta[] = [];
    
    for (const article of articles) {
      const count = categoryCount.get(article.category) || 0;
      if (count < maxPerCategory) {
        result.push(article);
        categoryCount.set(article.category, count + 1);
      }
    }
    
    return result;
  }

  removeDuplicates(articles: ArticleMeta[]): ArticleMeta[] {
    const seen = new Set<string>();
    return articles.filter(article => {
      if (seen.has(article.id)) {
        return false;
      }
      seen.add(article.id);
      return true;
    });
  }

  processFeed(articles: ArticleMeta[]): ArticleMeta[] {
    let result = this.removeDuplicates(articles);
    
    result = this.dedupeByHistory(result);
    
    result = this.sortByRelevance(result);
    
    result = this.ensureDiversity(result);
    
    return result;
  }

  mergeFeeds(existing: ArticleMeta[], newArticles: ArticleMeta[]): ArticleMeta[] {
    const merged = [...existing, ...newArticles];
    return this.processFeed(merged);
  }
}

export const newsFeedEngine = new NewsFeedEngine();
