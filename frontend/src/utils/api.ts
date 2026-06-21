import { RecommendationResponse, UserProfile, ApiResponse } from '../types';

const API_BASE = '/api';
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

export const generateUserId = (): string => {
  let userId = localStorage.getItem('recommender_user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('recommender_user_id', userId);
  }
  return userId;
};

export const getUserId = (): string => {
  return localStorage.getItem('recommender_user_id') || generateUserId();
};

export const apiClient = {
  async getRecommendations(
    limit: number = 20,
    offset: number = 0,
    category?: string,
    refresh: boolean = false
  ): Promise<RecommendationResponse> {
    const userId = getUserId();
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (category) {
      params.append('category', category);
    }
    if (refresh) {
      params.append('refresh', 'true');
    }

    const response = await fetch(`${API_BASE}/recommend/feed?${params.toString()}`, {
      headers: {
        ...DEFAULT_HEADERS,
        'X-User-Id': userId,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as ApiResponse<RecommendationResponse>;
    return data.data;
  },

  async getUserProfile(): Promise<UserProfile> {
    const userId = getUserId();
    const response = await fetch(`${API_BASE}/user/profile`, {
      headers: {
        ...DEFAULT_HEADERS,
        'X-User-Id': userId,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as ApiResponse<UserProfile>;
    return data.data;
  },

  async recordBehavior(
    type: 'view' | 'click' | 'purchase' | 'like' | 'share',
    productId: string,
    duration?: number,
    scrollSpeed?: number
  ): Promise<void> {
    const userId = getUserId();
    await fetch(`${API_BASE}/user/behavior`, {
      method: 'POST',
      headers: {
        ...DEFAULT_HEADERS,
        'X-User-Id': userId,
      },
      body: JSON.stringify({
        type,
        productId,
        duration,
        scrollSpeed,
        timestamp: Date.now(),
      }),
    });
  },

  async getCategories(): Promise<string[]> {
    const response = await fetch(`/categories`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = (await response.json()) as ApiResponse<string[]>;
    return data.data;
  },
};
