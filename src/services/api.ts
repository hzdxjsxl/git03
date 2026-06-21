import type {
  GetPostsBatchResponse,
  GetPostsStreamResponse,
  PostWithSentiment,
  SentimentResult
} from '../../shared/types';

const API_BASE = '/api';

export async function fetchPostsBatch(
  startTime: number,
  endTime: number,
  limit: number = 20000
): Promise<GetPostsBatchResponse> {
  const params = new URLSearchParams({
    startTime: String(startTime),
    endTime: String(endTime),
    limit: String(limit)
  });

  const response = await fetch(`${API_BASE}/posts/batch?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch posts: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchSentimentBatch(postIds: string[]): Promise<SentimentResult[]> {
  const response = await fetch(`${API_BASE}/sentiment/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ postIds })
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch sentiments: ${response.statusText}`);
  }

  const data = await response.json();
  return data.sentiments;
}

export async function fetchStreamPosts(count: number = 10): Promise<GetPostsStreamResponse> {
  const params = new URLSearchParams({ count: String(count) });
  const response = await fetch(`${API_BASE}/posts/stream?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch stream: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchHealth(): Promise<{ status: string; timestamp: number }> {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) {
    throw new Error('Health check failed');
  }
  return response.json();
}

export function mergePostsWithSentiments(
  posts: GetPostsBatchResponse['posts'],
  sentiments: GetPostsBatchResponse['sentiments']
): PostWithSentiment[] {
  const sentimentMap = new Map(sentiments.map(s => [s.postId, s]));

  return posts.map(post => ({
    ...post,
    sentiment: sentimentMap.get(post.id) || {
      postId: post.id,
      polarity: 0,
      confidence: 0.5,
      emotions: { anger: 0, joy: 0, sadness: 0, fear: 0, surprise: 0 },
      keywords: []
    }
  }));
}
