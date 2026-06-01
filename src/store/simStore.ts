import { create } from 'zustand';
import type { Genome, FitnessResult, EvolutionConfig } from '../genetics';
import { DEFAULT_EVOLUTION_CONFIG, createInitialPopulation, evolve } from '../genetics';
import { calculateFitness, getBestGenome, rankByFitness } from '../genetics';
import type { CarState } from '../physics';

export type SimPhase = 'idle' | 'running' | 'paused' | 'evaluating' | 'evolving';

export interface HistoryEntry {
  generation: number;
  bestScore: number;
  avgScore: number;
  bestDistance: number;
}

export interface LiveRankingEntry {
  rank: number;
  genomeId: string;
  distance: number;
  score: number;
  maxHeight: number;
  isStuck: boolean;
  wheelCount: number;
  color: string;
}

interface SimStore {
  phase: SimPhase;
  generation: number;
  config: EvolutionConfig;
  genomes: Genome[];
  fitnessResults: FitnessResult[];
  bestGenome: Genome | null;
  bestScore: number;
  history: HistoryEntry[];
  elapsed: number;
  carStates: Map<string, CarState>;
  terrainSeed: number;
  selectedCarId: string | null;

  liveBestDistance: number;
  liveAvgDistance: number;
  liveBestScore: number;
  liveRankings: LiveRankingEntry[];

  setPhase: (phase: SimPhase) => void;
  setConfig: (config: Partial<EvolutionConfig>) => void;
  initPopulation: () => void;
  setFitnessResults: (results: FitnessResult[]) => void;
  setCarStates: (states: Map<string, CarState>) => void;
  setElapsed: (ms: number) => void;
  runEvolution: () => void;
  selectCar: (id: string | null) => void;
  reset: () => void;
  resetLiveStats: () => void;
}

export const useSimStore = create<SimStore>((set, get) => ({
  phase: 'idle',
  generation: 0,
  config: { ...DEFAULT_EVOLUTION_CONFIG },
  genomes: [],
  fitnessResults: [],
  bestGenome: null,
  bestScore: 0,
  history: [],
  elapsed: 0,
  carStates: new Map(),
  terrainSeed: Math.random() * 1000,
  selectedCarId: null,

  liveBestDistance: 0,
  liveAvgDistance: 0,
  liveBestScore: 0,
  liveRankings: [],

  setPhase: (phase) => set({ phase }),

  setConfig: (partial) =>
    set((s) => ({ config: { ...s.config, ...partial } })),

  initPopulation: () => {
    const { config } = get();
    const genomes = createInitialPopulation(config.populationSize);
    set({
      genomes,
      generation: 1,
      fitnessResults: [],
      bestGenome: null,
      bestScore: 0,
      history: [],
      elapsed: 0,
      carStates: new Map(),
      phase: 'idle',
      liveBestDistance: 0,
      liveAvgDistance: 0,
      liveBestScore: 0,
      liveRankings: [],
    });
  },

  setFitnessResults: (results) => {
    const { genomes } = get();
    const ranked = rankByFitness(results);
    const best = getBestGenome(genomes, ranked);
    const bestScore = ranked.length > 0 ? ranked[0].score : 0;
    const avgScore =
      ranked.length > 0
        ? ranked.reduce((sum, r) => sum + r.score, 0) / ranked.length
        : 0;
    const bestDistance = ranked.length > 0 ? ranked[0].distance : 0;

    set((s) => ({
      fitnessResults: results,
      bestGenome: best,
      bestScore: Math.max(bestScore, s.bestScore),
      history: [
        ...s.history,
        {
          generation: s.generation,
          bestScore,
          avgScore,
          bestDistance,
        },
      ],
      liveBestDistance: bestDistance,
      liveBestScore: bestScore,
    }));
  },

  setCarStates: (carStates) => {
    const { genomes, liveBestDistance: prevBest } = get();
    const genomeMap = new Map(genomes.map((g) => [g.id, g]));

    let bestDist = 0;
    let totalDist = 0;
    let count = 0;
    let maxScore = 0;

    const rankings: LiveRankingEntry[] = [];

    for (const [id, state] of carStates) {
      const genome = genomeMap.get(id);
      if (!genome) continue;

      const distance = Math.max(0, state.x - state.startX);
      const maxHeight = Math.max(0, state.startY - state.y);
      const score = distance + maxHeight * 0.3;

      if (distance > bestDist) bestDist = distance;
      if (score > maxScore) maxScore = score;
      totalDist += distance;
      count++;

      rankings.push({
        rank: 0,
        genomeId: id,
        distance,
        score,
        maxHeight,
        isStuck: state.isStuck,
        wheelCount: genome.wheels.length,
        color: genome.color,
      });
    }

    if (Math.abs(bestDist - prevBest) < 1 && count > 0) {
      set({ carStates });
      return;
    }

    rankings.sort((a, b) => b.score - a.score);
    rankings.forEach((r, i) => (r.rank = i + 1));

    const top5 = rankings.slice(0, 5);
    const avgDist = count > 0 ? totalDist / count : 0;

    set({
      carStates,
      liveBestDistance: bestDist,
      liveAvgDistance: avgDist,
      liveBestScore: maxScore,
      liveRankings: top5,
    });
  },

  setElapsed: (ms) => set({ elapsed: ms }),

  runEvolution: () => {
    const { genomes, fitnessResults, config, generation } = get();
    if (fitnessResults.length === 0) return;

    const nextGenomes = evolve(genomes, fitnessResults, config);

    set({
      genomes: nextGenomes,
      generation: generation + 1,
      fitnessResults: [],
      elapsed: 0,
      carStates: new Map(),
      phase: 'evolving',
      liveBestDistance: 0,
      liveAvgDistance: 0,
      liveBestScore: 0,
      liveRankings: [],
    });
  },

  selectCar: (id) => set({ selectedCarId: id }),

  reset: () => {
    set({
      phase: 'idle',
      generation: 0,
      genomes: [],
      fitnessResults: [],
      bestGenome: null,
      bestScore: 0,
      history: [],
      elapsed: 0,
      carStates: new Map(),
      terrainSeed: Math.random() * 1000,
      selectedCarId: null,
      liveBestDistance: 0,
      liveAvgDistance: 0,
      liveBestScore: 0,
      liveRankings: [],
    });
  },

  resetLiveStats: () => {
    set({
      liveBestDistance: 0,
      liveAvgDistance: 0,
      liveBestScore: 0,
      liveRankings: [],
    });
  },
}));
