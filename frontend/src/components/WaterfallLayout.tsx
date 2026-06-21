import React, { useMemo } from 'react';
import { RecommendationResult } from '../types';
import { ProductCard } from './ProductCard';

interface WaterfallLayoutProps {
  items: RecommendationResult[];
  registerElement: (id: string, element: HTMLElement | null) => void;
  isReRanked?: boolean;
  columns?: number;
}

export const WaterfallLayout: React.FC<WaterfallLayoutProps> = ({
  items,
  registerElement,
  isReRanked = false,
  columns = 2,
}) => {
  const columnItems = useMemo(() => {
    const cols: RecommendationResult[][] = Array.from({ length: columns }, () => []);
    const columnHeights = Array(columns).fill(0);

    items.forEach((item) => {
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
      cols[shortestColumn].push(item);
      columnHeights[shortestColumn] += getEstimatedHeight(item);
    });

    return cols;
  }, [items, columns]);

  return (
    <div className="waterfall-container">
      {columnItems.map((column, colIndex) => (
        <div key={colIndex} className="waterfall-column">
          {column.map((item) => (
            <ProductCard
              key={item.product.id}
              result={item}
              registerElement={registerElement}
              isReRanked={isReRanked}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

function getEstimatedHeight(item: RecommendationResult): number {
  const baseHeight = 250;
  const descriptionLines = Math.ceil(item.product.name.length / 15);
  const tagsHeight = Math.ceil(item.product.tags.length / 2) * 24;
  const reasoningHeight = Math.ceil(item.reasoning.length / 2) * 24;
  return baseHeight + descriptionLines * 20 + tagsHeight + reasoningHeight;
}
