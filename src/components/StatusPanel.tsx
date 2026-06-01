import React from 'react';
import { Activity, Database, Layers, Zap } from 'lucide-react';

interface StatusPanelProps {
  totalPoints: number;
  fps: number;
  clusterCount: number;
  dataRate: number;
  isConnected: boolean;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({
  totalPoints,
  fps,
  clusterCount,
  dataRate,
  isConnected,
}) => {
  return (
    <div className="bg-[#0d1f35] bg-opacity-90 backdrop-blur-sm border border-green-500 border-opacity-50 rounded-lg p-4 shadow-lg shadow-green-500/20">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-green-500 border-opacity-30">
        <Activity className="w-5 h-5 text-green-400" />
        <h2 className="text-green-400 font-bold text-sm tracking-wider">状态监控</h2>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <span className="text-gray-300 text-sm">总点数</span>
          </div>
          <span className="text-cyan-400 font-mono font-bold">{totalPoints}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-pink-400" />
            <span className="text-gray-300 text-sm">聚类数</span>
          </div>
          <span className="text-pink-400 font-mono font-bold">{clusterCount}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-gray-300 text-sm">帧率</span>
          </div>
          <span className="text-yellow-400 font-mono font-bold">{fps.toFixed(1)} FPS</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-400" />
            <span className="text-gray-300 text-sm">数据速率</span>
          </div>
          <span className="text-green-400 font-mono font-bold">{dataRate.toFixed(0)}/s</span>
        </div>

        <div className="mt-4 pt-3 border-t border-green-500 border-opacity-30">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-gray-300">
              {isConnected ? 'WebSocket 已连接' : 'WebSocket 已断开'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
