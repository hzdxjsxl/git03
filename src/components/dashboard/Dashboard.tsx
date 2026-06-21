import { useEffect } from 'react';
import { useDashboardStore, useDataStream } from '../../stores/dashboardStore';
import { Activity, TrendingUp, ThumbsUp, ThumbsDown, Minus, Flame, Hash } from 'lucide-react';
import SentimentTrendChart from '../charts/SentimentTrendChart';
import WordCloudChart from '../charts/WordCloudChart';
import EmotionRadarChart from '../charts/EmotionRadarChart';
import PlatformPieChart from '../charts/PlatformPieChart';
import StatsCard from './StatsCard';
import PostStream from './PostStream';
import ControlPanel from './ControlPanel';

export default function Dashboard() {
  const {
    stats,
    smoothedData,
    posts,
    isLoading,
    error,
    loadInitialData
  } = useDashboardStore();

  const pollStream = useDataStream();

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    const interval = setInterval(() => {
      pollStream();
    }, 3000);

    return () => clearInterval(interval);
  }, [pollStream]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <div className="text-2xl font-bold text-red-400">数据加载失败</div>
          <div className="mt-2 text-slate-400">{error}</div>
          <button
            onClick={loadInitialData}
            className="mt-4 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  const recentPosts = [...posts].sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      
      <div className="relative z-10 mx-auto max-w-[1920px] p-6">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-3xl font-bold text-transparent">
                社交媒体舆情情感分析监控台
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                实时监控突发事件舆情走向 · 前端高性能聚合计算 · 动态数据可视化
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-4 py-2">
                <div className="relative">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/50" />
                </div>
                <span className="text-sm text-emerald-400">实时数据流</span>
              </div>
              <div className="rounded-full border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-400">
                数据总量: <span className="font-mono text-blue-400">{posts.length.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </header>

        <ControlPanel />

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="帖子总数"
            value={stats?.totalPosts || 0}
            trend={stats?.trend || 'stable'}
            icon={<Activity className="h-5 w-5" />}
            color="blue"
          />
          <StatsCard
            title="正面占比"
            value={(stats?.positiveRatio || 0) * 100}
            trend="stable"
            suffix="%"
            decimals={1}
            icon={<ThumbsUp className="h-5 w-5" />}
            color="green"
          />
          <StatsCard
            title="负面占比"
            value={(stats?.negativeRatio || 0) * 100}
            trend="stable"
            suffix="%"
            decimals={1}
            icon={<ThumbsDown className="h-5 w-5" />}
            color="red"
          />
          <StatsCard
            title="情感指数"
            value={stats?.sentimentIndex || 50}
            trend={stats?.trend || 'stable'}
            icon={<TrendingUp className="h-5 w-5" />}
            color="purple"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-5 backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-200">
                  <Activity className="h-5 w-5 text-blue-400" />
                  情感走向趋势
                </h2>
                <div className="text-xs text-slate-500">
                  平滑算法: {useDashboardStore.getState().smoothingAlgorithm}
                </div>
              </div>
              <SentimentTrendChart data={smoothedData} height={380} />
            </div>
          </div>

          <div>
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-5 backdrop-blur-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-200">
                <Hash className="h-5 w-5 text-purple-400" />
                热点词云
              </h2>
              <WordCloudChart keywords={stats?.topKeywords || []} height={380} />
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div>
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-5 backdrop-blur-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-200">
                <Activity className="h-5 w-5 text-cyan-400" />
                情感分布雷达
              </h2>
              <EmotionRadarChart data={stats?.emotionDistribution || null} height={280} />
            </div>
          </div>

          <div>
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-5 backdrop-blur-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-200">
                <Activity className="h-5 w-5 text-amber-400" />
                平台分布
              </h2>
              <PlatformPieChart
                data={(stats?.platformDistribution as any) || {}}
                height={280}
              />
            </div>
          </div>

          <div>
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-5 backdrop-blur-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-200">
                <Flame className="h-5 w-5 text-orange-400" />
                热度指数
              </h2>
              <div className="flex h-[280px] flex-col items-center justify-center">
                <div className="relative">
                  <svg className="h-48 w-48 -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(stats?.heatIndex || 0) * 2.51} 251`}
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold text-orange-400">
                      {stats?.heatIndex || 0}
                    </span>
                    <span className="text-sm text-slate-500">热度指数</span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xs text-slate-500">正面</div>
                    <div className="mt-1 text-lg font-bold text-emerald-400">
                      {((stats?.positiveRatio || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">中性</div>
                    <div className="mt-1 text-lg font-bold text-slate-400">
                      {((stats?.neutralRatio || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">负面</div>
                    <div className="mt-1 text-lg font-bold text-red-400">
                      {((stats?.negativeRatio || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-5 backdrop-blur-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-200">
              <Activity className="h-5 w-5 text-blue-400" />
              实时帖子流
              <span className="ml-2 rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
                每3秒自动更新
              </span>
            </h2>
            <div className="h-[400px]">
              <PostStream posts={recentPosts} maxDisplay={30} />
            </div>
          </div>
        </div>

        <footer className="mt-8 text-center text-sm text-slate-600">
          <p>
            前端高性能计算架构 · 数据聚合在浏览器端完成 · 后端仅提供原始数据服务
          </p>
        </footer>
      </div>

      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="relative mx-auto h-16 w-16">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
            </div>
            <div className="mt-4 text-lg text-slate-300">正在加载海量舆论数据...</div>
            <div className="mt-2 text-sm text-slate-500">前端高性能聚合引擎初始化中</div>
          </div>
        </div>
      )}
    </div>
  );
}
