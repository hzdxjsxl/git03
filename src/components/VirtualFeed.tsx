import { useRef, useCallback, useEffect, memo, useState } from 'react';
import { VariableSizeGrid as Grid } from 'react-window';
import type { GridOnScrollProps } from 'react-window';
import type { ArticleMeta } from '../../shared/types';
import { ArticleCard } from './ArticleCard';
import { cn } from '../lib/utils';

interface VirtualFeedProps {
  articles: ArticleMeta[];
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
  className?: string;
}

const CARD_WIDTH = 320;
const CARD_HEIGHT = 380;
const GAP = 24;

export const VirtualFeed = memo(function VirtualFeed({
  articles,
  onLoadMore,
  hasMore,
  loading,
  className,
}: VirtualFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<Grid>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: window.innerHeight - 100,
        });
        gridRef.current?.resetAfterIndices({ columnIndex: 0, rowIndex: 0 });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const { width, height } = dimensions;
  const columnCount = Math.max(1, Math.floor((width + GAP) / (CARD_WIDTH + GAP)));
  const rowCount = Math.ceil(articles.length / columnCount);

  const getItemKey = useCallback(
    ({ columnIndex, rowIndex }: { columnIndex: number; rowIndex: number }) => {
      const index = rowIndex * columnCount + columnIndex;
      return articles[index]?.id || `empty-${rowIndex}-${columnIndex}`;
    },
    [articles, columnCount]
  );

  const Cell = useCallback(
    ({ columnIndex, rowIndex, style }: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => {
      const index = rowIndex * columnCount + columnIndex;
      const article = articles[index];

      if (!article) return null;

      const adjustedStyle = {
        ...style,
        left: Number(style.left) + GAP,
        top: Number(style.top) + GAP,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
      };

      return <ArticleCard article={article} style={adjustedStyle} />;
    },
    [articles, columnCount]
  );

  const handleScroll = useCallback(
    (props: GridOnScrollProps) => {
      const { scrollTop, scrollHeight } = props as unknown as { scrollTop: number; scrollHeight: number };
      if (scrollTop + height >= scrollHeight - 500 && hasMore && !loading) {
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore, height]
  );

  const getColumnWidth = useCallback(() => CARD_WIDTH + GAP, []);
  const getRowHeight = useCallback(() => CARD_HEIGHT + GAP, []);

  if (width === 0) {
    return <div ref={containerRef} className={cn('min-h-[600px]', className)} />;
  }

  return (
    <div ref={containerRef} className={cn('w-full overflow-hidden', className)}>
      <Grid
        ref={gridRef}
        columnCount={columnCount}
        rowCount={rowCount}
        columnWidth={getColumnWidth}
        rowHeight={getRowHeight}
        width={width}
        height={height}
        itemKey={getItemKey}
        onScroll={handleScroll}
        style={{ overflowX: 'hidden' }}
      >
        {Cell}
      </Grid>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!hasMore && articles.length > 0 && (
        <div className="text-center py-8 text-zinc-500 text-sm">
          All content loaded
        </div>
      )}
    </div>
  );
});
