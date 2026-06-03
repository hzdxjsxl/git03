import React from 'react';
import { Play, Pause, RotateCcw, Layers, Waves, Activity } from 'lucide-react';
import { useSimulationStore } from '@/store/useSimulationStore';
import { presets } from '@/data/presets';

const ControlPanel: React.FC = () => {
  const {
    isRunning,
    sourcePosition,
    sourceMagnitude,
    simulationParams,
    simulationSpeed,
    showPWave,
    showSWave,
    showRockLayers,
    opacity,
    activePreset,
    setSourcePosition,
    setSourceMagnitude,
    setSimulationParams,
    setSimulationSpeed,
    setShowPWave,
    setShowSWave,
    setShowRockLayers,
    setOpacity,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    loadPreset,
  } = useSimulationStore();

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    loadPreset(e.target.value);
  };

  const handleSourceChange = (axis: 'x' | 'y' | 'z', value: number) => {
    setSourcePosition({ ...sourcePosition, [axis]: value });
  };

  return (
    <div className="absolute right-4 top-4 bottom-4 w-80 rounded-xl border border-cyan-400/30 bg-[rgba(10,22,40,0.8)] backdrop-blur-md overflow-hidden flex flex-col">
      <div className="p-4 border-b border-cyan-400/20">
        <h2 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          控制面板
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div className="space-y-3">
          <label className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            预设场景
          </label>
          <select
            value={activePreset}
            onChange={handlePresetChange}
            className="w-full px-3 py-2 bg-slate-800/60 border border-cyan-400/30 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400/60 transition-colors"
          >
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-cyan-400 border-b border-cyan-400/20 pb-2">
            震源参数
          </h3>
          <div className="space-y-3">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={axis} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">震源{axis.toUpperCase()}轴</span>
                  <span className="text-cyan-300 font-orbitron">
                    {sourcePosition[axis].toFixed(0)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="16"
                  value={sourcePosition[axis]}
                  onChange={(e) => handleSourceChange(axis, Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            ))}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">震级</span>
                <span className="text-orange-400 font-orbitron">
                  {sourceMagnitude.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={sourceMagnitude}
                onChange={(e) => setSourceMagnitude(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-400"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-cyan-400 border-b border-cyan-400/20 pb-2">
            模拟参数
          </h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">模拟速度</span>
                <span className="text-cyan-300 font-orbitron">
                  {simulationSpeed.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={simulationSpeed}
                onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">阻尼系数</span>
                <span className="text-cyan-300 font-orbitron">
                  {simulationParams.damping.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={simulationParams.damping}
                onChange={(e) => setSimulationParams({ damping: Number(e.target.value) })}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
            <div className="space-y-2">
              <span className="text-xs text-slate-300">边界条件</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSimulationParams({ boundaryCondition: 'absorbing' })}
                  className={`flex-1 px-3 py-2 text-xs rounded-lg transition-colors ${
                    simulationParams.boundaryCondition === 'absorbing'
                      ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50'
                      : 'bg-slate-800/60 text-slate-400 border border-slate-600/50 hover:border-cyan-400/30'
                  }`}
                >
                  吸收边界
                </button>
                <button
                  onClick={() => setSimulationParams({ boundaryCondition: 'reflective' })}
                  className={`flex-1 px-3 py-2 text-xs rounded-lg transition-colors ${
                    simulationParams.boundaryCondition === 'reflective'
                      ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50'
                      : 'bg-slate-800/60 text-slate-400 border border-slate-600/50 hover:border-cyan-400/30'
                  }`}
                >
                  反射边界
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-cyan-400 border-b border-cyan-400/20 pb-2 flex items-center gap-2">
            <Waves className="w-4 h-4" />
            显示选项
          </h3>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showPWave}
                onChange={(e) => setShowPWave(e.target.checked)}
                className="w-4 h-4 rounded accent-orange-500"
              />
              <span className="text-sm text-slate-300">显示 P 波</span>
              <span className="w-3 h-3 rounded-full bg-orange-500"></span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showSWave}
                onChange={(e) => setShowSWave(e.target.checked)}
                className="w-4 h-4 rounded accent-cyan-400"
              />
              <span className="text-sm text-slate-300">显示 S 波</span>
              <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showRockLayers}
                onChange={(e) => setShowRockLayers(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-500"
              />
              <span className="text-sm text-slate-300">显示岩层</span>
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            </label>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">透明度</span>
              <span className="text-cyan-300 font-orbitron">
                {opacity.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-cyan-400/20 flex gap-2">
        {!isRunning ? (
          <button
            onClick={startSimulation}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-lg font-medium transition-all shadow-lg shadow-emerald-500/20"
          >
            <Play className="w-5 h-5" />
            启动
          </button>
        ) : (
          <button
            onClick={pauseSimulation}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-lg font-medium transition-all shadow-lg shadow-amber-500/20"
          >
            <Pause className="w-5 h-5" />
            暂停
          </button>
        )}
        <button
          onClick={resetSimulation}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all"
        >
          <RotateCcw className="w-5 h-5" />
          重置
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
