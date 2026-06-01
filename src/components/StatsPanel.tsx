import { useRef, useEffect, useMemo } from 'react';
import { useSimStore } from '../store/simStore';
import { rankByFitness } from '../genetics';
import type { LiveRankingEntry } from '../store/simStore';

export default function StatsPanel() {
  const {
    history,
    fitnessResults,
    generation,
    bestScore,
    liveBestDistance,
    liveAvgDistance,
    liveBestScore,
    liveRankings,
    phase,
    elapsed,
  } = useSimStore();

  const lineChartRef = useRef<HTMLCanvasElement>(null);
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const rankingRef = useRef<HTMLDivElement>(null);

  const formatNum = (n: number) => (n > 0 ? n.toFixed(0) : '0');

  useEffect(() => {
    const canvas = lineChartRef.current;
    if (!canvas || history.length < 1) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
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
    const denom = Math.max(history.length - 1, 1);

    for (let i = 0; i < history.length; i++) {
      const x = padding.left + (chartW * i) / denom;
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
    } else if (avgPoints.length === 1) {
      ctx.beginPath();
      ctx.arc(avgPoints[0].x, avgPoints[0].y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf866';
      ctx.fill();
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
    } else if (bestPoints.length === 1) {
      ctx.beginPath();
      ctx.arc(bestPoints[0].x, bestPoints[0].y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#00e5a0';
      ctx.fill();
    }

    ctx.font = '8px "JetBrains Mono"';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    const step = Math.max(1, Math.floor(history.length / 6));
    for (let i = 0; i < history.length; i += step) {
      const x = padding.left + (chartW * i) / denom;
      ctx.fillText(`${history[i].generation}`, x, h - 4);
    }
    if (history.length > 1) {
      const lastIdx = history.length - 1;
      const x = padding.left + (chartW * lastIdx) / denom;
      ctx.fillText(`${history[lastIdx].generation}`, x, h - 4);
    }
  }, [history]);

  useEffect(() => {
    const canvas = barChartRef.current;
    if (!canvas || fitnessResults.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
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

  const secDisplay = useMemo(
    () => (elapsed > 0 ? (elapsed / 1000).toFixed(1) : '0.0'),
    [elapsed]
  );

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold tracking-wider uppercase text-[#ff6b35] font-display">
        TELEMETRY
      </h2>

      <div className="card p-2 space-y-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-[#64748b] font-mono">GEN</span>
          <span className="text-[10px] text-[#94a3b8] font-mono flex items-center gap-2">
            <span className="text-[#00e5a0]">#{generation}</span>
            <span className="text-[#38bdf8]">{secDisplay}s</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                phase === 'running'
                  ? 'bg-[#00e5a0] animate-pulse'
                  : phase === 'paused'
                  ? 'bg-[#ff6b35]'
                  : 'bg-[#64748b]'
              }`}
            ></span>
          </span>
        </div>
      </div>

      <div className="card p-2 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-[#64748b] font-mono">LIVE LEAD</span>
          <span className="text-sm font-bold text-[#00e5a0] font-mono">
            {formatNum(liveBestDistance)}px
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-[#64748b] font-mono">LIVE AVG</span>
          <span className="text-sm font-bold text-[#38bdf8] font-mono">
            {formatNum(liveAvgDistance)}px
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-[#64748b] font-mono">LIVE SCORE</span>
          <span className="text-sm font-bold text-[#ff6b35] font-mono">
            {formatNum(liveBestScore)}
          </span>
        </div>
        <div className="h-px bg-[#2d3a52] my-1"></div>
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-[#64748b] font-mono">ALL-TIME BEST</span>
          <span className="text-sm font-bold text-[#00e5a0] font-mono">
            {formatNum(bestScore)}
          </span>
        </div>
      </div>

      <div className="card p-2">
        <div className="flex items-center justify-between mb-1 px-0.5">
          <span className="text-[9px] text-[#64748b] font-mono tracking-wider">
            FITNESS HISTORY
          </span>
          <div className="flex gap-2">
            <span className="flex items-center gap-1 text-[8px] text-[#00e5a0] font-mono">
              <span className="inline-block w-2 h-0.5 bg-[#00e5a0]"></span>BEST
            </span>
            <span className="flex items-center gap-1 text-[8px] text-[#38bdf8] font-mono">
              <span className="inline-block w-2 h-0.5 bg-[#38bdf8]"></span>AVG
            </span>
          </div>
        </div>
        <canvas
          ref={lineChartRef}
          className="w-full"
          style={{ height: '90px' }}
        />
      </div>

      <div className="card p-2">
        <div className="flex items-center justify-between mb-1 px-0.5">
          <span className="text-[9px] text-[#64748b] font-mono tracking-wider">
            FINAL RANKING
          </span>
          <span className="text-[8px] text-[#ff6b35] font-mono">
            GEN {Math.max(1, generation)}
          </span>
        </div>
        <canvas
          ref={barChartRef}
          className="w-full"
          style={{ height: '45px' }}
        />
      </div>

      <div className="card p-2" ref={rankingRef}>
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span className="text-[9px] text-[#64748b] font-mono tracking-wider">
            LIVE TOP 5
          </span>
          <span
            className={`text-[8px] font-mono ${
              phase === 'running'
                ? 'text-[#00e5a0] animate-pulse'
                : 'text-[#64748b]'
            }`}
          >
            {phase === 'running' ? 'UPDATING' : 'IDLE'}
          </span>
        </div>
        <div className="space-y-1">
          {liveRankings.length === 0 ? (
            <div className="text-center py-2">
              <span className="text-[9px] text-[#64748b] font-mono">
                WAITING FOR RACE START...
              </span>
            </div>
          ) : (
            liveRankings.map((entry) => (
              <RankingRow key={entry.genomeId} entry={entry} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function RankingRow({ entry }: { entry: LiveRankingEntry }) {
  const { selectCar, selectedCarId } = useSimStore();
  const isSelected = selectedCarId === entry.genomeId;

  return (
    <div
      onClick={() => selectCar(entry.genomeId)}
      className={`flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition-colors ${
        isSelected
          ? 'bg-[#1f2b42] border border-[#00e5a066]'
          : 'hover:bg-[#1a2235] border border-transparent'
      }`}
    >
      <span
        className={`w-4 h-4 flex items-center justify-center rounded text-[7px] font-mono font-bold ${
          entry.rank === 1
            ? 'bg-[#00e5a0] text-[#0a0e17]'
            : entry.rank === 2
            ? 'bg-[#38bdf8] text-[#0a0e17]'
            : entry.rank === 3
            ? 'bg-[#ff6b35] text-[#0a0e17]'
            : 'bg-[#2d3a52] text-[#94a3b8]'
        }`}
      >
        {entry.rank}
      </span>

      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: entry.color }}
      ></div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span
            className={`text-[9px] font-mono truncate ${
              entry.isStuck ? 'text-[#64748b] line-through' : 'text-[#e2e8f0]'
            }`}
          >
            {entry.genomeId.slice(2, 8)}
          </span>
          <span className="text-[9px] font-mono text-[#00e5a0]">
            {entry.distance.toFixed(0)}px
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[7px] text-[#64748b] font-mono">
            SCORE {entry.score.toFixed(0)}
          </span>
          <span className="text-[7px] text-[#64748b] font-mono">
            W{entry.wheelCount}
          </span>
          {entry.isStuck && (
            <span className="text-[7px] text-[#ff6b35] font-mono">STUCK</span>
          )}
        </div>
      </div>
    </div>
  );
}
