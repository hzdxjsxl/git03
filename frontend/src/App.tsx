import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RecommendationResult, UserProfile, DwellTimeRecord } from './types';
import { apiClient, getUserId } from './utils/api';
import { reranker } from './utils/reranker';
import { useScrollBehavior } from './hooks/useScrollBehavior';
import { WaterfallLayout } from './components/WaterfallLayout';
import { Header } from './components/Header';
import { LoadingSpinner, LoadMoreIndicator, EndOfFeed } from './components/LoadingSpinner';

const App: React.FC = () => {
  const [allResults, setAllResults] = useState<RecommendationResult[]>([]);
  const [displayResults, setDisplayResults] = useState<RecommendationResult[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isReranked, setIsReranked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialLoadDone = useRef(false);

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
    async (pageNum: number, append: boolean = true) => {
      try {
        if (pageNum === 0) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const response = await apiClient.getRecommendations(20, pageNum);

        const newResults = response.results;

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

        setHasMore(response.hasMore);
        setPage(pageNum + 1);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : '加载推荐失败，请稍后重试'
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  const loadUserProfile = useCallback(async () => {
    try {
      const profile = await apiClient.getUserProfile();
      setUserProfile(profile);
    } catch (err) {
      console.error('Failed to load user profile:', err);
    }
  }, []);

  const handleRerank = useCallback(() => {
    if (allResults.length === 0) return;

    const reranked = reranker.rerank(allResults, scrollBehavior);
    setDisplayResults(reranked);
    setIsReranked(true);

    loadUserProfile();
  }, [allResults, scrollBehavior, loadUserProfile]);

  const handleResetProfile = useCallback(async () => {
    localStorage.removeItem('recommender_user_id');
    getUserId();
    reranker.reset();
    resetDwellTimeRecords();
    setAllResults([]);
    setDisplayResults([]);
    setIsReranked(false);
    setPage(0);
    setHasMore(true);
    initialLoadDone.current = false;
    await Promise.all([loadRecommendations(0, false), loadUserProfile()]);
  }, [loadRecommendations, loadUserProfile, resetDwellTimeRecords]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      loadRecommendations(page, true);
    }
  }, [loadingMore, hasMore, loading, page, loadRecommendations]);

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      Promise.all([loadRecommendations(0, false), loadUserProfile()]);
    }
  }, [loadRecommendations, loadUserProfile]);

  useEffect(() => {
    if (isReranked && allResults.length > 0) {
      const reranked = reranker.rerank(allResults, scrollBehavior);
      setDisplayResults(reranked);
    }
  }, [scrollBehavior.avgSpeed, isReranked, allResults]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScrollEnd = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const threshold = 200;

      if (scrollTop + clientHeight >= scrollHeight - threshold) {
        handleLoadMore();
      }
    };

    container.addEventListener('scroll', handleScrollEnd, { passive: true });
    return () => container.removeEventListener('scroll', handleScrollEnd);
  }, [scrollContainerRef, handleLoadMore]);

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
