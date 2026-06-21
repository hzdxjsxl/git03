import { X, AlertTriangle, Info, Shield, AlertCircle, Lightbulb, BookOpen } from 'lucide-react';
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
      className="fixed z-50 w-96 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
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
      <div className="p-4 space-y-4">
        <div>
          <h4 className="text-white font-semibold text-sm mb-1">{match.rule.name}</h4>
          <p className="text-slate-400 text-xs leading-relaxed">{match.rule.description}</p>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-3">
          <p className="text-slate-500 text-xs mb-1">匹配内容</p>
          <p className="text-slate-200 text-sm font-mono break-words" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            "{match.matchedText}"
          </p>
        </div>
        {match.rule.suggestion && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="w-3.5 h-3.5 text-blue-400" />
              <p className="text-blue-400 text-xs font-semibold">处置建议</p>
            </div>
            <p className="text-blue-200 text-xs leading-relaxed">{match.rule.suggestion}</p>
          </div>
        )}
        {match.rule.regulation && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
              <p className="text-purple-400 text-xs font-semibold">法规依据</p>
            </div>
            <p className="text-purple-200 text-xs leading-relaxed">{match.rule.regulation}</p>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-700">
          {match.rule.category && (
            <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded-full">
              {match.rule.category}
            </span>
          )}
          {match.rule.severity !== undefined && (
            <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded-full">
              严重度 {match.rule.severity}/10
            </span>
          )}
          <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs rounded-full font-mono">
            规则: {match.rule.id}
          </span>
        </div>
      </div>
    </div>
  );
}
