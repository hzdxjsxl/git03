import { useRef, useEffect } from 'react';
import { useSimStore } from '../store/simStore';
import { rankByFitness } from '../genetics';

export default function StatsPanel() {
  const { history, fitnessResults, generation, bestScore } = useSimStore();
  const lineChartRef = useRef<HTMLCanvasElement>(null);
  const barChartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = lineChartRef.current;
    if (!canvas || history.length < 2) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = { top: 16, right: 8, bottom: 20, left: 36 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, w, h);

    const maxScore = Math.max(...history.map((e) => e.bestScore), 1);
    const minScore = 0;

    ctx.strokeStyle = '#2d3a5233';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartW, y);
      ctx.stroke();

      ctx.font = '8px "JetBrains Mono"';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'right';
      ctx.fillText(
        (maxScore - (maxScore * i) / 4).toFixed(0),
        padding.left - 4,
        y + 3
      );
    }

    const bestPoints: { x: number; y: number }[] = [];
    const avgPoints: { x: number; y: number }[] = [];

    for (let i = 0; i < history.length; i++) {
      const x = padding.left + (chartW * i) / (history.length - 1);
      const bestY =
        padding.top + chartH * (1 - history[i].bestScore / maxScore);
      const avgY =
        padding.top + chartH * (1 - history[i].avgScore / maxScore);
      bestPoints.push({ x, y: bestY });
      avgPoints.push({ x, y: avgY });
    }

    if (avgPoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(avgPoints[0].x, avgPoints[0].y);
      for (let i = 1; i < avgPoints.length; i++) {
        ctx.lineTo(avgPoints[i].x, avgPoints[i].y);
      }
      ctx.strokeStyle = '#38bdf866';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    if (bestPoints.length > 1) {
      ctx.beginPath();
      ctx.moveTo(bestPoints[0].x, bestPoints[0].y);
      for (let i = 1; i < bestPoints.length; i++) {
        ctx.lineTo(bestPoints[i].x, bestPoints[i].y);
      }
      ctx.strokeStyle = '#00e5a0';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const last = bestPoints[bestPoints.length - 1];
      ctx.beginPath();
      ctx.arc(last.x, last.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#00e5a0';
      ctx.fill();
    }

    ctx.font = '8px "JetBrains Mono"';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    for (let i = 0; i < history.length; i += Math.max(1, Math.floor(history.length / 6))) {
      const x = padding.left + (chartW * i) / (history.length - 1);
      ctx.fillText(`${history[i].generation}`, x, h - 4);
    }
  }, [history]);

  useEffect(() => {
    const canvas = barChartRef.current;
    if (!canvas || fitnessResults.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = { top: 8, right: 4, bottom: 4, left: 4 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, w, h);

    const ranked = rankByFitness(fitnessResults);
    const maxScore = Math.max(...ranked.map((r) => r.score), 1);
    const barWidth = Math.max(2, (chartW / ranked.length) - 1);

    for (let i = 0; i < ranked.length; i++) {
      const barHeight = (ranked[i].score / maxScore) * chartH;
      const x = padding.left + i * (barWidth + 1);
      const y = padding.top + chartH - barHeight;

      const isElite = i < 4;
      ctx.fillStyle = isElite ? '#00e5a0' : '#2d3a52';
      ctx.fillRect(x, y, barWidth, barHeight);
    }
  }, [fitnessResults]);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold tracking-wider uppercase text-[#ff6b35] font-display">
        Statistics
      </h2>

      <div className="card p-3 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#94a3b8] font-mono">ALL-TIME BEST</span>
          <span className="text-sm font-bold text-[#00e5a0] font-mono">
            {bestScore.toFixed(0)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#94a3b8] font-mono">GEN BEST</span>
          <span className="text-sm font-bold text-[#ff6b35] font-mono">
            {history.length > 0
              ? history[history.length - 1].bestScore.toFixed(0)
              : '-'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#94a3b8] font-mono">GEN AVG</span>
          <span className="text-sm font-bold text-[#38bdf8] font-mono">
            {history.length > 0
              ? history[history.length - 1].avgScore.toFixed(0)
              : '-'}
          </span>
        </div>
      </div>

      <div className="card p-2">
        <div className="flex items-center justify-between mb-1 px-1">
          <span className="text-[10px] text-[#64748b] font-mono">FITNESS HISTORY</span>
          <div className="flex gap-2">
            <span className="flex items-center gap-1 text-[9px] text-[#00e5a0] font-mono">
              <span className="inline-block w-2 h-0.5 bg-[#00e5a0]"></span>BEST
            </span>
            <span className="flex items-center gap-1 text-[9px] text-[#38bdf8] font-mono">
              <span className="inline-block w-2 h-0.5 bg-[#38bdf8]"></span>AVG
            </span>
          </div>
        </div>
        <canvas
          ref={lineChartRef}
          className="w-full"
          style={{ height: '100px' }}
        />
      </div>

      <div className="card p-2">
        <div className="flex items-center justify-between mb-1 px-1">
          <span className="text-[10px] text-[#64748b] font-mono">GEN {generation} RANKING</span>
        </div>
        <canvas
          ref={barChartRef}
          className="w-full"
          style={{ height: '60px' }}
        />
      </div>
    </div>
  );
}
