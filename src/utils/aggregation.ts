import type { PostWithSentiment, AggregatedDataPoint, Granularity } from '../../shared/types';

const GRANULARITY_MS: Record<Granularity, number> = {
  '5min': 5 * 60 * 1000,
  '15min': 15 * 60 * 1000,
  '1hour': 60 * 60 * 1000,
  '6hour': 6 * 60 * 60 * 1000,
  '1day': 24 * 60 * 60 * 1000
};

export function aggregateByTime(
  posts: PostWithSentiment[],
  granularity: Granularity = '15min',
  startTime?: number,
  endTime?: number
): AggregatedDataPoint[] {
  if (posts.length === 0) return [];

  const bucketSize = GRANULARITY_MS[granularity];
  const actualStart = startTime ?? posts[0].timestamp;
  const actualEnd = endTime ?? posts[posts.length - 1].timestamp;

  const buckets = new Map<number, AggregatedDataPoint>();

  for (const post of posts) {
    if (post.timestamp < actualStart || post.timestamp > actualEnd) continue;

    const bucketKey = Math.floor(post.timestamp / bucketSize) * bucketSize;

    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, {
        timestamp: bucketKey,
        count: 0,
        avgPolarity: 0,
        weightedPolarity: 0,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0
      });
    }

    const bucket = buckets.get(bucketKey)!;
    const { polarity } = post.sentiment;
    const weight = post.likes + post.comments * 2 + post.shares * 3 + 1;

    bucket.count++;
    bucket.avgPolarity += polarity;
    bucket.weightedPolarity += polarity * weight;
    bucket.totalLikes += post.likes;
    bucket.totalComments += post.comments;
    bucket.totalShares += post.shares;

    if (polarity > 0.3) {
      bucket.positiveCount++;
    } else if (polarity < -0.3) {
      bucket.negativeCount++;
    } else {
      bucket.neutralCount++;
    }
  }

  const result: AggregatedDataPoint[] = [];
  for (let t = Math.floor(actualStart / bucketSize) * bucketSize; t <= actualEnd; t += bucketSize) {
    const bucket = buckets.get(t);
    if (bucket) {
      bucket.avgPolarity /= bucket.count;
      const totalWeight = bucket.totalLikes + bucket.totalComments * 2 + bucket.totalShares * 3 + bucket.count;
      bucket.weightedPolarity /= totalWeight;
      result.push(bucket);
    } else {
      result.push({
        timestamp: t,
        count: 0,
        avgPolarity: 0,
        weightedPolarity: 0,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0
      });
    }
  }

  return result;
}

export function calculateOverallStats(posts: PostWithSentiment[]) {
  let total = posts.length;
  let positive = 0;
  let negative = 0;
  let neutral = 0;
  let totalPolarity = 0;
  let totalWeight = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;

  const emotionSum = { anger: 0, joy: 0, sadness: 0, fear: 0, surprise: 0 };
  const keywordMap = new Map<string, { count: number; sentimentSum: number }>();
  const platformMap = new Map<string, number>();

  for (const post of posts) {
    const { polarity } = post.sentiment;
    const weight = post.likes + post.comments * 2 + post.shares * 3 + 1;

    totalPolarity += polarity * weight;
    totalWeight += weight;
    totalLikes += post.likes;
    totalComments += post.comments;
    totalShares += post.shares;

    if (polarity > 0.3) positive++;
    else if (polarity < -0.3) negative++;
    else neutral++;

    for (const [emotion, value] of Object.entries(post.sentiment.emotions)) {
      emotionSum[emotion as keyof typeof emotionSum] += value * weight;
    }

    for (const kw of post.sentiment.keywords) {
      const existing = keywordMap.get(kw) || { count: 0, sentimentSum: 0 };
      existing.count++;
      existing.sentimentSum += polarity * weight;
      keywordMap.set(kw, existing);
    }

    platformMap.set(post.platform, (platformMap.get(post.platform) || 0) + 1);
  }

  const weightedPolarity = totalWeight > 0 ? totalPolarity / totalWeight : 0;
  const sentimentIndex = Math.round((weightedPolarity + 1) * 50);
  const heatIndex = Math.round(Math.min(100, (totalLikes + totalComments * 2 + totalShares * 3) / Math.max(1, total) / 10));

  const emotionDistribution = {
    anger: emotionSum.anger / totalWeight,
    joy: emotionSum.joy / totalWeight,
    sadness: emotionSum.sadness / totalWeight,
    fear: emotionSum.fear / totalWeight,
    surprise: emotionSum.surprise / totalWeight
  };

  const platformDistribution: Record<string, number> = {};
  for (const [platform, count] of platformMap) {
    platformDistribution[platform] = count;
  }

  const topKeywords = Array.from(keywordMap.entries())
    .map(([name, data]) => ({
      name,
      value: data.count,
      count: data.count,
      sentiment: data.sentimentSum / (data.count * Math.max(1, totalWeight / total))
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 100);

  return {
    totalPosts: total,
    positiveRatio: total > 0 ? positive / total : 0,
    negativeRatio: total > 0 ? negative / total : 0,
    neutralRatio: total > 0 ? neutral / total : 0,
    sentimentIndex,
    heatIndex,
    weightedPolarity,
    emotionDistribution,
    platformDistribution,
    topKeywords
  };
}

export function mergeAggregatedData(
  existing: AggregatedDataPoint[],
  newPosts: PostWithSentiment[],
  granularity: Granularity
): AggregatedDataPoint[] {
  if (newPosts.length === 0) return existing;

  const bucketSize = GRANULARITY_MS[granularity];
  const bucketMap = new Map<number, AggregatedDataPoint>();

  for (const point of existing) {
    bucketMap.set(point.timestamp, { ...point });
  }

  for (const post of newPosts) {
    const bucketKey = Math.floor(post.timestamp / bucketSize) * bucketSize;

    if (!bucketMap.has(bucketKey)) {
      bucketMap.set(bucketKey, {
        timestamp: bucketKey,
        count: 0,
        avgPolarity: 0,
        weightedPolarity: 0,
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0
      });
    }

    const bucket = bucketMap.get(bucketKey)!;
    const { polarity } = post.sentiment;
    const weight = post.likes + post.comments * 2 + post.shares * 3 + 1;

    const oldTotalWeight = bucket.totalLikes + bucket.totalComments * 2 + bucket.totalShares * 3 + bucket.count;
    const newTotalWeight = oldTotalWeight + weight;

    bucket.avgPolarity = (bucket.avgPolarity * bucket.count + polarity) / (bucket.count + 1);
    bucket.weightedPolarity = (bucket.weightedPolarity * oldTotalWeight + polarity * weight) / newTotalWeight;
    bucket.count++;
    bucket.totalLikes += post.likes;
    bucket.totalComments += post.comments;
    bucket.totalShares += post.shares;

    if (polarity > 0.3) bucket.positiveCount++;
    else if (polarity < -0.3) bucket.negativeCount++;
    else bucket.neutralCount++;
  }

  return Array.from(bucketMap.values()).sort((a, b) => a.timestamp - b.timestamp);
}
