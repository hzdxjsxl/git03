import { useRef, useEffect } from 'react';
import { useSimStore } from '../store/simStore';
import type { Genome } from '../genetics';

function GenomePreview({ genome, size = 60 }: { genome: Genome; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, size, size);

    const verts = genome.bodyVertices;
    if (verts.length < 3) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const v of verts) {
      minX = Math.min(minX, v.x);
      maxX = Math.max(maxX, v.x);
      minY = Math.min(minY, v.y);
      maxY = Math.max(maxY, v.y);
    }

    const bw = maxX - minX || 1;
    const bh = maxY - minY || 1;
    const scale = (size * 0.6) / Math.max(bw, bh);
    const cx = size / 2;
    const cy = size / 2 - 4;

    ctx.beginPath();
    const centX = (minX + maxX) / 2;
    const centY = (minY + maxY) / 2;
    ctx.moveTo(cx + (verts[0].x - centX) * scale, cy + (verts[0].y - centY) * scale);
    for (let i = 1; i < verts.length; i++) {
      ctx.lineTo(cx + (verts[i].x - centX) * scale, cy + (verts[i].y - centY) * scale);
    }
    ctx.closePath();
    ctx.fillStyle = genome.color + '88';
    ctx.fill();
    ctx.strokeStyle = genome.color;
    ctx.lineWidth = 1;
    ctx.stroke();

    for (const wheel of genome.wheels) {
      const wx = cx + (wheel.position * bw - bw / 2) * scale;
      const wy = cy + (bh / 2) * scale + wheel.radius * scale * 0.5;
      const wr = wheel.radius * scale * 0.5;

      ctx.beginPath();
      ctx.arc(wx, wy, wr, 0, Math.PI * 2);
      ctx.fillStyle = '#1a1a2e';
      ctx.fill();
      ctx.strokeStyle = genome.color;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [genome, size]);

  return <canvas ref={canvasRef} style={{ width: size, height: size }} />;
}

export default function CarDetail() {
  const { bestGenome, fitnessResults, genomes, selectedCarId } = useSimStore();

  const displayGenome: Genome | null =
    genomes.find((g) => g.id === selectedCarId) ?? bestGenome;

  const displayFitness =
    displayGenome
      ? fitnessResults.find((r) => r.genomeId === displayGenome.id)
      : null;

  if (!displayGenome) {
    return (
      <div className="card p-3 text-center">
        <span className="text-xs text-[#64748b] font-mono">NO CAR SELECTED</span>
      </div>
    );
  }

  return (
    <div className="card p-3 animate-slide-in">
      <h3 className="text-xs font-semibold tracking-wider uppercase text-[#38bdf8] font-display mb-2">
        Car Detail
      </h3>

      <div className="flex gap-3 mb-3">
        <GenomePreview genome={displayGenome} size={64} />
        <div className="flex-1 space-y-0.5">
          <div className="text-[10px] font-mono text-[#64748b]">
            ID: <span className="text-[#94a3b8]">{displayGenome.id}</span>
          </div>
          {displayFitness && (
            <>
              <div className="text-[10px] font-mono text-[#64748b]">
                SCORE: <span className="text-[#00e5a0]">{displayFitness.score.toFixed(0)}</span>
              </div>
              <div className="text-[10px] font-mono text-[#64748b]">
                DIST: <span className="text-[#ff6b35]">{displayFitness.distance.toFixed(0)}px</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-[10px] font-mono text-[#64748b]">
          VERTICES: <span className="text-[#94a3b8]">{displayGenome.bodyVertices.length}</span>
        </div>
        <div className="text-[10px] font-mono text-[#64748b]">
          WHEELS: <span className="text-[#94a3b8]">{displayGenome.wheels.length}</span>
        </div>
        {displayGenome.wheels.map((w, i) => (
          <div key={i} className="text-[9px] font-mono text-[#64748b] pl-2">
            W{i}: r={<span className="text-[#38bdf8]">{w.radius.toFixed(1)}</span>} spd={<span className="text-[#38bdf8]">{w.motorSpeed.toFixed(2)}</span>}
          </div>
        ))}
        <div className="text-[10px] font-mono text-[#64748b]">
          DENSITY: <span className="text-[#94a3b8]">{displayGenome.density.toFixed(4)}</span>
        </div>
        <div className="text-[10px] font-mono text-[#64748b]">
          FRICTION: <span className="text-[#94a3b8]">{displayGenome.friction.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
