import type {
  RiskLevel,
  ContractSegment,
  RiskRule,
  HighlightRegion,
  RiskMatch,
  AnalysisStats,
} from '../types';

export interface HighlightStyle {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}

const RISK_LEVEL_ORDER: RiskLevel[] = ['high', 'medium', 'low', 'info'];

const RISK_COLOR_MAP: Record<RiskLevel, HighlightStyle> = {
  high: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
    textColor: '#991B1B',
  },
  medium: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    textColor: '#92400E',
  },
  low: {
    backgroundColor: '#FEF9C3',
    borderColor: '#EAB308',
    textColor: '#854D0E',
  },
  info: {
    backgroundColor: '#D1FAE5',
    borderColor: '#059669',
    textColor: '#065F46',
  },
};

export function getRiskLevelStyle(level: RiskLevel): HighlightStyle {
  return RISK_COLOR_MAP[level];
}

function getRiskLevelPriority(level: RiskLevel): number {
  return RISK_LEVEL_ORDER.indexOf(level);
}

function compareRiskLevels(a: RiskLevel, b: RiskLevel): number {
  return getRiskLevelPriority(a) - getRiskLevelPriority(b);
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isRegexPattern(pattern: string): boolean {
  return pattern.startsWith('/') && pattern.length > 2 && /\/[gimsuy]*$/.test(pattern);
}

function parseRegexPattern(pattern: string): RegExp | null {
  try {
    const match = pattern.match(/^\/(.+)\/([gimsuy]*)$/);
    if (match) {
      return new RegExp(match[1], match[2]);
    }
  } catch {
    return null;
  }
  return null;
}

function createRegexFromPattern(pattern: string): RegExp | null {
  if (isRegexPattern(pattern)) {
    const regex = parseRegexPattern(pattern);
    if (regex) {
      return regex.global ? regex : new RegExp(regex.source, regex.flags + 'g');
    }
    return null;
  }
  return new RegExp(escapeRegExp(pattern), 'gi');
}

function mergeOverlappingRegions(
  regions: Array<{ start: number; end: number; level: RiskLevel; rule: RiskRule; matchId: string }>
): HighlightRegion[] {
  if (regions.length === 0) return [];

  const events: Array<{ position: number; type: 'start' | 'end'; level: RiskLevel; rule: RiskRule; matchId: string }> = [];

  for (const region of regions) {
    events.push({ position: region.start, type: 'start', level: region.level, rule: region.rule, matchId: region.matchId });
    events.push({ position: region.end, type: 'end', level: region.level, rule: region.rule, matchId: region.matchId });
  }

  events.sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    return a.type === 'end' ? -1 : 1;
  });

  const result: HighlightRegion[] = [];
  const activeLevels = new Map<RiskLevel, { level: RiskLevel; count: number; rule: RiskRule }>();
  const activeMatchIds = new Map<string, RiskRule>();
  let currentPosition = events[0].position;
  let currentMaxLevel: RiskLevel | null = null;
  let currentMaxRule: RiskRule | null = null;

  for (const event of events) {
    if (event.position > currentPosition && currentMaxLevel !== null && currentMaxRule !== null) {
      const topMatchId = Array.from(activeMatchIds.entries()).find(
        ([, rule]) => rule.level === currentMaxLevel
      )?.[0];

      if (topMatchId) {
        result.push({
          start: currentPosition,
          end: event.position,
          level: currentMaxLevel,
          rule: currentMaxRule,
          matchId: topMatchId,
        });
      }
    }

    if (event.type === 'start') {
      const existing = activeLevels.get(event.level);
      activeLevels.set(event.level, {
        level: event.level,
        count: (existing?.count ?? 0) + 1,
        rule: event.rule,
      });
      activeMatchIds.set(event.matchId, event.rule);
    } else {
      const existing = activeLevels.get(event.level);
      if (existing && existing.count > 1) {
        activeLevels.set(event.level, { ...existing, count: existing.count - 1 });
      } else {
        activeLevels.delete(event.level);
      }
      activeMatchIds.delete(event.matchId);
    }

    let maxLevel: RiskLevel | null = null;
    let maxRule: RiskRule | null = null;
    for (const [, data] of activeLevels) {
      if (maxLevel === null || compareRiskLevels(data.level, maxLevel) < 0) {
        maxLevel = data.level;
        maxRule = data.rule;
      }
    }
    currentMaxLevel = maxLevel;
    currentMaxRule = maxRule;
    currentPosition = event.position;
  }

  return result;
}

export function calculateHighlights(
  segments: ContractSegment[],
  rules: RiskRule[]
): { highlights: HighlightRegion[]; matches: RiskMatch[]; stats: AnalysisStats } {
  const startTime = performance.now();
  const allMatches: RiskMatch[] = [];
  const allRegions: Array<{ start: number; end: number; level: RiskLevel; rule: RiskRule; matchId: string }> = [];

  for (const segment of segments) {
    for (const rule of rules) {
      for (const pattern of rule.patterns) {
        const regex = createRegexFromPattern(pattern);
        if (!regex) continue;

        let match: RegExpExecArray | null;
        while ((match = regex.exec(segment.content)) !== null) {
          if (match[0].length === 0) {
            regex.lastIndex++;
            continue;
          }

          const matchStart = segment.originalStartIndex + match.index;
          const matchEnd = matchStart + match[0].length;
          const matchId = `match-${segment.id}-${rule.id}-${matchStart}`;

          const riskMatch: RiskMatch = {
            ruleId: rule.id,
            rule: rule,
            startIndex: matchStart,
            endIndex: matchEnd,
            matchedText: match[0],
            segmentId: segment.id,
          };

          allMatches.push(riskMatch);
          allRegions.push({
            start: matchStart,
            end: matchEnd,
            level: rule.level,
            rule: rule,
            matchId,
          });
        }
      }
    }
  }

  const highlights = mergeOverlappingRegions(allRegions);

  const stats: AnalysisStats = {
    totalSegments: segments.length,
    totalMatches: allMatches.length,
    riskCounts: { high: 0, medium: 0, low: 0, info: 0 },
    processingTime: performance.now() - startTime,
  };

  for (const match of allMatches) {
    stats.riskCounts[match.rule.level]++;
  }

  return { highlights, matches: allMatches, stats };
}
