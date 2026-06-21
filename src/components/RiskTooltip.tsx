import { X, AlertTriangle, Info, Shield, AlertCircle } from 'lucide-react';
import type { RiskMatch, RiskLevel } from '../types';
import { cn } from '../lib/utils';

interface RiskTooltipProps {
  match: RiskMatch;
  position: { x: number; y: number };
  onClose: () => void;
}

const levelConfig: Record<RiskLevel, { icon: typeof AlertTriangle; color: string; bgColor: string; label: string }> = {
  high: { icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-500/20', label: '高风险' },
  medium: { icon: AlertCircle, color: 'text-orange-400', bgColor: 'bg-orange-500/20', label: '中风险' },
  low: { icon: Shield, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', label: '低风险' },
  info: { icon: Info, color: 'text-green-400', bgColor: 'bg-green-500/20', label: '提示' },
};

export default function RiskTooltip({ match, position, onClose }: RiskTooltipProps) {
  const config = levelConfig[match.rule.level];
  const Icon = config.icon;

  return (
    <div
      className="fixed z-50 w-80 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      style={{ left: position.x, top: position.y }}
    >
      <div className={cn('px-4 py-3 flex items-center gap-2 border-b border-slate-700', config.bgColor)}>
        <Icon className={cn('w-5 h-5', config.color)} />
        <span className={cn('font-semibold', config.color)}>{config.label}</span>
        <button
          onClick={onClose}
          className="ml-auto text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h4 className="text-white font-semibold text-sm mb-1">{match.rule.name}</h4>
          <p className="text-slate-400 text-xs">{match.rule.description}</p>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-3">
          <p className="text-slate-500 text-xs mb-1">匹配内容</p>
          <p className="text-slate-200 text-sm font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            "{match.matchedText}"
          </p>
        </div>
        {match.rule.severity !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs">严重程度</span>
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full', config.bgColor)}
                style={{ width: `${(match.rule.severity / 10) * 100}%` }}
              />
            </div>
            <span className={cn('text-xs font-medium', config.color)}>{match.rule.severity}/10</span>
          </div>
        )}
        {match.rule.category && (
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs">分类</span>
            <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded-full">
              {match.rule.category}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
