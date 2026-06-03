import { create } from 'zustand';

export type GameState = 'menu' | 'playing' | 'paused' | 'gameover' | 'victory' | 'leaderboard';

interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  time: number;
  level: number;
  createdAt: string;
}

interface GameStore {
  gameState: GameState;
  currentLevel: number;
  score: number;
  time: number;
  leaderboard: LeaderboardEntry[];
  setGameState: (state: GameState) => void;
  setCurrentLevel: (level: number) => void;
  setScore: (score: number) => void;
  setTime: (time: number) => void;
  setLeaderboard: (data: LeaderboardEntry[]) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: 'menu',
  currentLevel: 0,
  score: 0,
  time: 0,
  leaderboard: [],
  setGameState: (state) => set({ gameState: state }),
  setCurrentLevel: (level) => set({ currentLevel: level }),
  setScore: (score) => set({ score }),
  setTime: (time) => set({ time }),
  setLeaderboard: (data) => set({ leaderboard: data }),
  resetGame: () => set({
    score: 0,
    time: 0,
    gameState: 'playing'
  })
}));
