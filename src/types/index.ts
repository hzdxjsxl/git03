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
}

export interface BidRecord {
  id: string;
  auctionId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  price: number;
  timestamp: number;
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

export type SSEEventType = 'new_bid' | 'auction_end' | 'price_update';

export interface SSEEvent<T = unknown> {
  type: SSEEventType;
  data: T;
}

export interface NewBidEventData {
  auctionId: string;
  price: number;
  userId: string;
  userName: string;
  userAvatar: string;
  timestamp: number;
}

export interface AuctionEndEventData {
  auctionId: string;
  winnerId: string;
  winnerName: string;
  finalPrice: number;
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
