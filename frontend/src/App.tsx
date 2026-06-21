import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RecommendationResult, UserProfile, DwellTimeRecord } from './types';
import { apiClient, getUserId } from './utils/api';
import { reranker } from './utils/reranker';
import { useScrollBehavior } from './hooks/useScrollBehavior';
import { WaterfallLayout } from './components/WaterfallLayout';
import { Header } from './components/Header';
import { LoadingSpinner, LoadMoreIndicator, EndOfFeed } from './components/LoadingSpinner';

const PAGE_SIZE = 20;

const App: React.FC = () => {
  const [allResults, setAllResults] = useState<RecommendationResult[]>([]);
  const [displayResults, setDisplayResults] = useState<RecommendationResult[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isReranked, setIsReranked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentCategory, setCurrentCategory] = useState<string | undefined>(undefined);
  const initialLoadDone = useRef(false);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const {
    scrollBehavior,
    visibleProducts,
    scrollContainerRef,
    registerProductElement,
    getDwellTimeRecords,
    resetDwellTimeRecords,
  } = useScrollBehavior({
    onDwellTime: handleDwellTime,
  });

  function handleDwellTime(records: DwellTimeRecord[]) {
    reranker.updateDwellTime(records);

    records.forEach((record) => {
      const product = allResults.find(
        (r) => r.product.id === record.productId
      );
      if (product && record.duration > 1000) {
        reranker.updateCategoryView(product.product.category);
      }
    });
  }

  const loadRecommendations = useCallback(
    async (offset: number, append: boolean = true, category?: string) => {
      if (loadingRef.current) return;
      loadingRef.current = true;

      try {
        if (offset === 0) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const response = await apiClient.getRecommendations(PAGE_SIZE, offset, category);
        const newResults = response.results;

        setTotalCount(response.totalCount);
        setHasMore(response.hasMore);
        setCurrentOffset(response.nextOffset ?? offset + PAGE_SIZE);

        if (append) {
          setAllResults((prev) => {
            const existingIds = new Set(prev.map((r) => r.product.id));
            const uniqueNew = newResults.filter(
              (r) => !existingIds.has(r.product.id)
            );
            return [...prev, ...uniqueNew];
          });
          setDisplayResults((prev) => {
            const existingIds = new Set(prev.map((r) => r.product.id));
            const uniqueNew = newResults.filter(
              (r) => !existingIds.has(r.product.id)
            );
            return [...prev, ...uniqueNew];
          });
        } else {
          setAllResults(newResults);
          setDisplayResults(newResults);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : '加载推荐失败，请稍后重试'
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
        loadingRef.current = false;
      }
    },
    []
  );

  const loadCategories = useCallback(async () => {
    try {
      const cats = await apiClient.getCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  const loadUserProfile = useCallback(async () => {
    try {
      const profile = await apiClient.getUserProfile();
      setUserProfile(profile);
    } catch (err) {
      console.error('Failed to load user profile:', err);
    }
  }, []);

  const handleRerank = useCallback(async () => {
    if (allResults.length === 0) return;

    try {
      const response = await apiClient.getRecommendations(PAGE_SIZE, 0, currentCategory, true);
      const reranked = reranker.rerank(response.results, scrollBehavior);
      setAllResults(response.results);
      setDisplayResults(reranked);
      setHasMore(response.hasMore);
      setCurrentOffset(response.nextOffset ?? PAGE_SIZE);
      setTotalCount(response.totalCount);
      setIsReranked(true);
    } catch (err) {
      console.error('Rerank failed:', err);
      const reranked = reranker.rerank(allResults, scrollBehavior);
      setDisplayResults(reranked);
      setIsReranked(true);
    }

    loadUserProfile();
  }, [allResults, scrollBehavior, loadUserProfile, currentCategory]);

  const handleResetProfile = useCallback(async () => {
    localStorage.removeItem('recommender_user_id');
    getUserId();
    reranker.reset();
    resetDwellTimeRecords();
    setAllResults([]);
    setDisplayResults([]);
    setIsReranked(false);
    setCurrentOffset(0);
    setHasMore(true);
    setTotalCount(0);
    setCurrentCategory(undefined);
    initialLoadDone.current = false;
    await Promise.all([loadRecommendations(0, false, undefined), loadUserProfile()]);
  }, [loadRecommendations, loadUserProfile, resetDwellTimeRecords]);

  const handleCategoryChange = useCallback(async (category: string | undefined) => {
    if (category === currentCategory) return;
    setCurrentCategory(category);
    setIsReranked(false);
    setAllResults([]);
    setDisplayResults([]);
    setCurrentOffset(0);
    setHasMore(true);
    setTotalCount(0);
    await loadRecommendations(0, false, category);
  }, [currentCategory, loadRecommendations]);

  const handleLoadMore = useCallback(() => {
    if (!loadingRef.current && hasMore) {
      loadRecommendations(currentOffset, true, currentCategory);
    }
  }, [hasMore, currentOffset, currentCategory, loadRecommendations]);

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      Promise.all([loadRecommendations(0, false, undefined), loadUserProfile(), loadCategories()]);
    }
  }, [loadRecommendations, loadUserProfile, loadCategories]);

  useEffect(() => {
    if (isReranked && allResults.length > 0) {
      const reranked = reranker.rerank(allResults, scrollBehavior);
      setDisplayResults(reranked);
    }
  }, [scrollBehavior.avgSpeed, isReranked, allResults]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          handleLoadMore();
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '200px',
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleLoadMore, hasMore, scrollContainerRef]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (visibleProducts.length > 0) {
        visibleProducts.forEach((vp) => {
          const product = allResults.find(
            (r) => r.product.id === vp.productId
          );
          if (product) {
            reranker.updateCategoryView(product.product.category);
          }
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [visibleProducts, allResults]);

  if (loading && allResults.length === 0) {
    return (
      <div className="app-container">
        <LoadingSpinner text="正在为您生成个性化推荐..." />
      </div>
    );
  }

  if (error && allResults.length === 0) {
    return (
      <div className="app-container">
        <div className="error-container">
          <span className="error-icon">😕</span>
          <p className="error-text">{error}</p>
          <button
            className="retry-button"
            onClick={() => loadRecommendations(0, false)}
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header
        scrollBehavior={scrollBehavior}
        userProfile={userProfile}
        onResetProfile={handleResetProfile}
        onRerank={handleRerank}
        isReranked={isReranked}
        totalCount={totalCount}
        loadedCount={allResults.length}
        categories={categories}
        currentCategory={currentCategory}
        onCategoryChange={handleCategoryChange}
      />

      <div className="scroll-container" ref={scrollContainerRef}>
        <main className="main-content">
          {displayResults.length > 0 ? (
            <>
              <WaterfallLayout
                items={displayResults}
                registerElement={registerProductElement}
                isReRanked={isReranked}
                columns={2}
              />

              <LoadMoreIndicator visible={loadingMore} />

              {!hasMore && !loadingMore && <EndOfFeed />}

              <div
                ref={sentinelRef}
                style={{ height: 1, width: '100%' }}
              />
            </>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">🛍️</span>
              <p className="empty-text">暂无推荐，开始探索吧</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
