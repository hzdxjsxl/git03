import { memo } from 'react';
import { X, Plus } from 'lucide-react';
import type { Feature } from '../../shared/types';
import { cn } from '../lib/utils';

interface FeatureTagCloudProps {
  features: Feature[];
  onWeightChange?: (word: string, weight: number) => void;
  onRemove?: (word: string) => void;
  maxDisplay?: number;
  className?: string;
}

export const FeatureTagCloud = memo(function FeatureTagCloud({
  features,
  onWeightChange,
  onRemove,
  maxDisplay = 20,
  className,
}: FeatureTagCloudProps) {
  const displayFeatures = features.slice(0, maxDisplay);
  
  if (displayFeatures.length === 0) {
    return (
      <div className={cn('text-center py-8 text-zinc-500', className)}>
        <p className="text-sm">暂无兴趣标签</p>
        <p className="text-xs mt-1">阅读文章后将自动生成</p>
      </div>
    );
  }

  const maxWeight = Math.max(...displayFeatures.map(f => f.weight), 1);

  const getTagSize = (weight: number) => {
    const normalized = weight / maxWeight;
    if (normalized < 0.25) return 'text-xs';
    if (normalized < 0.5) return 'text-sm';
    if (normalized < 0.75) return 'text-base';
    return 'text-lg';
  };

  const getTagColor = (weight: number) => {
    const normalized = weight / maxWeight;
    if (normalized < 0.33) return 'bg-zinc-700/50 text-zinc-300 border-zinc-600';
    if (normalized < 0.66) return 'bg-blue-900/30 text-blue-300 border-blue-700';
    return 'bg-blue-800/50 text-blue-200 border-blue-600';
  };

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {displayFeatures.map((feature) => (
        <div
          key={feature.word}
          className={cn(
            'group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-200 hover:scale-105 cursor-default',
            getTagColor(feature.weight),
            getTagSize(feature.weight)
          )}
        >
          <span className="font-medium">{feature.word}</span>
          <span className="text-xs opacity-60">
            {feature.weight.toFixed(1)}
          </span>
          
          {onWeightChange && (
            <div className="hidden group-hover:flex items-center gap-1 ml-1 border-l border-current/30 pl-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onWeightChange(feature.word, Math.max(0, feature.weight - 1));
                }}
                className="hover:text-red-400 transition-colors"
                title="减少权重"
              >
                <span className="text-xs">-</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onWeightChange(feature.word, feature.weight + 1);
                }}
                className="hover:text-green-400 transition-colors"
                title="增加权重"
              >
                <Plus size={12} />
              </button>
            </div>
          )}
          
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(feature.word);
              }}
              className="hidden group-hover:flex items-center justify-center ml-1 p-0.5 hover:bg-red-500/20 rounded-full transition-colors"
              title="移除标签"
            >
              <X size={12} className="text-red-400" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
});
