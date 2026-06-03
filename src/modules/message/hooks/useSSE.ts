import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuctionStore } from '../../auction/store';
import { useMessageStore } from '../store';
import type { NewBidEventData, AuctionEndEventData } from '../../../types';

interface UseSSEOptions {
  auctionId?: string;
  enabled?: boolean;
}

interface SSEState {
  isConnected: boolean;
  lastEventId: string | null;
  eventCount: number;
  errorCount: number;
}

export const useSSE = ({ auctionId, enabled = true }: UseSSEOptions = {}) => {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processedEventsRef = useRef<Set<string>>(new Set());
  const lastSequenceRef = useRef<Map<string, number>>(new Map());
  const [state, setState] = useState<SSEState>({
    isConnected: false,
    lastEventId: null,
    eventCount: 0,
    errorCount: 0,
  });

  const handleNewBidEvent = useAuctionStore((state) => state.handleNewBidEvent);
  const handleAuctionEndEvent = useAuctionStore((state) => state.handleAuctionEndEvent);
  const handleTimeSyncEvent = useAuctionStore((state) => state.handleTimeSyncEvent);
  const addToast = useMessageStore((state) => state.addToast);

  const updateState = useCallback((updates: Partial<SSEState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const connect = useCallback(() => {
    if (!enabled) return;
    if (eventSourceRef.current?.readyState === EventSource.OPEN) return;

    const url = auctionId 
      ? `/api/stream?auctionId=${auctionId}`
      : `/api/stream`;
    
    const eventSource = new EventSource(url, {
      withCredentials: false,
    });
    
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      updateState({ isConnected: true });
    };

    eventSource.addEventListener('new_bid', (event: MessageEvent) => {
      try {
        const eventId = event.lastEventId;
        const data: NewBidEventData = JSON.parse(event.data);
        
        if (eventId && processedEventsRef.current.has(eventId)) {
          return;
        }

        const lastSequence = lastSequenceRef.current.get(data.auctionId) || 0;
        if (data.sequence <= lastSequence) {
          return;
        }

        const isNew = handleNewBidEvent(data);
        
        if (isNew) {
          if (eventId) {
            processedEventsRef.current.add(eventId);
          }
          lastSequenceRef.current.set(data.auctionId, data.sequence);
          
          updateState({
            lastEventId: eventId || null,
            eventCount: state.eventCount + 1,
          });

          addToast({
            type: 'info',
            title: `新出价：¥${data.price.toLocaleString()}`,
            message: `${data.userName} 刚刚出价`,
            duration: 3000,
          });
        }
      } catch (error) {
        console.error('解析出价事件失败:', error);
      }
    });
    
    eventSource.addEventListener('auction_end', (event: MessageEvent) => {
      try {
        const eventId = event.lastEventId;
        const data: AuctionEndEventData = JSON.parse(event.data);
        
        if (eventId && processedEventsRef.current.has(eventId)) {
          return;
        }

        const lastSequence = lastSequenceRef.current.get(data.auctionId) || 0;
        if (data.lastSequence < lastSequence) {
          return;
        }

        if (eventId) {
          processedEventsRef.current.add(eventId);
        }
        lastSequenceRef.current.set(data.auctionId, data.lastSequence);
        
        handleAuctionEndEvent(data);

        updateState({
          lastEventId: eventId || null,
          eventCount: state.eventCount + 1,
        });
        
        addToast({
          type: 'warning',
          title: '拍卖已结束',
          message: `获胜者：${data.winnerName}，成交价：¥${data.finalPrice.toLocaleString()}`,
          duration: 5000,
        });
      } catch (error) {
        console.error('解析拍卖结束事件失败:', error);
      }
    });

    eventSource.addEventListener('time_sync', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.timestamp) {
          handleTimeSyncEvent(data.timestamp);
        }
      } catch (error) {
        console.error('解析时间同步事件失败:', error);
      }
    });
    
    eventSource.onerror = (error) => {
      console.error('SSE 连接错误:', error);
      
      setState((prev) => ({
        ...prev,
        isConnected: false,
        errorCount: prev.errorCount + 1,
      }));

      eventSource.close();
      eventSourceRef.current = null;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      const reconnectDelay = Math.min(1000 * Math.pow(2, Math.min(state.errorCount, 5)), 30000);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        if (enabled && eventSourceRef.current?.readyState !== EventSource.OPEN) {
          connect();
        }
      }, reconnectDelay);
    };
  }, [auctionId, enabled, handleNewBidEvent, handleAuctionEndEvent, handleTimeSyncEvent, addToast, state.eventCount, state.errorCount, updateState]);
  
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    updateState({ isConnected: false });
  }, [updateState]);

  const reconnect = useCallback(() => {
    disconnect();
    setState((prev) => ({ ...prev, errorCount: 0 }));
    setTimeout(connect, 100);
  }, [connect, disconnect]);
  
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  useEffect(() => {
    return () => {
      processedEventsRef.current.clear();
      lastSequenceRef.current.clear();
    };
  }, []);
  
  return {
    ...state,
    reconnect,
    processedEventCount: processedEventsRef.current.size,
  };
};
