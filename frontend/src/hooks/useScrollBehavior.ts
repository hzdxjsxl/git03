import { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollBehavior, VisibleProduct, DwellTimeRecord } from '../types';

interface UseScrollBehaviorOptions {
  onDwellTime?: (records: DwellTimeRecord[]) => void;
  onVisibilityChange?: (visible: VisibleProduct[]) => void;
  speedHistorySize?: number;
}

export const useScrollBehavior = (options: UseScrollBehaviorOptions = {}) => {
  const [scrollBehavior, setScrollBehavior] = useState<ScrollBehavior>({
    scrollSpeed: 0,
    avgSpeed: 0,
    direction: 'none',
    lastScrollTop: 0,
    lastScrollTime: Date.now(),
    speedHistory: [],
  });

  const [visibleProducts, setVisibleProducts] = useState<VisibleProduct[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const productElementsRef = useRef<Map<string, HTMLElement>>(new Map());
  const lastScrollStateRef = useRef({
    scrollTop: 0,
    timestamp: Date.now(),
  });
  const visibilityCheckIntervalRef = useRef<number | null>(null);
  const dwellTimeRecordsRef = useRef<DwellTimeRecord[]>([]);

  const checkVisibility = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const visible: VisibleProduct[] = [];
    const newRecords: DwellTimeRecord[] = [];
    const now = Date.now();

    productElementsRef.current.forEach((element, productId) => {
      const rect = element.getBoundingClientRect();
      const visibleTop = Math.max(rect.top, containerRect.top);
      const visibleBottom = Math.min(rect.bottom, containerRect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const visibleRatio = rect.height > 0 ? visibleHeight / rect.height : 0;

      if (visibleRatio > 0.3) {
        visible.push({ productId, enterTime: now, visibleRatio });

        const existingVisible = visibleProducts.find(v => v.productId === productId);
        if (existingVisible) {
          const duration = now - existingVisible.enterTime;
          if (duration > 100) {
            newRecords.push({ productId, duration, timestamp: now });
          }
        }
      }
    });

    setVisibleProducts(visible);

    if (newRecords.length > 0) {
      dwellTimeRecordsRef.current.push(...newRecords);
      options.onDwellTime?.(newRecords);
    }

    options.onVisibilityChange?.(visible);
  }, [visibleProducts, options]);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const now = Date.now();
    const currentScrollTop = container.scrollTop;
    const lastState = lastScrollStateRef.current;
    const deltaTime = now - lastState.timestamp;
    const deltaScroll = currentScrollTop - lastState.scrollTop;

    if (deltaTime > 0) {
      const speed = Math.abs(deltaScroll / deltaTime) * 1000;
      const direction = deltaScroll > 1 ? 'down' : deltaScroll < -1 ? 'up' : 'none';

      setScrollBehavior((prev) => {
        const speedHistory = [...prev.speedHistory, speed].slice(-10);
        const avgSpeed =
          speedHistory.reduce((a, b) => a + b, 0) / speedHistory.length;

        return {
          scrollSpeed: speed,
          avgSpeed,
          direction,
          lastScrollTop: currentScrollTop,
          lastScrollTime: now,
          speedHistory,
        };
      });
    }

    lastScrollStateRef.current = {
      scrollTop: currentScrollTop,
      timestamp: now,
    };
  }, []);

  const registerProductElement = useCallback((productId: string, element: HTMLElement | null) => {
    if (element) {
      productElementsRef.current.set(productId, element);
    } else {
      productElementsRef.current.delete(productId);
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });

    visibilityCheckIntervalRef.current = window.setInterval(checkVisibility, 500);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (visibilityCheckIntervalRef.current) {
        clearInterval(visibilityCheckIntervalRef.current);
      }
    };
  }, [handleScroll, checkVisibility]);

  const getDwellTimeRecords = useCallback(() => {
    return [...dwellTimeRecordsRef.current];
  }, []);

  const resetDwellTimeRecords = useCallback(() => {
    dwellTimeRecordsRef.current = [];
  }, []);

  return {
    scrollBehavior,
    visibleProducts,
    scrollContainerRef,
    registerProductElement,
    getDwellTimeRecords,
    resetDwellTimeRecords,
  };
};
