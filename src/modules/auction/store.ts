import { create } from 'zustand';
import type { AuctionItem, BidRecord, NewBidEventData, AuctionEndEventData } from '../../types';

interface AuctionStore {
  auctions: AuctionItem[];
  currentAuction: AuctionItem | null;
  bidHistory: BidRecord[];
  isLoading: boolean;
  error: string | null;
  serverTimeOffset: number;
  
  fetchAuctions: () => Promise<void>;
  fetchAuctionDetail: (id: string) => Promise<void>;
  fetchBidHistory: (auctionId: string) => Promise<void>;
  placeBid: (auctionId: string, price: number) => Promise<boolean>;
  createAuction: (data: { title: string; description: string; startPrice: number; duration: number }) => Promise<AuctionItem | null>;
  syncServerTime: () => Promise<void>;
  handleNewBidEvent: (data: NewBidEventData) => void;
  handleAuctionEndEvent: (data: AuctionEndEventData) => void;
  setCurrentAuction: (auction: AuctionItem | null) => void;
}

const API_BASE = '/api';

export const useAuctionStore = create<AuctionStore>((set, get) => ({
  auctions: [],
  currentAuction: null,
  bidHistory: [],
  isLoading: false,
  error: null,
  serverTimeOffset: 0,
  
  fetchAuctions: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/auctions`);
      const data = await res.json();
      if (data.success) {
        set({ auctions: data.data });
      }
    } catch (error) {
      set({ error: '获取拍卖列表失败' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  fetchAuctionDetail: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/auction/${id}`);
      const data = await res.json();
      if (data.success) {
        set({ currentAuction: data.data });
      }
    } catch (error) {
      set({ error: '获取拍卖详情失败' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  fetchBidHistory: async (auctionId: string) => {
    try {
      const res = await fetch(`${API_BASE}/auction/${auctionId}/bids`);
      const data = await res.json();
      if (data.success) {
        set({ bidHistory: data.data });
      }
    } catch (error) {
      console.error('获取出价历史失败:', error);
    }
  },
  
  placeBid: async (auctionId: string, price: number) => {
    const { currentUser } = useUserStore.getState();
    
    try {
      const res = await fetch(`${API_BASE}/auction/${auctionId}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price,
          userId: currentUser?.id || 'anonymous',
          userName: currentUser?.name || '匿名用户',
          userAvatar: currentUser?.avatar || '',
        }),
      });
      const data = await res.json();
      return data.success;
    } catch (error) {
      return false;
    }
  },
  
  createAuction: async (data) => {
    try {
      const res = await fetch(`${API_BASE}/auction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          images: ['https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&h=600&fit=crop'],
          category: '其他',
          condition: '全新',
        }),
      });
      const result = await res.json();
      if (result.success) {
        set((state) => ({
          auctions: [...state.auctions, result.data],
        }));
        return result.data;
      }
      return null;
    } catch (error) {
      return null;
    }
  },
  
  syncServerTime: async () => {
    try {
      const res = await fetch(`${API_BASE}/time`);
      const data = await res.json();
      if (data.success) {
        const offset = data.data.timestamp - Date.now();
        set({ serverTimeOffset: offset });
      }
    } catch (error) {
      console.error('时间同步失败:', error);
    }
  },
  
  handleNewBidEvent: (data: NewBidEventData) => {
    const { currentAuction, auctions, bidHistory } = get();
    
    set({
      auctions: auctions.map((a) =>
        a.id === data.auctionId
          ? { ...a, currentPrice: data.price, bidCount: a.bidCount + 1 }
          : a
      ),
      currentAuction:
        currentAuction?.id === data.auctionId
          ? { ...currentAuction, currentPrice: data.price, bidCount: currentAuction.bidCount + 1 }
          : currentAuction,
      bidHistory: currentAuction?.id === data.auctionId
        ? [
            ...bidHistory,
            {
              id: Math.random().toString(36).substring(2, 15),
              auctionId: data.auctionId,
              userId: data.userId,
              userName: data.userName,
              userAvatar: data.userAvatar,
              price: data.price,
              timestamp: data.timestamp,
            },
          ]
        : bidHistory,
    });
  },
  
  handleAuctionEndEvent: (data: AuctionEndEventData) => {
    const { auctions } = get();
    set({
      auctions: auctions.map((a) =>
        a.id === data.auctionId
          ? { ...a, endTime: Date.now() - 1000 }
          : a
      ),
    });
  },
  
  setCurrentAuction: (auction: AuctionItem | null) => {
    set({ currentAuction: auction });
  },
}));

import { useUserStore } from '../user/store';
