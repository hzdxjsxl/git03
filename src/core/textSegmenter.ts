import type { ContractSegment, SegmentType } from '../types';

const TITLE_PATTERNS = [
  /^第[一二三四五六七八九十百千]+[章节目]$/,
  /^第[一二三四五六七八九十百千]+条/,
  /^第\d+[章节目]$/,
  /^第\d+条/,
];

const HEADING_PATTERNS = [
  /^(\d+)\.\s/,
  /^(\d+\.\d+)\s/,
  /^(\d+\.\d+\.\d+)\s/,
  /^[（(]([一二三四五六七八九十]+)[）)]\s/,
  /^[（(](\d+)[）)]\s/,
];

const LIST_PATTERNS = [
  /^[-•●○▪▸▹►▻]\s/,
  /^(\d+)[、.)]\s/,
  /^[a-zA-Z][、.)]\s/,
];

const CLAUSE_OPENERS = ['甲方', '乙方', '双方', '本合同', '本协议', '本条款', '双方约定'];

function generateSegmentId(index: number): string {
  return `seg_${Date.now()}_${index}`;
}

function getLineNumber(text: string, index: number): number {
  return text.slice(0, index).split('\n').length;
}

function matchTitleLevel(line: string): { type: SegmentType; level: number } | null {
  const trimmed = line.trim();
  
  for (const pattern of TITLE_PATTERNS) {
    if (pattern.test(trimmed)) {
      if (/第[一二三四五六七八九十百千]+章|第\d+章/.test(trimmed)) {
        return { type: 'title', level: 1 };
      }
      if (/第[一二三四五六七八九十百千]+节|第\d+节/.test(trimmed)) {
        return { type: 'title', level: 2 };
      }
      if (/第[一二三四五六七八九十百千]+目|第\d+目/.test(trimmed)) {
        return { type: 'title', level: 3 };
      }
      if (/第[一二三四五六七八九十百千]+条|第\d+条/.test(trimmed)) {
        return { type: 'clause', level: 1 };
      }
    }
  }
  
  for (let i = 0; i < HEADING_PATTERNS.length; i++) {
    const pattern = HEADING_PATTERNS[i];
    if (pattern.test(trimmed)) {
      const level = i < 3 ? i + 2 : i;
      return { type: 'clause', level };
    }
  }
  
  return null;
}

function matchListLevel(line: string): number | null {
  const trimmed = line.trim();
  for (let i = 0; i < LIST_PATTERNS.length; i++) {
    if (LIST_PATTERNS[i].test(trimmed)) {
      const indent = line.search(/\S/);
      return Math.floor(indent / 2) + 1;
    }
  }
  return null;
}

function isClauseOpener(line: string): boolean {
  const trimmed = line.trim();
  return CLAUSE_OPENERS.some(opener => trimmed.startsWith(opener));
}

export function segmentContract(text: string): ContractSegment[] {
  const segments: ContractSegment[] = [];
  const lines = text.split('\n');
  let currentIndex = 0;
  let segmentIndex = 0;
  
  let buffer: string[] = [];
  let bufferStartIndex = 0;
  let currentType: SegmentType | null = null;
  let currentLevel: number | undefined;
  let currentHeading: string | undefined;
  let currentListLevel: number | undefined;
  
  const flushBuffer = (endIndex: number, lineNum: number) => {
    if (buffer.length > 0) {
      const content = buffer.join('\n').trim();
      if (content) {
        segments.push({
          id: generateSegmentId(segmentIndex++),
          type: currentType || 'paragraph',
          content,
          lineNumber: lineNum,
          level: currentLevel,
          originalStartIndex: bufferStartIndex,
          originalEndIndex: endIndex,
          heading: currentHeading,
          listLevel: currentListLevel,
        });
      }
      buffer = [];
    }
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineStartIndex = currentIndex;
    const lineEndIndex = currentIndex + line.length;
    
    if (line.trim() === '') {
      if (buffer.length > 0) {
        flushBuffer(lineEndIndex, getLineNumber(text, bufferStartIndex));
        currentType = null;
        currentLevel = undefined;
        currentHeading = undefined;
        currentListLevel = undefined;
      }
      currentIndex = lineEndIndex + 1;
      continue;
    }
    
    const titleMatch = matchTitleLevel(line);
    const listMatch = matchListLevel(line);
    
    if (titleMatch) {
      if (buffer.length > 0) {
        flushBuffer(lineStartIndex, getLineNumber(text, bufferStartIndex));
      }
      bufferStartIndex = lineStartIndex;
      currentType = titleMatch.type;
      currentLevel = titleMatch.level;
      currentHeading = line.trim();
      currentListLevel = undefined;
      buffer = [line];
    } else if (listMatch !== null) {
      if (buffer.length > 0 && (currentType !== 'list' || currentListLevel !== listMatch)) {
        flushBuffer(lineStartIndex, getLineNumber(text, bufferStartIndex));
        bufferStartIndex = lineStartIndex;
      }
      if (buffer.length === 0) {
        bufferStartIndex = lineStartIndex;
      }
      currentType = 'list';
      currentListLevel = listMatch;
      currentLevel = undefined;
      currentHeading = undefined;
      buffer.push(line);
    } else if (isClauseOpener(line)) {
      if (buffer.length > 0) {
        flushBuffer(lineStartIndex, getLineNumber(text, bufferStartIndex));
      }
      bufferStartIndex = lineStartIndex;
      currentType = 'clause';
      currentLevel = undefined;
      currentHeading = undefined;
      currentListLevel = undefined;
      buffer = [line];
    } else {
      if (buffer.length === 0) {
        bufferStartIndex = lineStartIndex;
        if (!currentType) {
          currentType = 'paragraph';
        }
      }
      buffer.push(line);
    }
    
    currentIndex = lineEndIndex + 1;
  }
  
  if (buffer.length > 0) {
    flushBuffer(currentIndex - 1, getLineNumber(text, bufferStartIndex));
  }
  
  return segments;
}
