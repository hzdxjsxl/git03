import React, { useEffect, useRef, useState, useCallback } from 'react';
import { DynamicClusterer } from '../utils/DynamicClusterer';
import { ClusterRenderer, type HoverInfo } from '../utils/ClusterRenderer';
import { ControlPanel } from '../components/ControlPanel';
import { StatusPanel } from '../components/StatusPanel';
import { DetailPanel } from '../components/DetailPanel';
import type { Point } from '../../shared/types';

const Home: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clustererRef = useRef<DynamicClusterer | null>(null);
  const rendererRef = useRef<ClusterRenderer | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const bufferRef = useRef<Point[]>([]);

  const [k, setK] = useState(4);
  const [alpha, setAlpha] = useState(0.1);
  const [maxPoints, setMaxPoints] = useState(1000);
  const [isRunning, setIsRunning] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [clusterCount, setClusterCount] = useState(0);
  const [fps, setFps] = useState(0);
  const [dataRate, setDataRate] = useState(0);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(Date.now());
  const pointsReceivedRef = useRef(0);
  const lastRateUpdateRef = useRef(Date.now());

  const initCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const container = canvas.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    canvas.width = width;
    canvas.height = height;

    rendererRef.current = new ClusterRenderer(canvas);
    rendererRef.current.startAnimation();
  }, []);

  const initClusterer = useCallback(() => {
    clustererRef.current = new DynamicClusterer(k, alpha, maxPoints);
  }, [k, alpha, maxPoints]);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket('ws://localhost:3001');
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      if (!isRunning) return;

      try {
        const message = JSON.parse(event.data);
        if (message.type === 'data' && message.payload) {
          const points = message.payload as Point[];
          bufferRef.current = [...bufferRef.current, ...points];

          pointsReceivedRef.current += points.length;

          if (bufferRef.current.length >= 10) {
            const batch = bufferRef.current.splice(0, bufferRef.current.length);
            if (clustererRef.current) {
              clustererRef.current.update(batch);
              const clusters = clustererRef.current.getClusters();
              const allPoints = clustererRef.current.getPoints();
              const labels = clustererRef.current.getLabels();
              const centroids = clusters.map((c) => c.centroid);

              if (rendererRef.current) {
                const clusterCounts = clusters.map(c => Math.max(0, Math.floor(c.count)));
                rendererRef.current.render(allPoints, labels, centroids, clusterCounts);
              }

              setTotalPoints(allPoints.length);
              setClusterCount(clusters.length);
            }
          }
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = () => {
      setIsConnected(false);
    };
  }, [isRunning]);

  useEffect(() => {
    initCanvas();
    initClusterer();

    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (isConnected) {
      connectWebSocket();
    }
  }, [isRunning]);

  useEffect(() => {
    connectWebSocket();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastFpsUpdateRef.current) / 1000;

      if (elapsed >= 1) {
        const currentFps = frameCountRef.current / elapsed;
        setFps(currentFps);
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = now;

        const rate = pointsReceivedRef.current / elapsed;
        setDataRate(rate);
        pointsReceivedRef.current = 0;
        lastRateUpdateRef.current = now;
      }
    }, 100);

    const countFrames = () => {
      frameCountRef.current++;
      requestAnimationFrame(countFrames);
    };
    const animationId = requestAnimationFrame(countFrames);

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(animationId);
    };
  }, []);

  const handleKChange = (newK: number) => {
    setK(newK);
    if (clustererRef.current) {
      clustererRef.current.setK(newK);
    }
  };

  const handleAlphaChange = (newAlpha: number) => {
    setAlpha(newAlpha);
    if (clustererRef.current) {
      clustererRef.current.setAlpha(newAlpha);
    }
  };

  const handleMaxPointsChange = (newMaxPoints: number) => {
    setMaxPoints(newMaxPoints);
  };

  const handleToggleRunning = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    bufferRef.current = [];
    if (clustererRef.current) {
      clustererRef.current.reset();
    }
    setTotalPoints(0);
    setClusterCount(0);
    setHoverInfo(null);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !rendererRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const info = rendererRef.current.getHoverInfo(x, y);
    setHoverInfo(info);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoverInfo(null);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a1628] text-white font-mono">
      <header className="border-b border-cyan-500 border-opacity-30 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50" />
            <h1 className="text-xl font-bold tracking-wider bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
              动态聚类分析面板
            </h1>
          </div>
          <div className="text-xs text-gray-400">
            REAL-TIME CLUSTERING ANALYSIS SYSTEM v1.0
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="bg-[#0d1f35] bg-opacity-50 border border-cyan-500 border-opacity-30 rounded-lg overflow-hidden shadow-lg shadow-cyan-500/10">
              <div className="p-2 border-b border-cyan-500 border-opacity-20 flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-xs text-gray-400 ml-2">cluster_visualization.canvas</span>
              </div>
              <div className="h-[600px]">
                <canvas
                  ref={canvasRef}
                  className="w-full h-full cursor-crosshair"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                />
              </div>
            </div>
          </div>

          <div className="w-72 space-y-4">
            <ControlPanel
              k={k}
              alpha={alpha}
              maxPoints={maxPoints}
              isRunning={isRunning}
              onKChange={handleKChange}
              onAlphaChange={handleAlphaChange}
              onMaxPointsChange={handleMaxPointsChange}
              onToggleRunning={handleToggleRunning}
              onReset={handleReset}
            />
            <StatusPanel
              totalPoints={totalPoints}
              fps={fps}
              clusterCount={clusterCount}
              dataRate={dataRate}
              isConnected={isConnected}
            />
          </div>
        </div>
      </main>

      <DetailPanel hoverInfo={hoverInfo} />

      <footer className="fixed bottom-0 left-0 right-0 border-t border-cyan-500 border-opacity-20 p-2 bg-[#0a1628] bg-opacity-90">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-gray-500">
          <span>动态聚类算法: Mini-Batch K-Means (Incremental)</span>
          <span>数据协议: WebSocket / JSON</span>
        </div>
      </footer>
    </div>
  );
};

export default Home;
