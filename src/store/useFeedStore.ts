import { create } from 'zustand';
import type { ArticleMeta, Feature, ReadRecord } from '../../shared/types';
import { recommendApi, articlesApi } from '../utils/api';
import { featureEngine } from '../utils/featureEngine';
import { newsFeedEngine } from '../utils/newsFeedEngine';

interface FeedState {
  articles: ArticleMeta[];
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  page: number;
  fetching: boolean;
  features: Feature[];
  readHistory: string[];
  readCount: number;
}

interface FeedActions {
  loadInitialFeed: () => Promise<void>;
  loadMore: () => Promise<void>;
  refreshFeed: () => Promise<void>;
  recordRead: (article: ArticleMeta, record: ReadRecord) => void;
  setFeatureWeight: (word: string, weight: number) => void;
  addFeature: (word: string, weight: number) => void;
  resetProfile: () => void;
  syncFeatures: () => void;
}

export type FeedStore = FeedState & FeedActions;

export const useFeedStore = create<FeedStore>((set, get) => ({
  articles: [],
  loading: false,
  hasMore: true,
  error: null,
  page: 0,
  fetching: false,
  features: [],
  readHistory: [],
  readCount: 0,

  loadInitialFeed: async () => {
    if (get().loading) return;
    
    set({ loading: true, error: null });
    
    try {
      const features = featureEngine.getFeaturesForRequest();
      const readHistorySet = featureEngine.getReadHistory();
      const readHistoryArray = Array.from(readHistorySet);
      const readCount = readHistorySet.size;
      
      let articleIds: string[];
      let hasMore: boolean;
      
      if (features.length === 0) {
        const response = await recommendApi.getRandom(30, readHistoryArray);
        articleIds = response.articleIds;
        hasMore = response.hasMore;
      } else {
        const response = await recommendApi.getRecommendations(
          features,
          30,
          readHistoryArray
        );
        articleIds = response.articleIds;
        hasMore = response.hasMore;
      }
      
      const articles = await articlesApi.getMetaBatch(articleIds);
      
      newsFeedEngine.setReadHistory(readHistorySet);
      newsFeedEngine.setCategoryPreference(featureEngine.getCategoryPreference());
      newsFeedEngine.setFeatureWeights(new Map(features.map(f => [f.word, f.weight])));
      
      const processedArticles = newsFeedEngine.processFeed(articles);
      
      set({
        articles: processedArticles,
        loading: false,
        hasMore,
        page: 1,
        features: featureEngine.getTopFeatures(20),
        readHistory: readHistoryArray,
        readCount,
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load feed',
      });
    }
  },

  loadMore: async () => {
    const { loading, fetching, hasMore, articles, page, readHistory } = get();
    if (loading || fetching || !hasMore) return;
    
    set({ fetching: true });
    
    try {
      const features = featureEngine.getFeaturesForRequest();
      const excludeIds = [...articles.map(a => a.id), ...readHistory];
      
      let articleIds: string[];
      let moreAvailable: boolean;
      
      if (features.length === 0) {
        const response = await recommendApi.getRandom(20, excludeIds);
        articleIds = response.articleIds;
        moreAvailable = response.hasMore;
      } else {
        const response = await recommendApi.getRecommendations(
          features,
          20,
          excludeIds
        );
        articleIds = response.articleIds;
        moreAvailable = response.hasMore;
      }
      
      const newArticles = await articlesApi.getMetaBatch(articleIds);
      
      const mergedArticles = newsFeedEngine.mergeFeeds(get().articles, newArticles);
      
      set({
        articles: mergedArticles,
        fetching: false,
        hasMore: moreAvailable,
        page: page + 1,
      });
    } catch (error) {
      set({
        fetching: false,
        error: error instanceof Error ? error.message : 'Failed to load more',
      });
    }
  },

  refreshFeed: async () => {
    set({ articles: [], page: 0, hasMore: true });
    await get().loadInitialFeed();
  },

  recordRead: (article: ArticleMeta, record: ReadRecord) => {
    featureEngine.updateFromArticle(article, record);
    
    const readHistorySet = featureEngine.getReadHistory();
    
    set(state => ({
      readHistory: Array.from(readHistorySet),
      readCount: readHistorySet.size,
      features: featureEngine.getTopFeatures(20),
      articles: state.articles.filter(a => a.id !== article.id),
    }));
  },

  setFeatureWeight: (word: string, weight: number) => {
    featureEngine.setFeatureWeight(word, weight);
    set({ features: featureEngine.getTopFeatures(20) });
  },

  addFeature: (word: string, weight: number) => {
    featureEngine.addFeature(word, weight);
    set({ features: featureEngine.getTopFeatures(20) });
  },

  resetProfile: () => {
    featureEngine.resetProfile();
    set({
      features: [],
      readHistory: [],
      readCount: 0,
      articles: [],
      hasMore: true,
      page: 0,
    });
    get().loadInitialFeed();
  },

  syncFeatures: () => {
    const readHistorySet = featureEngine.getReadHistory();
    set({
      features: featureEngine.getTopFeatures(20),
      readHistory: Array.from(readHistorySet),
      readCount: readHistorySet.size,
    });
  },
}));
