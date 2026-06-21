import { diffChars } from 'diff';
import type { DiffResult, DiffOperation, PatternMatch, DiffStats } from '../types';

export function compareWithTemplate(
  contractText: string,
  templateText: string
): DiffResult[] {
  const diffs = diffChars(templateText, contractText);
  const results: DiffResult[] = [];
  let currentIndex = 0;

  for (const part of diffs) {
    const actualOperation: DiffOperation = part.added
      ? 'added'
      : part.removed
        ? 'removed'
        : 'unchanged';
    
    if (part.value.length > 0) {
      results.push({
        operation: actualOperation,
        value: part.value,
        startIndex: currentIndex,
        endIndex: currentIndex + part.value.length,
      });
    }
    
    if (!part.removed) {
      currentIndex += part.value.length;
    }
  }

  return results;
}

export function calculateDiffStats(diffResults: DiffResult[], templateText: string, contractText: string): DiffStats {
  let addedChars = 0;
  let removedChars = 0;
  let unchangedChars = 0;

  for (const diff of diffResults) {
    switch (diff.operation) {
      case 'added':
        addedChars += diff.value.length;
        break;
      case 'removed':
        removedChars += diff.value.length;
        break;
      case 'unchanged':
        unchangedChars += diff.value.length;
        break;
    }
  }

  const maxLen = Math.max(templateText.length, contractText.length);
  const similarity = maxLen > 0
    ? Math.round((unchangedChars / maxLen) * 100)
    : 0;

  return {
    addedChars,
    removedChars,
    unchangedChars,
    similarity,
  };
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isRegexPattern(pattern: string): boolean {
  return pattern.startsWith('/') && pattern.endsWith('/') && pattern.length > 2;
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

export function findPatternMatches(
  text: string,
  patterns: string[]
): PatternMatch[] {
  const matches: PatternMatch[] = [];

  for (const pattern of patterns) {
    const isRegex = isRegexPattern(pattern);
    
    if (isRegex) {
      const regex = parseRegexPattern(pattern);
      if (regex) {
        const globalRegex = regex.global ? regex : new RegExp(regex.source, regex.flags + 'g');
        let match: RegExpExecArray | null;
        
        while ((match = globalRegex.exec(text)) !== null) {
          if (match[0].length === 0) {
            globalRegex.lastIndex++;
            continue;
          }
          
          matches.push({
            pattern,
            matchedText: match[0],
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            isRegex: true,
          });
          
          if (!regex.global) {
            break;
          }
        }
      }
    } else {
      const escapedPattern = escapeRegExp(pattern);
      const regex = new RegExp(escapedPattern, 'g');
      let match: RegExpExecArray | null;
      
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          pattern,
          matchedText: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          isRegex: false,
        });
      }
    }
  }

  return matches.sort((a, b) => a.startIndex - b.startIndex);
}
