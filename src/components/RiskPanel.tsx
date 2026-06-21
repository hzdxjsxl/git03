import { AlertTriangle, AlertCircle, Shield, Info, ChevronRight, Filter } from 'lucide-react';
import type { RiskMatch, AnalysisStats, RiskLevel } from '../types';
import { cn } from '../lib/utils';

interface RiskPanelProps {
  matches: RiskMatch[];
  stats: AnalysisStats;
  filterLevel: RiskLevel | 'all';
  onFilterChange: (level: RiskLevel | 'all') => void;
  onMatchClick: (match: RiskMatch) => void;
}

const levelConfig: Record<RiskLevel, { icon: typeof AlertTriangle; color: string; bgColor: string; label: string }> = {
  high: { icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-500/20', label: '高风险' },
  medium: { icon: AlertCircle, color: 'text-orange-400', bgColor: 'bg-orange-500/20', label: '中风险' },
  low: { icon: Shield, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', label: '低风险' },
  info: { icon: Info, color: 'text-green-400', bgColor: 'bg-green-500/20', label: '提示' },
};

const filterOptions: Array<{ value: RiskLevel | 'all'; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'high', label: '高风险' },
  { value: 'medium', label: '中风险' },
  { value: 'low', label: '低风险' },
  { value: 'info', label: '提示' },
];

export default function RiskPanel({
  matches,
  stats,
  filterLevel,
  onFilterChange,
  onMatchClick,
}: RiskPanelProps) {
  const filteredMatches = filterLevel === 'all'
    ? matches
    : matches.filter((m) => m.rule.level === filterLevel);

  const sortedMatches = [...filteredMatches].sort((a, b) => {
    const levelOrder: RiskLevel[] = ['high', 'medium', 'low', 'info'];
    return levelOrder.indexOf(a.rule.level) - levelOrder.indexOf(b.rule.level);
  });

  return (
    <div className="h-full flex flex-col bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">风险统计</h3>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(levelConfig) as RiskLevel[]).map((level) => {
            const config = levelConfig[level];
            const Icon = config.icon;
            const count = stats.riskCounts[level] || 0;
            return (
              <div
                key={level}
                className={cn('p-3 rounded-lg flex items-center gap-3', config.bgColor)}
              >
                <Icon className={cn('w-5 h-5', config.color)} />
                <div>
                  <p className={cn('text-xs', config.color)}>{config.label}</p>
                  <p className={cn('text-xl font-bold', config.color)}>{count}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">总计匹配</span>
            <span className="text-white font-semibold">{stats.totalMatches} 项</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-1">
            <span className="text-slate-400">合同分段</span>
            <span className="text-white font-semibold">{stats.totalSegments} 段</span>
          </div>
          {stats.processingTime !== undefined && (
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-slate-400">处理时间</span>
              <span className="text-slate-300 font-mono">{stats.processingTime.toFixed(2)}ms</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">筛选</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onFilterChange(option.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200',
                filterLevel === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-300">风险列表</h3>
          <span className="text-xs text-slate-500">{sortedMatches.length} 项</span>
        </div>
        <div className="space-y-2">
          {sortedMatches.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无匹配的风险项</p>
            </div>
          ) : (
            sortedMatches.map((match, index) => {
              const config = levelConfig[match.rule.level];
              const Icon = config.icon;
              return (
                <button
                  key={`${match.ruleId}-${match.startIndex}-${index}`}
                  onClick={() => onMatchClick(match)}
                  className={cn(
                    'w-full p-3 rounded-lg border border-slate-600 bg-slate-700/50 hover:bg-slate-700 transition-all duration-200 text-left group'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('p-2 rounded-lg flex-shrink-0', config.bgColor)}>
                      <Icon className={cn('w-4 h-4', config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-medium text-white truncate">
                          {match.rule.name}
                        </h4>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors flex-shrink-0" />
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {match.rule.description}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 font-mono truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        "{match.matchedText}"
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
