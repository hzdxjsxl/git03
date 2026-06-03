import { create } from 'zustand';
import type {
  AuctionItem,
  BidRecord,
  NewBidEventData,
  AuctionEndEventData,
  PlaceBidResponse,
} from '../../types';

interface AuctionStore {
  auctions: AuctionItem[];
  currentAuction: AuctionItem | null;
  bidHistory: BidRecord[];
  isLoading: boolean;
  error: string | null;
  serverTimeOffset: number;
  latency: number;
  lastSyncTime: number;
  processedBidIds: Set<string>;
  processedTransactionIds: Set<string>;
  lastSequences: Map<string, number>;
  pendingBids: Map<string, { price: number; timestamp: number }>;

  fetchAuctions: () => Promise<void>;
  fetchAuctionDetail: (id: string) => Promise<void>;
  fetchBidHistory: (auctionId: string) => Promise<void>;
  placeBid: (auctionId: string, price: number) => Promise<boolean>;
  createAuction: (data: {
    title: string;
    description: string;
    startPrice: number;
    duration: number;
  }) => Promise<AuctionItem | null>;
  syncServerTime: () => Promise<number>;
  handleNewBidEvent: (data: NewBidEventData) => boolean;
  handleAuctionEndEvent: (data: AuctionEndEventData) => void;
  handleTimeSyncEvent: (serverTimestamp: number) => void;
  setCurrentAuction: (auction: AuctionItem | null) => void;
  getAdjustedTime: () => number;
  generateTransactionId: (auctionId: string) => string;
  generateNonce: () => string;
  isBidProcessed: (bidId: string) => boolean;
  clearProcessedIds: () => void;
}

const API_BASE = '/api';

const generateTransactionId = (auctionId: string): string => {
  return `tx_${auctionId}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
};

const generateNonce = (): string => {
  return `nonce_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
};

