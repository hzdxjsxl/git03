import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { PointCloudLoader } from '../loading/PointCloudLoader';
import { X, Database } from 'lucide-react';

export default function DatasetSelector() {
  const {
    datasets,
    setDatasets,
    selectedDataset,
    setSelectedDataset,
    datasetSelectorOpen,
    setDatasetSelectorOpen,
    isLoading,
    metrics,
  } = useAppStore();

  useEffect(() => {
    const loader = new PointCloudLoader();
    loader.fetchDatasets().then(setDatasets).catch(console.error);
  }, []);

  if (!datasetSelectorOpen && metrics.pointCount > 0) return null;

  if (!datasetSelectorOpen && metrics.pointCount === 0) {
    return (
      <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(10, 14, 23, 0.95)' }}>
        <div className="text-center">
          <Database size={48} style={{ color: '#00d4ff', margin: '0 auto 16px' }} />
          <h2
            className="text-lg mb-2"
            style={{
              color: '#00d4ff',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            三维点云抛雪球体积渲染器
          </h2>
          <p
            className="text-xs mb-6"
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            选择一个点云数据集开始渲染
          </p>
          <DatasetList
            datasets={datasets}
            selectedDataset={selectedDataset}
            onSelect={setSelectedDataset}
            isLoading={isLoading}
          />
        </div>
      </div>
    );
  }

  if (!datasetSelectorOpen) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(10, 14, 23, 0.9)' }}>
      <div
        className="relative rounded-lg p-6"
        style={{
          background: 'rgba(10, 14, 23, 0.95)',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          backdropFilter: 'blur(12px)',
          maxWidth: 560,
          width: '90%',
        }}
      >
        <button
          onClick={() => setDatasetSelectorOpen(false)}
          className="absolute top-3 right-3 p-1 rounded transition-all"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          <X size={16} />
        </button>

        <h2
          className="text-sm mb-4"
          style={{
            color: '#00d4ff',
            fontFamily: "'Space Grotesk', sans-serif",
            borderBottom: '1px solid rgba(0, 212, 255, 0.15)',
            paddingBottom: 8,
          }}
        >
          选择点云数据集
        </h2>

        <DatasetList
          datasets={datasets}
          selectedDataset={selectedDataset}
          onSelect={(id) => {
            setSelectedDataset(id);
            setDatasetSelectorOpen(false);
          }}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

function DatasetList({
  datasets,
  selectedDataset,
  onSelect,
  isLoading,
}: {
  datasets: { id: string; name: string; description: string; pointCount: number; fileSize: string }[];
  selectedDataset: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
      {datasets.map((ds) => (
        <button
          key={ds.id}
          onClick={() => !isLoading && onSelect(ds.id)}
          disabled={isLoading}
          className="w-full text-left p-3 rounded-lg transition-all"
          style={{
            background:
              selectedDataset === ds.id
                ? 'rgba(0, 212, 255, 0.1)'
                : 'rgba(255,255,255,0.02)',
            border: `1px solid ${
              selectedDataset === ds.id
                ? 'rgba(0, 212, 255, 0.4)'
                : 'rgba(255,255,255,0.06)'
            }`,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.5 : 1,
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className="text-xs font-bold"
              style={{
                color: selectedDataset === ds.id ? '#00d4ff' : 'rgba(255,255,255,0.8)',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {ds.name}
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{
                background: 'rgba(0, 212, 255, 0.1)',
                color: '#00d4ff',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {ds.fileSize}
            </span>
          </div>
          <p
            className="text-[10px] leading-relaxed"
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {ds.description}
          </p>
          <div
            className="text-[10px] mt-1"
            style={{
              color: 'rgba(0, 255, 136, 0.6)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {(ds.pointCount / 1000000).toFixed(1)}M 点
          </div>
        </button>
      ))}
    </div>
  );
}
