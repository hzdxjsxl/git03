import type { Genome } from './genome';
import { createRandomGenome, cloneGenome } from './genome';
import type { FitnessResult } from './fitness';
import { rankByFitness } from './fitness';
import { crossover } from './crossover';
import { mutate } from './mutation';

export interface EvolutionConfig {
  populationSize: number;
  eliteCount: number;
  mutationRate: number;
  crossoverRate: number;
}

export const DEFAULT_EVOLUTION_CONFIG: EvolutionConfig = {
  populationSize: 20,
  eliteCount: 4,
  mutationRate: 0.3,
  crossoverRate: 0.7,
};

function rouletteSelect(
  genomes: Genome[],
  fitnessResults: FitnessResult[]
): Genome {
  const fitnessMap = new Map(fitnessResults.map((r) => [r.genomeId, r.score]));
  const minScore = Math.min(...fitnessResults.map((r) => r.score));
  const adjusted = genomes.map((g) => ({
    genome: g,
    score: Math.max((fitnessMap.get(g.id) ?? 0) - minScore + 1, 0.1),
  }));

  const totalFitness = adjusted.reduce((sum, a) => sum + a.score, 0);
  let rand = Math.random() * totalFitness;

  for (const { genome, score } of adjusted) {
    rand -= score;
    if (rand <= 0) return genome;
  }

  return adjusted[adjusted.length - 1].genome;
}

export function evolve(
  currentGenomes: Genome[],
  fitnessResults: FitnessResult[],
  config: EvolutionConfig
): Genome[] {
  const ranked = rankByFitness(fitnessResults);
  const rankedIds = new Set(ranked.map((r) => r.genomeId));
  const sortedGenomes = [...currentGenomes].sort((a, b) => {
    const scoreA = fitnessResults.find((r) => r.genomeId === a.id)?.score ?? 0;
    const scoreB = fitnessResults.find((r) => r.genomeId === b.id)?.score ?? 0;
    return scoreB - scoreA;
  });

  const nextGen: Genome[] = [];

  const eliteCount = Math.min(config.eliteCount, sortedGenomes.length);
  for (let i = 0; i < eliteCount; i++) {
    nextGen.push(cloneGenome(sortedGenomes[i]));
  }

  while (nextGen.length < config.populationSize) {
    if (Math.random() < config.crossoverRate) {
      const parentA = rouletteSelect(currentGenomes, fitnessResults);
      let parentB = rouletteSelect(currentGenomes, fitnessResults);
      let attempts = 0;
      while (parentB.id === parentA.id && attempts < 10) {
        parentB = rouletteSelect(currentGenomes, fitnessResults);
        attempts++;
      }
      const [childA, childB] = crossover(parentA, parentB);
      nextGen.push(mutate(childA, config.mutationRate));
      if (nextGen.length < config.populationSize) {
        nextGen.push(mutate(childB, config.mutationRate));
      }
    } else {
      const parent = rouletteSelect(currentGenomes, fitnessResults);
      nextGen.push(mutate(cloneGenome(parent), config.mutationRate));
    }
  }

  return nextGen.slice(0, config.populationSize);
}

export function createGeneration(config: EvolutionConfig): Genome[] {
  return createRandomGenomes(config.populationSize);
}

function createRandomGenomes(count: number): Genome[] {
  return Array.from({ length: count }, () => createRandomGenome());
}
