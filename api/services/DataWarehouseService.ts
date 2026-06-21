import type { Post, SentimentResult, PostWithSentiment } from '../../shared/types';
import { generateHistoricalData, generateStreamPost } from '../models/DataGenerator';

class DataWarehouseService {
  private historicalData: PostWithSentiment[] = [];
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const now = Date.now();
    const startTime = now - 7 * 24 * 60 * 60 * 1000;
    const postCount = 50000;

    console.log(`[DataWarehouse] 正在初始化 ${postCount} 条模拟数据...`);
    this.historicalData = generateHistoricalData(startTime, now, postCount);
    this.isInitialized = true;
    console.log(`[DataWarehouse] 初始化完成，共 ${this.historicalData.length} 条数据`);
  }

  async getPostsBatch(
    startTime: number,
    endTime: number,
    limit: number = 10000,
    offset: number = 0
  ): Promise<{ posts: Post[]; sentiments: SentimentResult[]; total: number; hasMore: boolean }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const filtered = this.historicalData.filter(
      p => p.timestamp >= startTime && p.timestamp <= endTime
    );

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    const posts = paginated.map(({ sentiment, ...post }) => post);
    const sentiments = paginated.map(p => p.sentiment);

    return { posts, sentiments, total, hasMore };
  }

  async getSentimentBatch(postIds: string[]): Promise<SentimentResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const idSet = new Set(postIds);
    return this.historicalData
      .filter(p => idSet.has(p.id))
      .map(p => p.sentiment);
  }

  async getStreamPosts(count: number = 10): Promise<{ posts: PostWithSentiment[]; serverTime: number }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const now = Date.now();
    const posts: PostWithSentiment[] = [];

    for (let i = 0; i < count; i++) {
      const post = generateStreamPost(now - i * 1000);
      posts.push(post);
      this.historicalData.push(post);
    }

    if (this.historicalData.length > 200000) {
      this.historicalData = this.historicalData.slice(-150000);
    }

    return { posts, serverTime: now };
  }

  async getStats(): Promise<{ totalPosts: number; timeRange: { start: number; end: number } }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return {
      totalPosts: this.historicalData.length,
      timeRange: {
        start: this.historicalData[0]?.timestamp || Date.now(),
        end: this.historicalData[this.historicalData.length - 1]?.timestamp || Date.now()
      }
    };
  }
}

export const dataWarehouseService = new DataWarehouseService();
