import type { Genome } from './genome';

export interface FitnessInput {
  genomeId: string;
  startX: number;
  finalX: number;
  startY: number;
  finalY: number;
  survivalTime: number;
  isStuck: boolean;
}

export interface FitnessResult {
  genomeId: string;
  distance: number;
  maxHeight: number;
  survivalTime: number;
  score: number;
}

export function calculateFitness(input: FitnessInput): FitnessResult {
  const distance = input.finalX - input.startX;
  const maxHeight = Math.max(0, input.startY - input.finalY);

  let score = distance + maxHeight * 0.3;

  if (input.isStuck && distance < 10) {
    score *= 0.1;
  }

  if (input.survivalTime < 2000 && distance < 50) {
    score *= 0.3;
  }

  return {
    genomeId: input.genomeId,
    distance,
    maxHeight,
    survivalTime: input.survivalTime,
    score,
  };
}

export function rankByFitness(
  results: FitnessResult[]
): FitnessResult[] {
  return [...results].sort((a, b) => b.score - a.score);
}

export function getBestGenome(
  genomes: Genome[],
  results: FitnessResult[]
): Genome | null {
  if (results.length === 0) return null;
  const best = results.reduce((a, b) => (a.score > b.score ? a : b));
  return genomes.find((g) => g.id === best.genomeId) ?? null;
}
