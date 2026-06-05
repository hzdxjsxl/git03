export interface Feature {
  word: string;
  weight: number;
}

export interface ArticleMeta {
  id: string;
  title: string;
  summary: string;
  cover: string;
  author: string;
  publishTime: number;
  category: string;
  tags: string[];
  readCount: number;
  keywords: string[];
}

export interface ArticleContent {
  id: string;
  content: string;
  keywords: string[];
}

export interface RecommendRequest {
  features: Feature[];
  pageSize?: number;
  excludeIds?: string[];
}

export interface RecommendResponse {
  articleIds: string[];
  hasMore: boolean;
}

export interface ArticlesRequest {
  ids: string[];
}

export interface ArticlesResponse {
  articles: ArticleMeta[];
}

export interface UserProfile {
  features: Map<string, number>;
  readHistory: Set<string>;
  categoryPreference: Map<string, number>;
  lastUpdated: number;
}

export interface ReadRecord {
  articleId: string;
  readTime: number;
  scrollDepth: number;
  timestamp: number;
}
