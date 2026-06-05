import { useEffect, useRef, useCallback } from 'react';
import type { ArticleMeta, ReadRecord } from '../../shared/types';
import { useFeedStore } from '../store/useFeedStore';

export const useReadingTracker = (article: ArticleMeta | null) => {
  const startTimeRef = useRef<number>(0);
  const maxScrollRef = useRef<number>(0);
  const recordRead = useFeedStore(state => state.recordRead);
  const hasRecordedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!article) return;
    
    startTimeRef.current = Date.now();
    maxScrollRef.current = 0;
    hasRecordedRef.current = false;

    return () => {
      if (!hasRecordedRef.current) {
        const readTime = Date.now() - startTimeRef.current;
        const record: ReadRecord = {
          articleId: article.id,
          readTime,
          scrollDepth: maxScrollRef.current,
          timestamp: Date.now(),
        };
        recordRead(article, record);
        hasRecordedRef.current = true;
      }
    };
  }, [article, recordRead]);

  const handleScroll = useCallback((scrollTop: number, scrollHeight: number, clientHeight: number) => {
    if (scrollHeight === 0) return;
    
    const depth = Math.min((scrollTop + clientHeight) / scrollHeight * 100, 100);
    maxScrollRef.current = Math.max(maxScrollRef.current, depth);
  }, []);

  const forceRecord = useCallback(() => {
    if (!article || hasRecordedRef.current) return;
    
    const readTime = Date.now() - startTimeRef.current;
    const record: ReadRecord = {
      articleId: article.id,
      readTime,
      scrollDepth: maxScrollRef.current,
      timestamp: Date.now(),
    };
    recordRead(article, record);
    hasRecordedRef.current = true;
  }, [article, recordRead]);

  return {
    handleScroll,
    forceRecord,
    currentReadTime: article ? Date.now() - startTimeRef.current : 0,
    currentScrollDepth: maxScrollRef.current,
  };
};
