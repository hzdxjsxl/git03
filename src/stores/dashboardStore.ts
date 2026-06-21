import { create } from 'zustand';
import type {
  PostWithSentiment,
  AggregatedDataPoint,
  DashboardStats,
  Granularity,
  SmoothingAlgorithm
} from '../../shared/types';
import { aggregateByTime, calculateOverallStats, mergeAggregatedData } from '../utils/aggregation';
import { smoothData, calculateTrend } from '../utils/smoothing';
import { fetchPostsBatch, fetchStreamPosts, mergePostsWithSentiments } from '../services/api';

interface DashboardState {
  posts: PostWithSentiment[];
  aggregatedData: AggregatedDataPoint[];
  smoothedData: ReturnType<typeof smoothData> | null;
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  granularity: Granularity;
  smoothingAlgorithm: SmoothingAlgorithm;
  timeRange: { start: number; end: number };
  lastUpdate: number;

  loadInitialData: () => Promise<void>;
  updateWithStreamData: (newPosts: PostWithSentiment[]) => void;
  setGranularity: (g: Granularity) => void;
  setSmoothingAlgorithm: (a: SmoothingAlgorithm) => void;
  setTimeRange: (start: number, end: number) => void;
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
  timeRange: {
    start: Date.now() - 24 * 60 * 60 * 1000,
    end: Date.now()
  },
  lastUpdate: 0,

  loadInitialData: async () => {
    set({ isLoading: true, error: null });

    try {
      const now = Date.now();
      const startTime = now - 24 * 60 * 60 * 1000;

      const batchData = await fetchPostsBatch(startTime, now, 50000);
      const posts = mergePostsWithSentiments(batchData.posts, batchData.sentiments);

      const { granularity, smoothingAlgorithm } = get();
      const timeRange = { start: startTime, end: now };
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
    const { posts, granularity, smoothingAlgorithm, timeRange, aggregatedData } = get();

    const allPosts = [...posts, ...newPosts];
    const newAggregated = mergeAggregatedData(aggregatedData, newPosts, granularity);
    const smoothed = smoothData(newAggregated, smoothingAlgorithm);
    const overallStats = calculateOverallStats(
      allPosts.filter(p => p.timestamp >= timeRange.start && p.timestamp <= timeRange.end)
    );

    set({
      posts: allPosts.slice(-100000),
      aggregatedData: newAggregated,
      smoothedData: smoothed,
      stats: {
        ...overallStats,
        trend: calculateTrend(smoothed.polaritySmoothed)
      },
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
    const { posts, granularity, timeRange, aggregatedData } = get();
    const smoothed = smoothData(aggregatedData, smoothingAlgorithm);

    set({
      smoothingAlgorithm,
      smoothedData: smoothed,
      stats: get().stats
        ? { ...get().stats!, trend: calculateTrend(smoothed.polaritySmoothed) }
        : null
    });
  },

  setTimeRange: (start: number, end: number) => {
    const { posts, granularity, smoothingAlgorithm } = get();
    const timeRange = { start, end };
    const { aggregated, smoothed, stats } = computeDerivedState(
      posts,
      granularity,
      smoothingAlgorithm,
      timeRange
    );

    set({ timeRange, aggregatedData: aggregated, smoothedData: smoothed, stats });
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
