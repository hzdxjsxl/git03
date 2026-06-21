import { useDashboardStore } from '../../stores/dashboardStore';
import type { Granularity, SmoothingAlgorithm } from '../../../shared/types';
import { Clock, Activity, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
  { value: '5min', label: '5分钟' },
  { value: '15min', label: '15分钟' },
  { value: '1hour', label: '1小时' },
  { value: '6hour', label: '6小时' },
  { value: '1day', label: '1天' }
];

const SMOOTHING_OPTIONS: { value: SmoothingAlgorithm; label: string }[] = [
  { value: 'movingAverage', label: '移动平均' },
  { value: 'exponential', label: '指数平滑' },
  { value: 'savitzkyGolay', label: 'SG滤波' }
];

const TIME_RANGE_OPTIONS = [
  { label: '近1小时', hours: 1 },
  { label: '近6小时', hours: 6 },
  { label: '近12小时', hours: 12 },
  { label: '近24小时', hours: 24 },
  { label: '近7天', hours: 24 * 7 }
];

export default function ControlPanel() {
  const {
    granularity,
    smoothingAlgorithm,
    timeRangeHours,
    setGranularity,
    setSmoothingAlgorithm,
    setTimeRangeByHours,
    refreshData,
    isLoading
  } = useDashboardStore();

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-700/50 bg-slate-800/30 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-slate-400" />
        <span className="text-sm text-slate-400">时间范围:</span>
        <div className="flex gap-1">
          {TIME_RANGE_OPTIONS.map(opt => (
            <button
              key={opt.hours}
              onClick={() => setTimeRangeByHours(opt.hours)}
              className={cn(
                'rounded-lg px-3 py-1 text-xs font-medium transition-all',
                'hover:bg-slate-700/50',
                timeRangeHours === opt.hours
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-400'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-6 w-px bg-slate-700" />

      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-slate-400" />
        <span className="text-sm text-slate-400">聚合粒度:</span>
        <div className="flex gap-1">
          {GRANULARITY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setGranularity(opt.value)}
              className={cn(
                'rounded-lg px-3 py-1 text-xs font-medium transition-all',
                'hover:bg-slate-700/50',
                granularity === opt.value
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-400'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-6 w-px bg-slate-700" />

      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400">平滑算法:</span>
        <div className="flex gap-1">
          {SMOOTHING_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSmoothingAlgorithm(opt.value)}
              className={cn(
                'rounded-lg px-3 py-1 text-xs font-medium transition-all',
                'hover:bg-slate-700/50',
                smoothingAlgorithm === opt.value
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'text-slate-400'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ml-auto">
        <button
          onClick={refreshData}
          disabled={isLoading}
          className={cn(
            'flex items-center gap-2 rounded-lg bg-blue-500/20 px-4 py-1.5 text-sm font-medium text-blue-400',
            'transition-all hover:bg-blue-500/30',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          刷新数据
        </button>
      </div>
    </div>
  );
}
