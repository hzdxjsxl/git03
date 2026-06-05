import axios from 'axios';
import type {
  RecommendRequest,
  RecommendResponse,
  ArticlesRequest,
  ArticlesResponse,
  ArticleMeta,
  ArticleContent,
} from '../../shared/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const recommendApi = {
  getRecommendations: async (
    features: RecommendRequest['features'],
    pageSize: number = 20,
    excludeIds: string[] = []
  ): Promise<RecommendResponse> => {
    const response = await api.post<RecommendResponse>('/recommend', {
      features,
      pageSize,
      excludeIds,
    });
    return response.data;
  },

  getRandom: async (count: number = 20, excludeIds: string[] = []): Promise<RecommendResponse> => {
    const response = await api.get<RecommendResponse>('/recommend/random', {
      params: {
        count,
        exclude: excludeIds.join(','),
      },
    });
    return response.data;
  },
};

export const articlesApi = {
  getMetaBatch: async (ids: string[]): Promise<ArticleMeta[]> => {
    const response = await api.post<ArticlesResponse>('/articles/meta', { ids });
    return response.data.articles;
  },

  getContent: async (id: string): Promise<ArticleContent> => {
    const response = await api.get<ArticleContent>(`/articles/${id}/content`);
    return response.data;
  },

  getMeta: async (id: string): Promise<ArticleMeta> => {
    const response = await api.get<ArticleMeta>(`/articles/${id}/meta`);
    return response.data;
  },
};

export default api;
