import React from 'react';
import { Crosshair, Layers, Hash, MapPin } from 'lucide-react';
import type { HoverInfo } from '../utils/ClusterRenderer';

interface DetailPanelProps {
  hoverInfo: HoverInfo | null;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ hoverInfo }) => {
  if (!hoverInfo || hoverInfo.type === null) {
    return null;
  }

  const isCentroid = hoverInfo.type === 'centroid';
  const displayPoint = isCentroid ? hoverInfo.centroid : hoverInfo.point;

  const formatNumber = (num: number): string => {
    const absNum = Math.abs(num);
    return absNum.toFixed(2);
  };

  const formatCount = (num: number): string => {
    return Math.max(0, Math.floor(Math.abs(num))).toString();
  };

  const formatLabel = (label: number): string => {
    if (label < 0) return '—';
    return `C${label + 1}`;
  };

  return (
    <div className="fixed bottom-16 right-4 bg-[#0d1f35] bg-opacity-95 backdrop-blur-md border border-purple-500 border-opacity-50 rounded-lg p-4 shadow-lg shadow-purple-500/20 min-w-[240px] z-50">

      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-purple-500 border-opacity-30">

        <div
          className="w-3 h-3 rounded-full"
          style={{
            backgroundColor: hoverInfo.clusterColor,
            boxShadow: `0 0 8px ${hoverInfo.clusterColor}`,
          }}
        />
        <h3 className="text-purple-400 font-bold text-sm tracking-wider">
          {isCentroid ? '聚类中心详情' : '数据点详情'}
        </h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-purple-400" />
            <span className="text-gray-300 text-sm">类别编号</span>
          </div>
          <span
            className="font-mono font-bold"
            style={{ color: hoverInfo.clusterColor }}
          >
            {formatLabel(hoverInfo.clusterLabel)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span className="text-gray-300 text-sm">类别点数</span>
          </div>
          <span className="font-mono font-bold text-purple-400">
            {formatCount(hoverInfo.clusterCount)}
          </span>
        </div>

        {displayPoint && (
          <>
            <div className="pt-2 mt-2 border-t border-purple-500 border-opacity-20">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span className="text-gray-300 text-sm">绝对坐标</span>
              </div>
              <div className="grid grid-cols-2 gap-2 ml-6">
                <div className="flex items-center justify-between bg-[#0a1628] rounded px-2 py-1">
                  <span className="text-gray-400 text-xs">X:</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {formatNumber(displayPoint.x)}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-[#0a1628] rounded px-2 py-1">
                  <span className="text-gray-400 text-xs">Y:</span>
                  <span className="font-mono text-pink-400 font-bold">
                    {formatNumber(displayPoint.y)}
                  </span>
                </div>
              </div>
            </div>

            {hoverInfo.distance !== undefined && isCentroid && (
              <div className="flex items-center justify-between pt-2 mt-2 border-t border-purple-500 border-opacity-20">
                <div className="flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-300 text-sm">距离偏差</span>
                </div>
                <span className="font-mono text-yellow-400 font-bold">
                  {formatNumber(hoverInfo.distance)}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
