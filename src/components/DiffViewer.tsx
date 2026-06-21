import type { DiffResult } from '../types';
import { cn } from '../lib/utils';

interface DiffViewerProps {
  diffResults: DiffResult[];
  className?: string;
}

export default function DiffViewer({ diffResults, className }: DiffViewerProps) {
  return (
    <div className={cn(
      'bg-slate-900 rounded-xl border border-slate-700 overflow-auto h-full p-6',
      className
    )}>
      <div className="whitespace-pre-wrap font-mono text-sm leading-7" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {diffResults.map((diff, index) => {
          const baseClass = 'inline transition-all duration-150 rounded px-0.5 py-0.5';
          let styleClass = '';

          switch (diff.operation) {
            case 'added':
              styleClass = 'bg-emerald-500/20 text-emerald-300 border-b-2 border-emerald-500';
              break;
            case 'removed':
              styleClass = 'bg-rose-500/20 text-rose-300 border-b-2 border-rose-500 line-through opacity-75';
              break;
            case 'unchanged':
            default:
              styleClass = 'text-slate-200';
              break;
          }

          return (
            <span
              key={`${diff.operation}-${index}-${diff.startIndex}`}
              className={cn(baseClass, styleClass)}
              title={diff.operation === 'added' ? '新增内容' : diff.operation === 'removed' ? '移除内容（模板中存在）' : '一致内容'}
            >
              {diff.value}
            </span>
          );
        })}
      </div>
    </div>
  );
}
