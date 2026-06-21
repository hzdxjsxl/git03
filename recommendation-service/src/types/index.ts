export interface Vector {
  values: number[];
}

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
  embedding: Vector;
  createdAt: string;
}

export interface UserBehavior {
  type: 'view' | 'click' | 'purchase' | 'like' | 'share';
  productId: string;
  timestamp: number;
  duration?: number;
  scrollSpeed?: number;
}

export interface UserProfile {
  userId: string;
  interests: Record<string, number>;
  priceRange: { min: number; max: number };
  preferredCategories: string[];
  behaviorHistory: UserBehavior[];
  preferenceVector: Vector;
  lastUpdated: number;
  sessionStartTime: number;
}

export interface RecommendationResult {
  product: Product;
  score: number;
  rank: number;
  reasoning: string[];
}

export interface RecommendationResponse {
  userId: string;
  results: RecommendationResult[];
  timestamp: number;
  totalCount: number;
  hasMore: boolean;
}

export interface UserProfileUpdateRequest {
  behavior: UserBehavior;
}
