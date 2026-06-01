import { create } from 'zustand';
import {
  RenderParams,
  PerformanceMetrics,
  LoadProgress,
  DatasetInfo,
  DEFAULT_RENDER_PARAMS,
} from '../types/pointcloud';

interface AppState {
  renderParams: RenderParams;
  metrics: PerformanceMetrics;
  loadProgress: LoadProgress;
  datasets: DatasetInfo[];
  selectedDataset: string | null;
  isLoading: boolean;
  isRendering: boolean;
  panelOpen: boolean;
  datasetSelectorOpen: boolean;

  setRenderParams: (params: Partial<RenderParams>) => void;
  setMetrics: (metrics: PerformanceMetrics) => void;
  setLoadProgress: (progress: LoadProgress) => void;
  setDatasets: (datasets: DatasetInfo[]) => void;
  setSelectedDataset: (id: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsRendering: (rendering: boolean) => void;
  setPanelOpen: (open: boolean) => void;
  setDatasetSelectorOpen: (open: boolean) => void;
}

const defaultMetrics: PerformanceMetrics = {
  fps: 0,
  frameTime: 0,
  pointCount: 0,
  visiblePoints: 0,
  gpuMemoryMB: 0,
  sortTime: 0,
  renderTime: 0,
  drawCalls: 0,
};

const defaultProgress: LoadProgress = {
  loaded: 0,
  total: 0,
  percentage: 0,
  chunksLoaded: 0,
  totalChunks: 0,
};

export const useAppStore = create<AppState>((set) => ({
  renderParams: DEFAULT_RENDER_PARAMS,
  metrics: defaultMetrics,
  loadProgress: defaultProgress,
  datasets: [],
  selectedDataset: null,
  isLoading: false,
  isRendering: false,
  panelOpen: true,
  datasetSelectorOpen: false,

  setRenderParams: (params) =>
    set((state) => ({
      renderParams: { ...state.renderParams, ...params },
    })),
  setMetrics: (metrics) => set({ metrics }),
  setLoadProgress: (loadProgress) => set({ loadProgress }),
  setDatasets: (datasets) => set({ datasets }),
  setSelectedDataset: (selectedDataset) => set({ selectedDataset }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsRendering: (isRendering) => set({ isRendering }),
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  setDatasetSelectorOpen: (datasetSelectorOpen) => set({ datasetSelectorOpen }),
}));
