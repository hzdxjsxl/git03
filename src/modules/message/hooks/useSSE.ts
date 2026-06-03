import { useEffect, useRef, useCallback } from 'react';
import { useAuctionStore } from '../../auction/store';
import { useMessageStore } from '../store';
import type { NewBidEventData, AuctionEndEventData } from '../../../types';

interface UseSSEOptions {
  auctionId?: string;
  enabled?: boolean;
}

export const useSSE = ({ auctionId, enabled = true }: UseSSEOptions = {}) => {
  const eventSourceRef = useRef<EventSource | null>(null);
  const handleNewBidEvent = useAuctionStore((state) => state.handleNewBidEvent);
  const handleAuctionEndEvent = useAuctionStore((state) => state.handleAuctionEndEvent);
  const addToast = useMessageStore((state) => state.addToast);
  
  const connect = useCallback(() => {
    if (!enabled) return;
    
    const url = auctionId 
      ? `/api/stream?auctionId=${auctionId}`
      : `/api/stream`;
    
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;
    
    eventSource.addEventListener('new_bid', (event) => {
      try {
        const data: NewBidEventData = JSON.parse(event.data);
        handleNewBidEvent(data);
        
        addToast({
          type: 'info',
          title: `新出价：¥${data.price.toLocaleString()}`,
          message: `${data.userName} 刚刚出价`,
          duration: 3000,
        });
      } catch (error) {
        console.error('解析出价事件失败:', error);
      }
    });
    
    eventSource.addEventListener('auction_end', (event) => {
      try {
        const data: AuctionEndEventData = JSON.parse(event.data);
        handleAuctionEndEvent(data);
        
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
    
    eventSource.onerror = (error) => {
      console.error('SSE 连接错误:', error);
      eventSource.close();
      
      setTimeout(() => {
        if (eventSourceRef.current?.readyState !== EventSource.OPEN) {
          connect();
        }
      }, 3000);
    };
  }, [auctionId, enabled, handleNewBidEvent, handleAuctionEndEvent, addToast]);
  
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);
  
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);
  
  return {
    isConnected: eventSourceRef.current?.readyState === EventSource.OPEN,
    reconnect: connect,
  };
};
