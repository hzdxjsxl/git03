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

  setPhase: (phase: SimPhase) => void;
  setConfig: (config: Partial<EvolutionConfig>) => void;
  initPopulation: () => void;
  setFitnessResults: (results: FitnessResult[]) => void;
  setCarStates: (states: Map<string, CarState>) => void;
  setElapsed: (ms: number) => void;
  runEvolution: () => void;
  selectCar: (id: string | null) => void;
  reset: () => void;
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
    }));
  },

  setCarStates: (carStates) => set({ carStates }),

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
    });
  },
}));
