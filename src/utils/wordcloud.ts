import type { KeywordItem } from '../../shared/types';

export function getSentimentColor(sentiment: number, alpha: number = 1): string {
  if (sentiment > 0.3) {
    const intensity = Math.min(1, (sentiment - 0.3) / 0.7);
    return `rgba(${Math.round(16 + (1 - intensity) * 100)}, ${Math.round(185 - (1 - intensity) * 50)}, ${Math.round(129 - (1 - intensity) * 50)}, ${alpha})`;
  } else if (sentiment < -0.3) {
    const intensity = Math.min(1, (-sentiment - 0.3) / 0.7);
    return `rgba(${Math.round(239 - (1 - intensity) * 50)}, ${Math.round(68 + (1 - intensity) * 100)}, ${Math.round(68 + (1 - intensity) * 100)}, ${alpha})`;
  } else {
    return `rgba(100, 116, 139, ${alpha})`;
  }
}

export function generateWordCloudData(keywords: KeywordItem[], maxWords: number = 80): Array<{
  name: string;
  value: number;
  textStyle: {
    color: string;
  };
}> {
  return keywords
    .slice(0, maxWords)
    .map(kw => ({
      name: kw.name,
      value: Math.max(10, Math.sqrt(kw.value) * 8),
      textStyle: {
        color: getSentimentColor(kw.sentiment)
      }
    }));
}

export function calculateKeywordPositions(
  keywords: KeywordItem[],
  width: number,
  height: number
): Array<{
  name: string;
  value: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
}> {
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) * 0.45;

  const sorted = [...keywords].sort((a, b) => b.value - a.value);
  const maxValue = sorted[0]?.value || 1;

  const positions: Array<{
    name: string;
    value: number;
    x: number;
    y: number;
    size: number;
    color: string;
    rotation: number;
  }> = [];

  const placed: Array<{ x: number; y: number; radius: number }> = [];

  for (let i = 0; i < Math.min(sorted.length, 100); i++) {
    const kw = sorted[i];
    const size = 12 + (kw.value / maxValue) * 48;
    const radius = size * 0.4;

    let x: number, y: number;
    let attempts = 0;
    let placedSuccessfully = false;

    while (attempts < 200 && !placedSuccessfully) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * maxRadius * (0.3 + (kw.value / maxValue) * 0.7);

      x = centerX + Math.cos(angle) * distance;
      y = centerY + Math.sin(angle) * distance;

      placedSuccessfully = true;
      for (const p of placed) {
        const dx = x - p.x;
        const dy = y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < radius + p.radius + 5) {
          placedSuccessfully = false;
          break;
        }
      }

      attempts++;
    }

    if (placedSuccessfully && x! > size && x! < width - size && y! > size && y! < height - size) {
      positions.push({
        name: kw.name,
        value: kw.value,
        x: x!,
        y: y!,
        size,
        color: getSentimentColor(kw.sentiment),
        rotation: Math.random() > 0.7 ? (Math.random() > 0.5 ? 90 : -90) : 0
      });
      placed.push({ x: x!, y: y!, radius });
    }
  }

  return positions;
}

export function interpolatePositions(
  from: Array<{ x: number; y: number; size: number }>,
  to: Array<{ x: number; y: number; size: number }>,
  progress: number
): Array<{ x: number; y: number; size: number }> {
  return to.map((target, i) => {
    const source = from[i] || target;
    return {
      x: source.x + (target.x - source.x) * progress,
      y: source.y + (target.y - source.y) * progress,
      size: source.size + (target.size - source.size) * progress
    };
  });
}
