import { useRef, useEffect, useMemo } from 'react';
import type { HighlightRegion, RiskMatch, RiskLevel } from '../types';
import { getRiskLevelStyle } from '../core/riskHighlighter';
import { cn } from '../lib/utils';

interface ContractViewerProps {
  contractText: string;
  highlights: HighlightRegion[];
  viewMode: 'highlight' | 'text';
  scrollToMatch: RiskMatch | null;
  onHighlightClick: (match: RiskMatch, event: React.MouseEvent) => void;
}

const levelColors: Record<RiskLevel, string> = {
  high: 'bg-red-500/30 border-red-500 hover:bg-red-500/40',
  medium: 'bg-orange-500/30 border-orange-500 hover:bg-orange-500/40',
  low: 'bg-yellow-500/30 border-yellow-500 hover:bg-yellow-500/40',
  info: 'bg-green-500/30 border-green-500 hover:bg-green-500/40',
};

export default function ContractViewer({
  contractText,
  highlights,
  viewMode,
  scrollToMatch,
  onHighlightClick,
}: ContractViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightRefs = useRef<Map<string, HTMLSpanElement>>(new Map());

  const segments = useMemo(() => {
    if (!contractText) return [];
    
    const parts: Array<{
      text: string;
      highlight?: HighlightRegion;
      isHighlight: boolean;
    }> = [];

    if (viewMode === 'text' || highlights.length === 0) {
      return [{ text: contractText, isHighlight: false }];
    }

    let lastIndex = 0;
    const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start);

    for (const highlight of sortedHighlights) {
      if (highlight.start > lastIndex) {
        parts.push({
          text: contractText.slice(lastIndex, highlight.start),
          isHighlight: false,
        });
      }
      parts.push({
        text: contractText.slice(highlight.start, highlight.end),
        highlight,
        isHighlight: true,
      });
      lastIndex = highlight.end;
    }

    if (lastIndex < contractText.length) {
      parts.push({
        text: contractText.slice(lastIndex),
        isHighlight: false,
      });
    }

    return parts;
  }, [contractText, highlights, viewMode]);

  useEffect(() => {
    if (scrollToMatch && containerRef.current) {
      const element = highlightRefs.current.get(scrollToMatch.ruleId + '-' + scrollToMatch.startIndex);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-2', 'ring-white', 'ring-offset-2', 'ring-offset-slate-900');
        const timer = setTimeout(() => {
          element.classList.remove('ring-2', 'ring-white', 'ring-offset-2', 'ring-offset-slate-900');
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [scrollToMatch]);

  const handleHighlightClick = (highlight: HighlightRegion, event: React.MouseEvent) => {
    const match: RiskMatch = {
      ruleId: highlight.rule.id,
      rule: highlight.rule,
      startIndex: highlight.start,
      endIndex: highlight.end,
      matchedText: contractText.slice(highlight.start, highlight.end),
      segmentId: '',
    };
    onHighlightClick(match, event);
  };

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto bg-slate-900 rounded-xl border border-slate-700 p-6"
    >
      <div
        className="text-slate-200 leading-loose whitespace-pre-wrap font-mono text-sm"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {segments.map((segment, index) => {
          if (segment.isHighlight && segment.highlight) {
            const style = getRiskLevelStyle(segment.highlight.level);
            const highlightKey = segment.highlight.rule.id + '-' + segment.highlight.start;
            return (
              <span
                key={index}
                ref={(el) => {
                  if (el) highlightRefs.current.set(highlightKey, el);
                }}
                className={cn(
                  'cursor-pointer border-b-2 transition-all duration-200 rounded px-0.5',
                  levelColors[segment.highlight.level]
                )}
                style={{
                  backgroundColor: style.backgroundColor,
                  borderColor: style.borderColor,
                  color: style.textColor,
                }}
                onClick={(e) => handleHighlightClick(segment.highlight!, e)}
              >
                {segment.text}
              </span>
            );
          }
          return <span key={index}>{segment.text}</span>;
        })}
      </div>
    </div>
  );
}
