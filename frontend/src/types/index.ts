export interface Product {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  sales: number;
  tags: string[];
  description: string;
  createdAt: string;
}

export interface RecommendationResult {
  product: Product;
  score: number;
  rank: number;
  reasoning: string[];
  frontendScore?: number;
}

export interface RecommendationResponse {
  userId: string;
  results: RecommendationResult[];
  timestamp: number;
  totalCount: number;
  hasMore: boolean;
  offset: number;
  nextOffset?: number;
}

export interface ScrollBehavior {
  scrollSpeed: number;
  avgSpeed: number;
  direction: 'up' | 'down' | 'none';
  lastScrollTop: number;
  lastScrollTime: number;
  speedHistory: number[];
}

export interface VisibleProduct {
  productId: string;
  enterTime: number;
  visibleRatio: number;
}

export interface DwellTimeRecord {
  productId: string;
  duration: number;
  timestamp: number;
}

export interface UserProfile {
  userId: string;
  interests: Record<string, number>;
  priceRange: { min: number; max: number };
  preferredCategories: string[];
  lastUpdated: number;
  behaviorCount: number;
}

export interface ApiResponse<T> {
  status: string;
  data: T;
  meta?: {
    latency: number;
    timestamp: number;
  };
}
