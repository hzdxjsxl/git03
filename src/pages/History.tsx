import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { History, Clock, BookOpen, Trash2 } from 'lucide-react';
import { featureEngine } from '../utils/featureEngine';

export default function HistoryPage() {
  const [readCount, setReadCount] = useState(0);
  const [features, setFeatures] = useState<Array<{ word: string; weight: number }>>([]);

  useEffect(() => {
    setReadCount(featureEngine.getReadCount());
    setFeatures(featureEngine.getTopFeatures(30));
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">阅读历史</h1>
        <p className="text-zinc-400">
          记录您的阅读足迹，系统将基于此为您推荐更感兴趣的内容
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-zinc-800/30 rounded-xl border border-zinc-700/50 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <BookOpen size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{readCount}</p>
              <p className="text-sm text-zinc-500">已读文章</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-800/30 rounded-xl border border-zinc-700/50 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <History size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{features.length}</p>
              <p className="text-sm text-zinc-500">兴趣特征</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-800/30 rounded-xl border border-zinc-700/50 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">-</p>
              <p className="text-sm text-zinc-500">阅读时长</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-800/30 rounded-xl border border-zinc-700/50 p-6 mb-6">
        <h3 className="font-medium text-white mb-4">热门兴趣标签</h3>
        {features.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {features.map((feature) => (
              <span
                key={feature.word}
                className="px-3 py-1.5 bg-zinc-700/50 text-zinc-300 text-sm rounded-full"
              >
                {feature.word}
                <span className="ml-1.5 text-zinc-500 text-xs">
                  {feature.weight.toFixed(1)}
                </span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm">
            暂无阅读记录，开始阅读文章后将自动生成兴趣标签
          </p>
        )}
      </div>

      <div className="bg-zinc-800/30 rounded-xl border border-zinc-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-white">关于阅读记录</h3>
        </div>
        <div className="text-sm text-zinc-400 space-y-3">
          <p>
            <strong className="text-zinc-300">隐私保护：</strong>
            所有阅读记录和兴趣特征仅保存在您的浏览器本地，不会上传到任何服务器。
          </p>
          <p>
            <strong className="text-zinc-300">推荐机制：</strong>
            系统会根据您阅读的文章自动提取关键词，计算兴趣权重，为您推荐相关内容。
          </p>
          <p>
            <strong className="text-zinc-300">权重衰减：</strong>
            兴趣特征会随时间自动衰减，确保推荐内容跟随您的最新兴趣变化。
          </p>
        </div>
      </div>
    </div>
  );
}
