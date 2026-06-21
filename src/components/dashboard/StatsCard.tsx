import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';
import AnimatedNumber from '../common/AnimatedNumber';

interface StatsCardProps {
  title: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  suffix?: string;
  prefix?: string;
  decimals?: number;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  icon?: React.ReactNode;
}

const colorClasses = {
  blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
  green: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
  red: 'from-red-500/20 to-red-500/5 border-red-500/30',
  yellow: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
  purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30'
};

const textColorClasses = {
  blue: 'text-blue-400',
  green: 'text-emerald-400',
  red: 'text-red-400',
  yellow: 'text-amber-400',
  purple: 'text-purple-400'
};

export default function StatsCard({
  title,
  value,
  trend,
  suffix = '',
  prefix = '',
  decimals = 0,
  color = 'blue',
  icon
}: StatsCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 backdrop-blur-sm',
        'transition-all duration-300 hover:scale-[1.02] hover:shadow-lg',
        colorClasses[color]
      )}
    >
      <div className="absolute top-0 right-0 h-32 w-32 -translate-y-1/3 translate-x-1/3 rounded-full bg-white/5" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-400">{title}</span>
          {icon && <div className={cn('opacity-70', textColorClasses[color])}>{icon}</div>}
        </div>
        
        <div className="mt-3 flex items-end justify-between">
          <div className="flex items-baseline gap-1">
            <AnimatedNumber
              value={value}
              decimals={decimals}
              suffix={suffix}
              prefix={prefix}
              className={cn('text-3xl font-bold', textColorClasses[color])}
            />
          </div>
          
          <div className={cn(
            'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
            trend === 'up' && 'bg-emerald-500/20 text-emerald-400',
            trend === 'down' && 'bg-red-500/20 text-red-400',
            trend === 'stable' && 'bg-slate-500/20 text-slate-400'
          )}>
            {trend === 'up' && <TrendingUp className="h-3 w-3" />}
            {trend === 'down' && <TrendingDown className="h-3 w-3" />}
            {trend === 'stable' && <Minus className="h-3 w-3" />}
            <span className="capitalize">{trend === 'up' ? '上升' : trend === 'down' ? '下降' : '平稳'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
