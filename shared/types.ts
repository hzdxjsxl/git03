export type Platform = 'weibo' | 'wechat' | 'douyin' | 'xiaohongshu' | 'bilibili';

export interface Post {
  id: string;
  content: string;
  timestamp: number;
  platform: Platform;
  userId: string;
  likes: number;
  comments: number;
  shares: number;
}

export interface SentimentResult {
  postId: string;
  polarity: number;
  confidence: number;
  emotions: {
    anger: number;
    joy: number;
    sadness: number;
    fear: number;
    surprise: number;
  };
  keywords: string[];
}

export interface PostWithSentiment extends Post {
  sentiment: SentimentResult;
}

export interface AggregatedDataPoint {
  timestamp: number;
  count: number;
  avgPolarity: number;
  weightedPolarity: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
}

export interface TimeSeriesData {
  timestamps: number[];
  polarity: number[];
  positive: number[];
  negative: number[];
  neutral: number[];
  volume: number[];
}

export interface KeywordItem {
  name: string;
  value: number;
  sentiment: number;
  count: number;
}

export interface EmotionDistribution {
  anger: number;
  joy: number;
  sadness: number;
  fear: number;
  surprise: number;
}

export interface DashboardStats {
  totalPosts: number;
  positiveRatio: number;
  negativeRatio: number;
  neutralRatio: number;
  sentimentIndex: number;
  heatIndex: number;
  trend: 'up' | 'down' | 'stable';
  platformDistribution: Record<Platform, number>;
  emotionDistribution: EmotionDistribution;
  topKeywords: KeywordItem[];
}

export interface GetPostsBatchRequest {
  startTime: number;
  endTime: number;
  limit?: number;
  offset?: number;
}

export interface GetPostsBatchResponse {
  posts: Post[];
  sentiments: SentimentResult[];
  total: number;
  hasMore: boolean;
}

export interface GetPostsStreamResponse {
  posts: PostWithSentiment[];
  serverTime: number;
}

export type Granularity = '5min' | '15min' | '1hour' | '6hour' | '1day';

export type SmoothingAlgorithm = 'movingAverage' | 'exponential' | 'savitzkyGolay';
