import PointCloudCanvas from './components/PointCloudCanvas';
import PerformanceHUD from './components/PerformanceHUD';
import ControlPanel from './components/ControlPanel';
import LoadingBar from './components/LoadingBar';
import DatasetSelector from './components/DatasetSelector';
import { useAppStore } from './store/useAppStore';
import { Database } from 'lucide-react';

export default function App() {
  const { setDatasetSelectorOpen, metrics } = useAppStore();

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#0a0e17' }}>
      <PointCloudCanvas />
      <PerformanceHUD />
      <ControlPanel />
      <LoadingBar />
      <DatasetSelector />

      {metrics.pointCount > 0 && (
        <button
          onClick={() => setDatasetSelectorOpen(true)}
          className="absolute bottom-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all"
          style={{
            background: 'rgba(10, 14, 23, 0.85)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            color: 'rgba(0, 212, 255, 0.8)',
            backdropFilter: 'blur(8px)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
          }}
        >
          <Database size={14} />
          切换数据集
        </button>
      )}
    </div>
  );
}
