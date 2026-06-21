export type RiskLevel = 'high' | 'medium' | 'low' | 'info';

export interface RiskRule {
  id: string;
  name: string;
  description: string;
  level: RiskLevel;
  patterns: string[];
  category?: string;
  severity?: number;
  suggestion?: string;
  regulation?: string;
}

export interface RiskMatch {
  ruleId: string;
  rule: RiskRule;
  startIndex: number;
  endIndex: number;
  matchedText: string;
  segmentId: string;
  confidence?: number;
}

export type SegmentType = 'title' | 'clause' | 'paragraph' | 'list';

export interface ContractSegment {
  id: string;
  type: SegmentType;
  content: string;
  lineNumber: number;
  level?: number;
  originalStartIndex: number;
  originalEndIndex: number;
  heading?: string;
  listLevel?: number;
}

export interface HighlightRegion {
  start: number;
  end: number;
  level: RiskLevel;
  rule: RiskRule;
  matchId: string;
}

export interface AnalysisStats {
  totalSegments: number;
  totalMatches: number;
  riskCounts: Record<RiskLevel, number>;
  processingTime?: number;
}

export interface AnalysisResult {
  segments: ContractSegment[];
  matches: RiskMatch[];
  highlights: HighlightRegion[];
  stats: AnalysisStats;
  diffResults?: DiffResult[];
  templateName?: string;
  diffStats?: DiffStats;
}

export type DiffOperation = 'added' | 'removed' | 'unchanged';

export interface DiffResult {
  operation: DiffOperation;
  value: string;
  startIndex: number;
  endIndex: number;
}

export interface PatternMatch {
  pattern: string;
  matchedText: string;
  startIndex: number;
  endIndex: number;
  isRegex: boolean;
}

export interface DiffStats {
  addedChars: number;
  removedChars: number;
  unchangedChars: number;
  similarity: number;
}

export interface ParsedDocument {
  text: string;
  fileName: string;
  fileSize?: number;
  charCount: number;
}

export interface ContractTemplate {
  text: string;
  name: string;
}
