import type { Feature, ArticleMeta, ReadRecord, UserProfile } from '../../shared/types';

const STORAGE_KEY = 'newsfeed_user_profile';
const DECAY_FACTOR = 0.95;
const MAX_FEATURES = 100;
const MIN_WEIGHT = 0.01;

export class FeatureEngine {
  private profile: UserProfile;

  constructor() {
    this.profile = this.loadProfile();
  }

  private loadProfile(): UserProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return {
          features: new Map(Object.entries(data.features || {})),
          readHistory: new Set(data.readHistory || []),
          categoryPreference: new Map(Object.entries(data.categoryPreference || {})),
          lastUpdated: data.lastUpdated || Date.now(),
        };
      }
    } catch (e) {
      console.warn('Failed to load profile:', e);
    }
    
    return {
      features: new Map(),
      readHistory: new Set(),
      categoryPreference: new Map(),
      lastUpdated: Date.now(),
    };
  }

  saveProfile(): void {
    try {
      const data = {
        features: Object.fromEntries(this.profile.features),
        readHistory: Array.from(this.profile.readHistory),
        categoryPreference: Object.fromEntries(this.profile.categoryPreference),
        lastUpdated: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save profile:', e);
    }
  }

  decayWeights(): void {
    const now = Date.now();
    const hoursSinceUpdate = (now - this.profile.lastUpdated) / (1000 * 60 * 60);
    
    if (hoursSinceUpdate >= 1) {
      const decay = Math.pow(DECAY_FACTOR, hoursSinceUpdate);
      for (const [word, weight] of this.profile.features) {
        const newWeight = weight * decay;
        if (newWeight < MIN_WEIGHT) {
          this.profile.features.delete(word);
        } else {
          this.profile.features.set(word, newWeight);
        }
      }
      this.profile.lastUpdated = now;
    }
  }

  calculateWeight(readTime: number, scrollDepth: number): number {
    const timeScore = Math.min(readTime / 60000, 1);
    const depthScore = scrollDepth / 100;
    return 0.4 + 0.3 * timeScore + 0.3 * depthScore;
  }

  updateFromArticle(article: ArticleMeta, record: ReadRecord): void {
    this.decayWeights();
    
    const baseWeight = this.calculateWeight(record.readTime, record.scrollDepth);
    
    for (const keyword of article.keywords) {
      const current = this.profile.features.get(keyword) || 0;
      this.profile.features.set(keyword, Math.min(current + baseWeight, 10));
    }
    
    const category = article.category;
    const currentCatWeight = this.profile.categoryPreference.get(category) || 0;
    this.profile.categoryPreference.set(category, Math.min(currentCatWeight + baseWeight * 0.5, 10));
    
    this.profile.readHistory.add(article.id);
    
    this.trimFeatures();
    this.saveProfile();
  }

  private trimFeatures(): void {
    if (this.profile.features.size > MAX_FEATURES) {
      const sorted = Array.from(this.profile.features.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, MAX_FEATURES);
      this.profile.features = new Map(sorted);
    }
  }

  getTopFeatures(count: number = 20): Feature[] {
    this.decayWeights();
    return Array.from(this.profile.features.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([word, weight]) => ({ word, weight }));
  }

  getFeaturesForRequest(): Feature[] {
    return this.getTopFeatures(50);
  }

  getReadHistory(): Set<string> {
    return new Set(this.profile.readHistory);
  }

  hasRead(articleId: string): boolean {
    return this.profile.readHistory.has(articleId);
  }

  addFeature(word: string, weight: number): void {
    const current = this.profile.features.get(word) || 0;
    this.profile.features.set(word, Math.min(current + weight, 10));
    this.trimFeatures();
    this.saveProfile();
  }

  setFeatureWeight(word: string, weight: number): void {
    if (weight <= MIN_WEIGHT) {
      this.profile.features.delete(word);
    } else {
      this.profile.features.set(word, Math.min(weight, 10));
    }
    this.saveProfile();
  }

  getCategoryPreference(): Map<string, number> {
    return new Map(this.profile.categoryPreference);
  }

  resetProfile(): void {
    this.profile = {
      features: new Map(),
      readHistory: new Set(),
      categoryPreference: new Map(),
      lastUpdated: Date.now(),
    };
    this.saveProfile();
  }

  getReadCount(): number {
    return this.profile.readHistory.size;
  }

  getProfile(): UserProfile {
    return {
      features: new Map(this.profile.features),
      readHistory: new Set(this.profile.readHistory),
      categoryPreference: new Map(this.profile.categoryPreference),
      lastUpdated: this.profile.lastUpdated,
    };
  }
}

export const featureEngine = new FeatureEngine();
