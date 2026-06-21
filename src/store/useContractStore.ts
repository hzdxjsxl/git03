import { create } from 'zustand';
import type {
  RiskRule,
  RiskMatch,
  HighlightRegion,
  AnalysisStats,
  AnalysisResult,
} from '../types';

interface ContractState {
  contractText: string;
  analysisResult: AnalysisResult | null;
  rules: RiskRule[];
  loading: boolean;
  selectedMatch: RiskMatch | null;
  setContractText: (text: string) => void;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  setRules: (rules: RiskRule[]) => void;
  setLoading: (loading: boolean) => void;
  setSelectedMatch: (match: RiskMatch | null) => void;
  clearAll: () => void;
}

export const useContractStore = create<ContractState>((set) => ({
  contractText: '',
  analysisResult: null,
  rules: [],
  loading: false,
  selectedMatch: null,

  setContractText: (text: string) => set({ contractText: text }),

  setAnalysisResult: (result: AnalysisResult | null) => set({ analysisResult: result }),

  setRules: (rules: RiskRule[]) => set({ rules }),

  setLoading: (loading: boolean) => set({ loading }),

  setSelectedMatch: (match: RiskMatch | null) => set({ selectedMatch: match }),

  clearAll: () => set({
    contractText: '',
    analysisResult: null,
    rules: [],
    loading: false,
    selectedMatch: null,
  }),
}));
