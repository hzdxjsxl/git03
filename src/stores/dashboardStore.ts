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

export const TIME_RANGE_HOURS = [1, 6, 12, 24, 24 * 7] as const;

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
  timeRangeHours: number;
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
  timeRange: {
    start: Date.now() - 24 * 60 * 60 * 1000,
    end: Date.now()
  },
  timeRangeHours: 24,
  lastUpdate: 0,

  loadInitialData: async () => {
    set({ isLoading: true, error: null });

    try {
      const now = Date.now();
      const { timeRangeHours } = get();
      const startTime = now - timeRangeHours * 60 * 60 * 1000;

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
    const { posts, granularity, smoothingAlgorithm, timeRange } = get();
    const now = Date.now();

    const filteredNewPosts = newPosts.filter(
      p => p.timestamp >= timeRange.start && p.timestamp <= now
    );

    if (filteredNewPosts.length === 0) return;

    const allPosts = [
      ...posts.filter(p => p.timestamp >= timeRange.start && p.timestamp <= now),
      ...filteredNewPosts
    ];

    const { aggregated, smoothed, stats } = computeDerivedState(
      allPosts,
      granularity,
      smoothingAlgorithm,
      timeRange
    );

    set({
      posts: allPosts.slice(-100000),
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
    const now = Date.now();
    const start = now - hours * 60 * 60 * 1000;
    const timeRange = { start, end: now };

    const { posts, granularity, smoothingAlgorithm } = get();

    const filteredPosts = posts.filter(
      p => p.timestamp >= start && p.timestamp <= now
    );

    const { aggregated, smoothed, stats } = computeDerivedState(
      filteredPosts,
      granularity,
      smoothingAlgorithm,
      timeRange
    );

    set({
      timeRangeHours: hours,
      timeRange,
      posts: filteredPosts,
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