export const useAuctionStore = create<AuctionStore>((set, get) => ({
  auctions: [],
  currentAuction: null,
  bidHistory: [],
  isLoading: false,
  error: null,
  serverTimeOffset: 0,
  latency: 0,
  lastSyncTime: 0,
  processedBidIds: new Set(),
  processedTransactionIds: new Set(),
  lastSequences: new Map(),
  pendingBids: new Map(),

  fetchAuctions: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/auctions`);
      const data = await res.json();
      if (data.success) {
        const auctions = data.data as AuctionItem[];
        const lastSequences = new Map<string, number>();
        
        auctions.forEach((a) => {
          if (a.lastBidSequence !== undefined) {
            lastSequences.set(a.id, a.lastBidSequence);
          }
        });

        set({ auctions, lastSequences });
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
        const auction = data.data as AuctionItem;
        
        set((state) => ({
          currentAuction: auction,
          lastSequences: new Map(state.lastSequences).set(
            id,
            auction.lastBidSequence || 0
          ),
        }));
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
        const bids = data.data as BidRecord[];
        const processedBidIds = new Set(get().processedBidIds);
        const lastSequences = new Map(get().lastSequences);

        bids.forEach((bid) => {
          processedBidIds.add(bid.id);
          if (bid.sequence) {
            lastSequences.set(auctionId, Math.max(lastSequences.get(auctionId) || 0, bid.sequence));
          }
        });

        set({ bidHistory: bids, processedBidIds, lastSequences });
      }
    } catch (error) {
      console.error('获取出价历史失败:', error);
    }
  },

  placeBid: async (auctionId: string, price: number) => {
    const { currentUser } = useUserStore.getState();
    const { generateTransactionId, generateNonce, getAdjustedTime, pendingBids } = get();
    const transactionId = generateTransactionId(auctionId);
    const nonce = generateNonce();

    if (!currentUser) {
      return false;
    }

    const auction = get().auctions.find((a) => a.id === auctionId) || get().currentAuction;
    if (!auction || price <= auction.currentPrice) {
      return false;
    }

    const tempBidId = `temp_${transactionId}`;
    const optimisticBid: BidRecord = {
      id: tempBidId,
      auctionId,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      price,
      timestamp: getAdjustedTime(),
      transactionId,
      sequence: -1,
    };

    set((state) => {
      const newPendingBids = new Map(state.pendingBids);
      newPendingBids.set(transactionId, { price, timestamp: Date.now() });

      return {
        pendingBids: newPendingBids,
        auctions: state.auctions.map((a) =>
          a.id === auctionId ? { ...a, currentPrice: price, bidCount: a.bidCount + 1 } : a
        ),
        currentAuction:
          state.currentAuction?.id === auctionId
            ? { ...state.currentAuction, currentPrice: price, bidCount: state.currentAuction.bidCount + 1 }
            : state.currentAuction,
        bidHistory: [...state.bidHistory, optimisticBid],
      };
    });

    try {
      const clientSendTime = Date.now();
      const res = await fetch(`${API_BASE}/auction/${auctionId}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price,
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          transactionId,
          nonce,
        }),
      });

      const data: PlaceBidResponse = await res.json();
      const clientReceiveTime = Date.now();
      const measuredLatency = data.latency ?? (clientReceiveTime - clientSendTime) / 2;

      if (data.serverTimestamp) {
        const newOffset = data.serverTimestamp - clientReceiveTime - measuredLatency;
        set((state) => ({
          serverTimeOffset: newOffset,
          latency: measuredLatency,
          lastSyncTime: Date.now(),
        }));
      }

      if (data.success && data.data) {
        set((state) => {
          const newProcessedBidIds = new Set(state.processedBidIds);
          newProcessedBidIds.add(data.data!.bidId);
          
          const newProcessedTxIds = new Set(state.processedTransactionIds);
          newProcessedTxIds.add(transactionId);
          
          const newLastSequences = new Map(state.lastSequences);
          newLastSequences.set(auctionId, data.data!.sequence);
          
          const newPendingBids = new Map(state.pendingBids);
          newPendingBids.delete(transactionId);

          const updatedBidHistory = state.bidHistory.map((b) =>
            b.id === tempBidId
              ? {
                  ...b,
                  id: data.data!.bidId,
                  sequence: data.data!.sequence,
                  timestamp: data.data!.timestamp,
                }
              : b
          );

          const processedTxSet = new Set(state.processedTransactionIds);
          processedTxSet.add(transactionId);

          return {
            processedBidIds: newProcessedBidIds,
            processedTransactionIds: newProcessedTxIds,
            lastSequences: newLastSequences,
            pendingBids: newPendingBids,
            bidHistory: updatedBidHistory,
          };
        });

        return true;
      } else {
        set((state) => {
          const newPendingBids = new Map(state.pendingBids);
          newPendingBids.delete(transactionId);

          const originalAuction = state.auctions.find((a) => a.id === auctionId);
          const originalPrice = originalAuction?.currentPrice || 0;
          const originalBidCount = originalAuction?.bidCount || 0;

          return {
            pendingBids: newPendingBids,
            auctions: state.auctions.map((a) =>
              a.id === auctionId
                ? { ...a, currentPrice: originalPrice, bidCount: originalBidCount }
                : a
            ),
            currentAuction:
              state.currentAuction?.id === auctionId
                ? {
                    ...state.currentAuction,
                    currentPrice: originalPrice,
                    bidCount: originalBidCount,
                  }
                : state.currentAuction,
            bidHistory: state.bidHistory.filter((b) => b.id !== tempBidId),
          };
        });

        return false;
      }
    } catch (error) {
      set((state) => {
        const newPendingBids = new Map(state.pendingBids);
        newPendingBids.delete(transactionId);

        const originalAuction = state.auctions.find((a) => a.id === auctionId);
        const originalPrice = originalAuction?.currentPrice || 0;
        const originalBidCount = originalAuction?.bidCount || 0;

        return {
          pendingBids: newPendingBids,
          auctions: state.auctions.map((a) =>
            a.id === auctionId
              ? { ...a, currentPrice: originalPrice, bidCount: originalBidCount }
              : a
          ),
          currentAuction:
            state.currentAuction?.id === auctionId
              ? {
                  ...state.currentAuction,
                  currentPrice: originalPrice,
                  bidCount: originalBidCount,
                }
              : state.currentAuction,
          bidHistory: state.bidHistory.filter((b) => b.id !== tempBidId),
        };
      });

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
      const clientSendTime = Date.now();
      const res = await fetch(`${API_BASE}/time`);
      const data = await res.json();
      const clientReceiveTime = Date.now();

      if (data.success) {
        const measuredLatency = (clientReceiveTime - clientSendTime) / 2;
        const serverTime = data.data.timestamp;
        const newOffset = serverTime - clientReceiveTime - measuredLatency;

        set({
          serverTimeOffset: newOffset,
          latency: measuredLatency,
          lastSyncTime: Date.now(),
        });

        return newOffset;
      }
    } catch (error) {
      console.error('时间同步失败:', error);
    }
    return get().serverTimeOffset;
  },

  handleNewBidEvent: (data: NewBidEventData) => {
    const { processedBidIds, processedTransactionIds, lastSequences } = get();

    if (processedBidIds.has(data.bidId)) {
      return false;
    }

    if (processedTransactionIds.has(data.transactionId)) {
      return false;
    }

    const lastSequence = lastSequences.get(data.auctionId) || 0;
    if (data.sequence <= lastSequence) {
      return false;
    }

    const newProcessedBidIds = new Set(processedBidIds);
    newProcessedBidIds.add(data.bidId);

    const newProcessedTxIds = new Set(processedTransactionIds);
    newProcessedTxIds.add(data.transactionId);

    const newLastSequences = new Map(lastSequences);
    newLastSequences.set(data.auctionId, data.sequence);

    const newBidRecord: BidRecord = {
      id: data.bidId,
      auctionId: data.auctionId,
      userId: data.userId,
      userName: data.userName,
      userAvatar: data.userAvatar,
      price: data.price,
      timestamp: data.timestamp,
      transactionId: data.transactionId,
      sequence: data.sequence,
    };

    set((state) => {
      const hasTempBid = state.bidHistory.some(
        (b) => b.transactionId === data.transactionId && b.id.startsWith('temp_')
      );

      let updatedBidHistory;
      if (hasTempBid) {
        updatedBidHistory = state.bidHistory.map((b) =>
          b.transactionId === data.transactionId ? newBidRecord : b
        );
      } else {
        updatedBidHistory = [...state.bidHistory, newBidRecord];
      }

      return {
        auctions: state.auctions.map((a) =>
          a.id === data.auctionId
            ? { ...a, currentPrice: data.price, bidCount: a.bidCount + 1, lastBidSequence: data.sequence }
            : a
        ),
        currentAuction:
          state.currentAuction?.id === data.auctionId
            ? {
                ...state.currentAuction,
                currentPrice: data.price,
                bidCount: state.currentAuction.bidCount + 1,
                lastBidSequence: data.sequence,
              }
            : state.currentAuction,
        bidHistory: updatedBidHistory,
        processedBidIds: newProcessedBidIds,
        processedTransactionIds: newProcessedTxIds,
        lastSequences: newLastSequences,
      };
    });

    return true;
  },

  handleAuctionEndEvent: (data: AuctionEndEventData) => {
    const { lastSequences } = get();
    const lastSequence = lastSequences.get(data.auctionId) || 0;

    if (data.lastSequence < lastSequence) {
      return;
    }

    set((state) => ({
      auctions: state.auctions.map((a) =>
        a.id === data.auctionId ? { ...a, endTime: Date.now() - 1000 } : a
      ),
      lastSequences: new Map(state.lastSequences).set(data.auctionId, data.lastSequence),
    }));
  },

  handleTimeSyncEvent: (serverTimestamp: number) => {
    const now = Date.now();
    const newOffset = serverTimestamp - now;
    
    set((state) => {
      const smoothedOffset = state.serverTimeOffset * 0.7 + newOffset * 0.3;
      return {
        serverTimeOffset: smoothedOffset,
        lastSyncTime: now,
      };
    });
  },

  setCurrentAuction: (auction: AuctionItem | null) => {
    set({ currentAuction: auction });
  },

  getAdjustedTime: (): number => {
    return Date.now() + get().serverTimeOffset;
  },

  generateTransactionId,
  generateNonce,

  isBidProcessed: (bidId: string) => {
    return get().processedBidIds.has(bidId);
  },

  clearProcessedIds: () => {
    set({
      processedBidIds: new Set(),
      processedTransactionIds: new Set(),
    });
  },
}));

import { useUserStore } from '../user/store';
