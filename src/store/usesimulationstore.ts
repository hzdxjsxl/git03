import { create } from 'zustand';
import type { Vector3, RockModel, WaveField, SimulationParams } from '@/utils/waveSolver';
import { createWaveField } from '@/utils/waveSolver';
import { layeredModel } from '@/data/rockLayers';
import { presets } from '@/data/presets';

interface SimulationState {
  isRunning: boolean;
  rockModel: RockModel;
  waveField: WaveField | null;
  sourcePosition: Vector3;
  sourceMagnitude: number;
  simulationParams: SimulationParams;
  simulationSpeed: number;
  showPWave: boolean;
  showSWave: boolean;
  showRockLayers: boolean;
  opacity: number;
  currentTime: number;
  pWaveMaxDistance: number;
  sWaveMaxDistance: number;
  gridSize: { x: number; y: number; z: number };
  cellSize: { x: number; y: number; z: number };
  activePreset: string;

  setIsRunning: (running: boolean) => void;
  setRockModel: (model: RockModel) => void;
  setSourcePosition: (pos: Vector3) => void;
  setSourceMagnitude: (mag: number) => void;
  setSimulationParams: (params: Partial<SimulationParams>) => void;
  setSimulationSpeed: (speed: number) => void;
  setShowPWave: (show: boolean) => void;
  setShowSWave: (show: boolean) => void;
  setShowRockLayers: (show: boolean) => void;
  setOpacity: (opacity: number) => void;
  setCurrentTime: (time: number) => void;
  setWaveDistances: (pDist: number, sDist: number) => void;
  initWaveField: () => void;
  resetSimulation: () => void;
  startSimulation: () => void;
  pauseSimulation: () => void;
  loadPreset: (presetId: string) => void;
  setActivePreset: (id: string) => void;
}

const defaultParams: SimulationParams = {
  timeStep: 0.0005,
  damping: 0.005,
  boundaryCondition: 'absorbing',
  sourceFrequency: 0.5,
};

export const useSimulationStore = create<SimulationState>((set, get) => ({
  isRunning: false,
  rockModel: layeredModel,
  waveField: null,
  sourcePosition: { x: 8, y: 8, z: 8 },
  sourceMagnitude: 8.0,
  simulationParams: defaultParams,
  simulationSpeed: 2.0,
  showPWave: true,
  showSWave: true,
  showRockLayers: true,
  opacity: 0.6,
  currentTime: 0,
  pWaveMaxDistance: 0,
  sWaveMaxDistance: 0,
  gridSize: { x: 16, y: 16, z: 16 },
  cellSize: { x: 6.25, y: 6.25, z: 6.25 },
  activePreset: 'layered',

  setIsRunning: (running) => set({ isRunning: running }),
  setRockModel: (model) => set({ rockModel: model }),
  setSourcePosition: (pos) => set({ sourcePosition: pos }),
  setSourceMagnitude: (mag) => set({ sourceMagnitude: mag }),
  setSimulationParams: (params) =>
    set((state) => ({
      simulationParams: { ...state.simulationParams, ...params },
    })),
  setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),
  setShowPWave: (show) => set({ showPWave: show }),
  setShowSWave: (show) => set({ showSWave: show }),
  setShowRockLayers: (show) => set({ showRockLayers: show }),
  setOpacity: (opacity) => set({ opacity }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setWaveDistances: (pDist, sDist) =>
    set({ pWaveMaxDistance: pDist, sWaveMaxDistance: sDist }),

  initWaveField: () => {
    const { gridSize, cellSize, rockModel } = get();
    const waveField = createWaveField(gridSize, cellSize, rockModel);
    set({ waveField, currentTime: 0, pWaveMaxDistance: 0, sWaveMaxDistance: 0 });
  },

  resetSimulation: () => {
    const { waveField } = get();
    if (waveField) {
      waveField.pWave.fill(0);
      waveField.pWavePrev.fill(0);
      waveField.sWaveX.fill(0);
      waveField.sWaveY.fill(0);
      waveField.sWaveZ.fill(0);
      waveField.sWavePrevX.fill(0);
      waveField.sWavePrevY.fill(0);
      waveField.sWavePrevZ.fill(0);
      waveField.time = 0;
      waveField.sourceTime = 0;
      waveField.source = null;
    }
    set({
      isRunning: false,
      currentTime: 0,
      pWaveMaxDistance: 0,
      sWaveMaxDistance: 0,
    });
  },

  startSimulation: () => {
    const { waveField, sourcePosition, sourceMagnitude, initWaveField } = get();
    if (!waveField) {
      initWaveField();
    }
    const currentWaveField = get().waveField;
    if (currentWaveField) {
      currentWaveField.source = { ...sourcePosition };
      currentWaveField.sourceMagnitude = sourceMagnitude;
      currentWaveField.sourceTime = 0;
    }
    set({ isRunning: true });
  },

  pauseSimulation: () => set({ isRunning: false }),

  loadPreset: (presetId) => {
    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      set({
        rockModel: preset.rockModel,
        sourcePosition: preset.defaultSource,
        sourceMagnitude: preset.defaultMagnitude,
        activePreset: presetId,
        isRunning: false,
        waveField: null,
        currentTime: 0,
        pWaveMaxDistance: 0,
        sWaveMaxDistance: 0,
      });
      get().initWaveField();
    }
  },

  setActivePreset: (id) => set({ activePreset: id }),
}));
