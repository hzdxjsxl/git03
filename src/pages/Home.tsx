import { useEffect, useRef } from 'react';
import { useFeedStore } from '../store/useFeedStore';
import { VirtualFeed } from '../components/VirtualFeed';
import { CardSkeleton } from '../components/CardSkeleton';
import { FeaturePanel } from '../components/FeaturePanel';
import { AlertTriangle } from 'lucide-react';

export default function Home() {
  const articles = useFeedStore((state) => state.articles);
  const loading = useFeedStore((state) => state.loading);
  const fetching = useFeedStore((state) => state.fetching);
  const hasMore = useFeedStore((state) => state.hasMore);
  const error = useFeedStore((state) => state.error);
  const loadInitialFeed = useFeedStore((state) => state.loadInitialFeed);
  const loadMore = useFeedStore((state) => state.loadMore);
  
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadInitialFeed();
    }
  }, [loadInitialFeed]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle size={48} className="text-red-400 mb-4" />
        <p className="text-zinc-300 mb-4">{error}</p>
        <button
          onClick={() => loadInitialFeed()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      <aside className="hidden lg:block w-72 flex-shrink-0">
        <div className="sticky top-24">
          <FeaturePanel />
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        {loading ? (
          <CardSkeleton count={9} />
        ) : (
          <VirtualFeed
            articles={articles}
            onLoadMore={loadMore}
            hasMore={hasMore}
            loading={fetching}
          />
        )}
      </main>
    </div>
  );
}
