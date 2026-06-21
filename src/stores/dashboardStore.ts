import { create } from 'zustand';
import type {
  PostWithSentiment,
  AggregatedDataPoint,
  DashboardStats,
  Granularity,
  SmoothingAlgorithm
} from '../../shared/types';
import { aggregateByTime, calculateOverallStats } from '../utils/aggregation';
import { smoothData, calculateTrend } from '../utils/smoothing';
import { fetchPostsBatch, fetchStreamPosts, mergePostsWithSentiments } from '../services/api';

export const TIME_RANGE_HOURS = [1, 6, 12, 24, 24 * 7] as const;

const MAX_POSTS_CACHE = 150000;
const INITIAL_LOAD_HOURS = 24 * 7;

interface DashboardState {
  posts: PostWithSentiment[];
  aggregatedData: AggregatedDataPoint[];
  smoothedData: ReturnType<typeof smoothData> | null;
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  granularity: Granularity;
  smoothingAlgorithm: SmoothingAlgorithm;
  timeRangeHours: number;
  timeRange: { start: number; end: number };
  lastUpdate: number;

  loadInitialData: () => Promise<void>;
  updateWithStreamData: (newPosts: PostWithSentiment[]) => void;
  setGranularity: (g: Granularity) => void;
  setSmoothingAlgorithm: (a: SmoothingAlgorithm) => void;
  setTimeRangeByHours: (hours: number) => void;
  refreshData: () => Promise<void>;
}

function computeDerivedState(
  posts: PostWithSentiment[],
  granularity: Granularity,
  smoothingAlgorithm: SmoothingAlgorithm,
  timeRange: { start: number; end: number }
): {
  aggregated: AggregatedDataPoint[];
  smoothed: ReturnType<typeof smoothData>;
  stats: DashboardStats;
} {
  const filteredPosts = posts.filter(
    p => p.timestamp >= timeRange.start && p.timestamp <= timeRange.end
  );

  const aggregated = aggregateByTime(filteredPosts, granularity, timeRange.start, timeRange.end);
  const smoothed = smoothData(aggregated, smoothingAlgorithm);
  const overallStats = calculateOverallStats(filteredPosts);

  const stats: DashboardStats = {
    ...overallStats,
    trend: calculateTrend(smoothed.polaritySmoothed)
  };

  return { aggregated, smoothed, stats };
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  posts: [],
  aggregatedData: [],
  smoothedData: null,
  stats: null,
  isLoading: false,
  error: null,
  granularity: '15min',
  smoothingAlgorithm: 'movingAverage',
  timeRangeHours: 24,
  timeRange: {
    start: Date.now() - 24 * 60 * 60 * 1000,
    end: Date.now()
  },
  lastUpdate: 0,

  loadInitialData: async () => {
    set({ isLoading: true, error: null });

    try {
      const now = Date.now();
      const startTime = now - INITIAL_LOAD_HOURS * 60 * 60 * 1000;

      const batchData = await fetchPostsBatch(startTime, now, 60000);
      const posts = mergePostsWithSentiments(batchData.posts, batchData.sentiments);

      const { granularity, smoothingAlgorithm, timeRangeHours } = get();
      const timeRange = {
        start: now - timeRangeHours * 60 * 60 * 1000,
        end: now
      };
      const { aggregated, smoothed, stats } = computeDerivedState(
        posts,
        granularity,
        smoothingAlgorithm,
        timeRange
      );

      set({
        posts,
        aggregatedData: aggregated,
        smoothedData: smoothed,
        stats,
        timeRange,
        isLoading: false,
        lastUpdate: Date.now()
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load data',
        isLoading: false
      });
    }
  },

  updateWithStreamData: (newPosts: PostWithSentiment[]) => {
    const { posts, granularity, smoothingAlgorithm, timeRangeHours } = get();
    const now = Date.now();

    const allPosts = [...posts, ...newPosts].slice(-MAX_POSTS_CACHE);

    const timeRange = {
      start: now - timeRangeHours * 60 * 60 * 1000,
      end: now
    };

    const { aggregated, smoothed, stats } = computeDerivedState(
      allPosts,
      granularity,
      smoothingAlgorithm,
      timeRange
    );

    set({
      posts: allPosts,
      timeRange,
      aggregatedData: aggregated,
      smoothedData: smoothed,
      stats,
      lastUpdate: Date.now()
    });
  },

  setGranularity: (granularity: Granularity) => {
    const { posts, smoothingAlgorithm, timeRange } = get();
    const { aggregated, smoothed, stats } = computeDerivedState(
      posts,
      granularity,
      smoothingAlgorithm,
      timeRange
    );

    set({ granularity, aggregatedData: aggregated, smoothedData: smoothed, stats });
  },

  setSmoothingAlgorithm: (smoothingAlgorithm: SmoothingAlgorithm) => {
    const { aggregatedData } = get();
    const smoothed = smoothData(aggregatedData, smoothingAlgorithm);

    set({
      smoothingAlgorithm,
      smoothedData: smoothed,
      stats: get().stats
        ? { ...get().stats!, trend: calculateTrend(smoothed.polaritySmoothed) }
        : null
    });
  },

  setTimeRangeByHours: (hours: number) => {
    const { posts, granularity, smoothingAlgorithm } = get();
    const now = Date.now();
    const timeRange = {
      start: now - hours * 60 * 60 * 1000,
      end: now
    };

    const { aggregated, smoothed, stats } = computeDerivedState(
      posts,
      granularity,
      smoothingAlgorithm,
      timeRange
    );

    set({
      timeRangeHours: hours,
      timeRange,
      aggregatedData: aggregated,
      smoothedData: smoothed,
      stats
    });
  },

  refreshData: async () => {
    await get().loadInitialData();
  }
}));

export function useDataStream() {
  const updateWithStreamData = useDashboardStore(state => state.updateWithStreamData);

  async function pollStream() {
    try {
      const data = await fetchStreamPosts(8);
      if (data.posts.length > 0) {
        updateWithStreamData(data.posts);
      }
    } catch (error) {
      console.error('Stream poll error:', error);
    }
  }

  return pollStream;
}
