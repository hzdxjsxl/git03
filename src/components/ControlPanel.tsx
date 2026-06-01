import React from 'react';
import { Settings, Play, Pause, RotateCcw } from 'lucide-react';

interface ControlPanelProps {
  k: number;
  alpha: number;
  maxPoints: number;
  isRunning: boolean;
  onKChange: (k: number) => void;
  onAlphaChange: (alpha: number) => void;
  onMaxPointsChange: (maxPoints: number) => void;
  onToggleRunning: () => void;
  onReset: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  k,
  alpha,
  maxPoints,
  isRunning,
  onKChange,
  onAlphaChange,
  onMaxPointsChange,
  onToggleRunning,
  onReset,
}) => {
  return (
    <div className="bg-[#0d1f35] bg-opacity-90 backdrop-blur-sm border border-cyan-500 border-opacity-50 rounded-lg p-4 shadow-lg shadow-cyan-500/20">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-cyan-500 border-opacity-30">
        <Settings className="w-5 h-5 text-cyan-400" />
        <h2 className="text-cyan-400 font-bold text-sm tracking-wider">控制面板</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-cyan-300 text-xs mb-1">聚类数量 (K)</label>
          <input
            type="range"
            min="2"
            max="8"
            value={k}
            onChange={(e) => onKChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>2</span>
            <span className="text-cyan-400 font-bold">{k}</span>
            <span>8</span>
          </div>
        </div>

        <div>
          <label className="block text-cyan-300 text-xs mb-1">学习率 (Alpha)</label>
          <input
            type="range"
            min="0.01"
            max="0.5"
            step="0.01"
            value={alpha}
            onChange={(e) => onAlphaChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>0.01</span>
            <span className="text-pink-500 font-bold">{alpha.toFixed(2)}</span>
            <span>0.5</span>
          </div>
        </div>

        <div>
          <label className="block text-cyan-300 text-xs mb-1">最大点数</label>
          <input
            type="range"
            min="200"
            max="2000"
            step="100"
            value={maxPoints}
            onChange={(e) => onMaxPointsChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>200</span>
            <span className="text-yellow-400 font-bold">{maxPoints}</span>
            <span>2000</span>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onToggleRunning}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded font-bold text-sm transition-all ${
              isRunning
                ? 'bg-pink-600 hover:bg-pink-700 text-white'
                : 'bg-cyan-600 hover:bg-cyan-700 text-white'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isRunning ? '暂停' : '开始'}
          </button>

          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 py-2 px-4 rounded font-bold text-sm bg-gray-700 hover:bg-gray-600 text-white transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
        </div>
      </div>
    </div>
  );
};
