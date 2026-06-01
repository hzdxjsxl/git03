import { useAppStore } from '../store/useAppStore';

export default function PerformanceHUD() {
  const { metrics } = useAppStore();

  const items = [
    { label: 'FPS', value: metrics.fps, unit: '', warn: metrics.fps < 30 },
    { label: '帧时间', value: metrics.frameTime.toFixed(1), unit: 'ms', warn: metrics.frameTime > 33 },
    { label: '点数量', value: formatNumber(metrics.pointCount), unit: '', warn: false },
    { label: '显存', value: metrics.gpuMemoryMB.toFixed(0), unit: 'MB', warn: metrics.gpuMemoryMB > 500 },
    { label: '排序耗时', value: metrics.sortTime.toFixed(1), unit: 'ms', warn: metrics.sortTime > 10 },
    { label: '渲染耗时', value: metrics.renderTime.toFixed(1), unit: 'ms', warn: metrics.renderTime > 15 },
  ];

  return (
    <div className="absolute top-4 left-4 z-20 pointer-events-none">
      <div className="grid grid-cols-3 gap-1.5" style={{ minWidth: 240 }}>
        {items.map((item) => (
          <div
            key={item.label}
            className="px-2.5 py-1.5 rounded"
            style={{
              background: 'rgba(10, 14, 23, 0.85)',
              border: `1px solid ${item.warn ? '#ff6b35' : 'rgba(0, 212, 255, 0.2)'}`,
              backdropFilter: 'blur(8px)',
            }}
          >
            <div
              className="text-[10px] uppercase tracking-wider mb-0.5"
              style={{
                color: item.warn ? '#ff6b35' : 'rgba(0, 212, 255, 0.6)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {item.label}
            </div>
            <div
              className="text-sm font-bold"
              style={{
                color: item.warn ? '#ff6b35' : '#00ff88',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {item.value}
              <span className="text-[10px] ml-0.5 opacity-60">{item.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return n.toString();
}
