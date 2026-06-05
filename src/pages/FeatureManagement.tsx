import { useFeedStore } from '../store/useFeedStore';
import { FeatureTagCloud } from '../components/FeatureTagCloud';
import { Sparkles, Trash2, Plus, Info } from 'lucide-react';
import { useState } from 'react';

export default function FeatureManagement() {
  const features = useFeedStore((state) => state.features);
  const setFeatureWeight = useFeedStore((state) => state.setFeatureWeight);
  const resetProfile = useFeedStore((state) => state.resetProfile);
  const addFeature = useFeedStore((state) => state.addFeature);

  const [newFeature, setNewFeature] = useState('');

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      addFeature(newFeature.trim(), 3);
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (word: string) => {
    setFeatureWeight(word, 0);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">特征管理</h1>
        <p className="text-zinc-400">
          管理您的兴趣特征，这些特征将影响新闻推荐结果
        </p>
      </div>

      <div className="bg-zinc-800/30 rounded-xl border border-zinc-700/50 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Plus size={20} className="text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-white">添加自定义特征</h3>
            <p className="text-sm text-zinc-500">手动添加感兴趣的关键词</p>
          </div>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddFeature()}
            placeholder="输入关键词..."
            className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            onClick={handleAddFeature}
            className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            添加
          </button>
        </div>
      </div>

      <div className="bg-zinc-800/30 rounded-xl border border-zinc-700/50 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Sparkles size={20} className="text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">当前兴趣特征</h3>
              <p className="text-sm text-zinc-500">共 {features.length} 个特征</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <Info size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-300">
              <p className="font-medium mb-1">使用说明</p>
              <ul className="list-disc list-inside space-y-1 text-blue-300/80">
                <li>悬停标签可以看到调整权重的按钮</li>
                <li>点击 <span className="text-red-400">X</span> 可以移除特征</li>
                <li>权重越高，相关文章推荐优先级越高</li>
              </ul>
            </div>
          </div>
        </div>

        <FeatureTagCloud
          features={features}
          onWeightChange={setFeatureWeight}
          onRemove={handleRemoveFeature}
          maxDisplay={100}
        />
      </div>

      <div className="bg-red-500/10 rounded-xl border border-red-500/20 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Trash2 size={20} className="text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-white mb-1">重置所有数据</h3>
            <p className="text-sm text-red-300/80 mb-4">
              清除所有阅读记录和兴趣特征，重新开始
            </p>
            <button
              onClick={() => {
                if (confirm('确定要重置所有阅读记录和兴趣特征吗？此操作不可撤销。')) {
                  resetProfile();
                }
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
            >
              重置数据
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
