import { useEffect, useRef, useCallback } from 'react';
import { PointCloudRenderer } from '../rendering/PointCloudRenderer';
import { PointCloudLoader } from '../loading/PointCloudLoader';
import { useAppStore } from '../store/useAppStore';
import { ChunkData } from '../types/pointcloud';

export default function PointCloudCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<PointCloudRenderer | null>(null);
  const loaderRef = useRef<PointCloudLoader | null>(null);

  const {
    renderParams,
    setMetrics,
    setLoadProgress,
    setIsLoading,
    setIsRendering,
    selectedDataset,
  } = useAppStore();

  const handleChunk = useCallback((chunk: ChunkData) => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    if (chunk.chunkIndex === 0) {
      renderer.setPointData(chunk.data, chunk.pointCount);
    } else {
      renderer.appendPointData(chunk.data, chunk.pointCount);
    }
  }, []);

  const handleProgress = useCallback(
    (progress: Parameters<typeof setLoadProgress>[0]) => {
      setLoadProgress(progress);
    },
    [setLoadProgress]
  );

  const handleComplete = useCallback(() => {
    setIsLoading(false);
    setIsRendering(true);
    rendererRef.current?.finalizeLoad();
  }, [setIsLoading, setIsRendering]);

  const handleError = useCallback(
    (error: Error) => {
      console.error('Load error:', error);
      setIsLoading(false);
    },
    [setIsLoading]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = new PointCloudRenderer(containerRef.current, renderParams);
    renderer.setOnMetricsUpdate(setMetrics);
    renderer.start();
    rendererRef.current = renderer;

    const loader = new PointCloudLoader();
    loaderRef.current = loader;

    return () => {
      renderer.dispose();
      loader.abort();
    };
  }, []);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.updateRenderParams(renderParams);
  }, [renderParams]);

  useEffect(() => {
    const loader = loaderRef.current;
    const renderer = rendererRef.current;
    if (!loader || !renderer || !selectedDataset) return;

    setIsLoading(true);
    setIsRendering(false);

    loader.loadPointCloud(
      selectedDataset,
      handleChunk,
      handleProgress,
      handleComplete,
      handleError,
      50000
    );
  }, [selectedDataset]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: '#0a0e17' }}
    />
  );
}
