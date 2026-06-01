import { useAppStore } from '../store/useAppStore';

export default function LoadingBar() {
  const { isLoading, loadProgress } = useAppStore();

  if (!isLoading) return null;

  const pct = Math.min(loadProgress.percentage, 100);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-4">
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: 'rgba(10, 14, 23, 0.9)',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="px-4 py-2 flex items-center justify-between">
          <span
            className="text-[11px]"
            style={{
              color: 'rgba(0, 212, 255, 0.8)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            加载点云数据
          </span>
          <span
            className="text-[11px] font-bold"
            style={{
              color: '#00ff88',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {pct.toFixed(0)}%
          </span>
        </div>

        <div className="h-1 mx-4 mb-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #00d4ff, #00ff88)',
              boxShadow: '0 0 12px rgba(0, 212, 255, 0.5)',
            }}
          />
        </div>

        <div className="px-4 pb-2 flex justify-between">
          <span
            className="text-[10px]"
            style={{
              color: 'rgba(255,255,255,0.3)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {formatCount(loadProgress.loaded)} / {formatCount(loadProgress.total)} 点
          </span>
          <span
            className="text-[10px]"
            style={{
              color: 'rgba(255,255,255,0.3)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {loadProgress.chunksLoaded} / {loadProgress.totalChunks} 块
          </span>
        </div>
      </div>
    </div>
  );
}

function formatCount(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return n.toString();
}
