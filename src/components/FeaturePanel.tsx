import { useFeedStore } from '../store/useFeedStore';
import { FeatureTagCloud } from './FeatureTagCloud';
import { Sparkles, BookOpen } from 'lucide-react';

export const FeaturePanel = () => {
  const features = useFeedStore(state => state.features);
  const setFeatureWeight = useFeedStore(state => state.setFeatureWeight);
  const readCount = useFeedStore(state => state.readCount);

  const handleWeightChange = (word: string, weight: number) => {
    setFeatureWeight(word, weight);
  };

  return (
    <div className="bg-zinc-800/30 rounded-xl border border-zinc-700/50 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={18} className="text-blue-400" />
        <h3 className="text-lg font-semibold text-white">兴趣特征</h3>
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm text-zinc-400">
        <div className="flex items-center gap-1.5">
          <BookOpen size={14} />
          <span>已读 {readCount} 篇</span>
        </div>
        <div>
          特征 {features.length} 个
        </div>
      </div>

      <FeatureTagCloud
        features={features}
        onWeightChange={handleWeightChange}
        maxDisplay={15}
      />

      {features.length > 0 && (
        <p className="mt-4 text-xs text-zinc-500">
          提示：悬停标签可调整权重，影响推荐结果
        </p>
      )}
    </div>
  );
};
