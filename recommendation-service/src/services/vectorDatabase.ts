import { LRUCache } from 'lru-cache';
import { Product, Vector } from '../types';
import { cosineSimilarity } from '../utils/vector';
import { config } from '../config';
import { mockProducts } from '../data/products';

interface SearchResult {
  product: Product;
  similarity: number;
}

export class VectorDatabase {
  private products: Product[];
  private cache: LRUCache<string, SearchResult[]>;
  private index: Map<string, Product>;

  constructor(products?: Product[]) {
    this.products = products || mockProducts;
    this.index = new Map();
    this.products.forEach(p => this.index.set(p.id, p));

    this.cache = new LRUCache({
      max: config.cache.maxItems,
      ttl: config.cache.ttl,
    });
  }

  public search(
    queryVector: Vector,
    limit: number = 20,
    filters?: {
      category?: string;
      priceRange?: { min: number; max: number };
      minRating?: number;
    }
  ): SearchResult[] {
    const cacheKey = this.getCacheKey(queryVector, limit, filters);
    const cached = this.cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    let candidates = this.products;

    if (filters) {
      if (filters.category) {
        candidates = candidates.filter(p => p.category === filters.category);
      }
      if (filters.priceRange) {
        candidates = candidates.filter(
          p => p.price >= filters.priceRange!.min && p.price <= filters.priceRange!.max
        );
      }
      if (filters.minRating) {
        candidates = candidates.filter(p => p.rating >= filters.minRating!);
      }
    }

    const results: SearchResult[] = candidates.map(product => ({
      product,
      similarity: cosineSimilarity(queryVector, product.embedding),
    }));

    results.sort((a, b) => b.similarity - a.similarity);

    const topResults = results.slice(0, limit);
    this.cache.set(cacheKey, topResults);

    return topResults;
  }

  public searchAll(
    queryVector: Vector,
    filters?: {
      category?: string;
      priceRange?: { min: number; max: number };
      minRating?: number;
    }
  ): SearchResult[] {
    let candidates = this.products;

    if (filters) {
      if (filters.category) {
        candidates = candidates.filter(p => p.category === filters.category);
      }
      if (filters.priceRange) {
        candidates = candidates.filter(
          p => p.price >= filters.priceRange!.min && p.price <= filters.priceRange!.max
        );
      }
      if (filters.minRating) {
        candidates = candidates.filter(p => p.rating >= filters.minRating!);
      }
    }

    const results: SearchResult[] = candidates.map(product => ({
      product,
      similarity: cosineSimilarity(queryVector, product.embedding),
    }));

    results.sort((a, b) => b.similarity - a.similarity);

    return results;
  }

  public getProductById(id: string): Product | undefined {
    return this.index.get(id);
  }

  public getAllProducts(): Product[] {
    return [...this.products];
  }

  public getProductsByCategory(category: string): Product[] {
    return this.products.filter(p => p.category === category);
  }

  public getCategories(): string[] {
    return [...new Set(this.products.map(p => p.category))];
  }

  private getCacheKey(
    vector: Vector,
    limit: number,
    filters?: object
  ): string {
    const vectorHash = vector.values.slice(0, 5).join(',');
    return `${vectorHash}:${limit}:${JSON.stringify(filters || {})}`;
  }

  public getStats() {
    return {
      totalProducts: this.products.length,
      vectorDimension: config.vectorDimension,
      cacheSize: this.cache.size,
      categories: this.getCategories().length,
    };
  }
}

export const vectorDb = new VectorDatabase();
