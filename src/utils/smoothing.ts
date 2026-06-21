import type { AggregatedDataPoint, SmoothingAlgorithm } from '../../shared/types';

function movingAverage(data: number[], windowSize: number = 3): number[] {
  const result: number[] = [];
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < data.length; i++) {
    let sum = 0;
    let count = 0;

    for (let j = Math.max(0, i - halfWindow); j <= Math.min(data.length - 1, i + halfWindow); j++) {
      if (data[j] !== null && data[j] !== undefined && !isNaN(data[j])) {
        sum += data[j];
        count++;
      }
    }

    result.push(count > 0 ? sum / count : 0);
  }

  return result;
}

function exponentialSmoothing(data: number[], alpha: number = 0.3): number[] {
  if (data.length === 0) return [];

  const result: number[] = [data[0]];

  for (let i = 1; i < data.length; i++) {
    const smoothed = alpha * data[i] + (1 - alpha) * result[i - 1];
    result.push(smoothed);
  }

  return result;
}

function savitzkyGolay(data: number[], windowSize: number = 5): number[] {
  const result: number[] = [];
  const halfWindow = Math.floor(windowSize / 2);

  const coefficients = getSavitzkyGolayCoefficients(windowSize);

  for (let i = 0; i < data.length; i++) {
    if (i < halfWindow || i >= data.length - halfWindow) {
      result.push(data[i] ?? 0);
      continue;
    }

    let sum = 0;
    let norm = 0;

    for (let j = -halfWindow; j <= halfWindow; j++) {
      const value = data[i + j];
      if (value !== null && value !== undefined && !isNaN(value)) {
        sum += value * coefficients[j + halfWindow];
        norm += Math.abs(coefficients[j + halfWindow]);
      }
    }

    result.push(norm > 0 ? sum / norm : data[i] ?? 0);
  }

  return result;
}

function getSavitzkyGolayCoefficients(windowSize: number): number[] {
  const coefficients: Record<number, number[]> = {
    3: [-0.3333, 0.6667, 0.6667],
    5: [-0.0857, 0.3429, 0.4857, 0.3429, -0.0857],
    7: [-0.0952, 0.1429, 0.2857, 0.3333, 0.2857, 0.1429, -0.0952]
  };
  return coefficients[windowSize] || coefficients[5];
}

export function smoothData(
  data: AggregatedDataPoint[],
  algorithm: SmoothingAlgorithm = 'movingAverage',
  options?: { windowSize?: number; alpha?: number }
): {
  timestamps: number[];
  polarity: number[];
  polaritySmoothed: number[];
  positive: number[];
  negative: number[];
  neutral: number[];
  volume: number[];
  volumeSmoothed: number[];
} {
  const timestamps = data.map(d => d.timestamp);
  const polarity = data.map(d => d.weightedPolarity);
  const positive = data.map(d => d.count > 0 ? d.positiveCount / d.count : 0);
  const negative = data.map(d => d.count > 0 ? d.negativeCount / d.count : 0);
  const neutral = data.map(d => d.count > 0 ? d.neutralCount / d.count : 0);
  const volume = data.map(d => d.count);

  let polaritySmoothed: number[];
  let volumeSmoothed: number[];

  switch (algorithm) {
    case 'exponential':
      polaritySmoothed = exponentialSmoothing(polarity, options?.alpha ?? 0.2);
      volumeSmoothed = exponentialSmoothing(volume, options?.alpha ?? 0.3);
      break;
    case 'savitzkyGolay':
      polaritySmoothed = savitzkyGolay(polarity, options?.windowSize ?? 5);
      volumeSmoothed = savitzkyGolay(volume, options?.windowSize ?? 5);
      break;
    case 'movingAverage':
    default:
      polaritySmoothed = movingAverage(polarity, options?.windowSize ?? 3);
      volumeSmoothed = movingAverage(volume, options?.windowSize ?? 3);
  }

  return {
    timestamps,
    polarity,
    polaritySmoothed,
    positive,
    negative,
    neutral,
    volume,
    volumeSmoothed
  };
}

export function calculateTrend(data: number[]): 'up' | 'down' | 'stable' {
  if (data.length < 2) return 'stable';

  const recent = data.slice(-Math.min(10, data.length));
  let upCount = 0;
  let downCount = 0;

  for (let i = 1; i < recent.length; i++) {
    if (recent[i] > recent[i - 1]) upCount++;
    else if (recent[i] < recent[i - 1]) downCount++;
  }

  const threshold = 0.4;
  const total = recent.length - 1;

  if (upCount / total > threshold) return 'up';
  if (downCount / total > threshold) return 'down';
  return 'stable';
}
