export interface AuctionItem {
  id: string;
  title: string;
  description: string;
  images: string[];
  category: string;
  condition: string;
  startPrice: number;
  currentPrice: number;
  startTime: number;
  endTime: number;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  bidCount: number;
  viewCount: number;
  lastBidSequence?: number;
}

export interface BidRecord {
  id: string;
  auctionId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  price: number;
  timestamp: number;
  transactionId: string;
  sequence: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  email?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export type SSEEventType = 'new_bid' | 'auction_end' | 'price_update' | 'time_sync';

export interface SSEEvent<T = unknown> {
  type: SSEEventType;
  data: T;
}

export interface NewBidEventData {
  auctionId: string;
  bidId: string;
  price: number;
  userId: string;
  userName: string;
  userAvatar: string;
  timestamp: number;
  transactionId: string;
  sequence: number;
}

export interface AuctionEndEventData {
  auctionId: string;
  winnerId: string;
  winnerName: string;
  finalPrice: number;
  lastSequence: number;
}

export interface TimeSyncData {
  serverTimestamp: number;
  latency: number;
}

export interface CreateAuctionInput {
  title: string;
  description: string;
  images: string[];
  category: string;
  condition: string;
  startPrice: number;
  duration: number;
}

export interface PlaceBidInput {
  auctionId: string;
  price: number;
  userId: string;
  userName: string;
  userAvatar: string;
  transactionId: string;
  nonce: string;
}

export interface PlaceBidResponse {
  success: boolean;
  data?: {
    bidId: string;
    price: number;
    timestamp: number;
    transactionId: string;
    sequence: number;
  };
  error?: string;
  latency?: number;
  serverTimestamp?: number;
  requestId?: string;
  note?: string;
}

export interface ServerTimeResponse {
  success: boolean;
  data: {
    timestamp: number;
    serverTime: number;
    requestId: string;
  };
}
