import { Play, Pause, RotateCcw, Zap, ChevronRight, ChevronLeft } from 'lucide-react';
import { useSimStore } from '../store/simStore';
import { useState } from 'react';

export default function ControlPanel() {
  const { phase, generation, config, setConfig, initPopulation, setPhase, reset, genomes } = useSimStore();
  const [collapsed, setCollapsed] = useState(false);

  const canStart = phase === 'idle' && genomes.length > 0;
  const isRunning = phase === 'running';
  const isPaused = phase === 'paused';

  function handleStart() {
    if (phase === 'idle' && genomes.length === 0) {
      initPopulation();
      setTimeout(() => setPhase('running'), 100);
    } else if (canStart) {
      setPhase('running');
    }
  }

  function handlePauseResume() {
    if (isRunning) {
      setPhase('paused');
    } else if (isPaused) {
      setPhase('running');
    }
  }

  function handleReset() {
    reset();
  }

  function handleNewPopulation() {
    initPopulation();
  }

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-[#1a2235] border border-[#2d3a52] border-r-0 rounded-l-lg p-2 hover:bg-[#1f2b42] transition-colors"
      >
        <ChevronLeft size={16} className="text-[#94a3b8]" />
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 animate-slide-in">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wider uppercase text-[#00e5a0] font-display">
          Control
        </h2>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1 hover:bg-[#1f2b42] rounded transition-colors"
        >
          <ChevronRight size={14} className="text-[#64748b]" />
        </button>
      </div>

      <div className="card p-3 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#94a3b8] font-mono">GENERATION</span>
          <span className="text-lg font-bold text-[#00e5a0] font-mono">{generation}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#94a3b8] font-mono">PHASE</span>
          <span className={`text-xs font-mono font-medium ${
            phase === 'running' ? 'text-[#00e5a0] animate-pulse-glow' :
            phase === 'paused' ? 'text-[#ff6b35]' :
            phase === 'evaluating' ? 'text-[#38bdf8] animate-pulse-glow' :
            'text-[#94a3b8]'
          }`}>
            {phase.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="card p-3 space-y-3">
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs text-[#94a3b8] font-mono">POP SIZE</label>
            <span className="text-xs text-[#00e5a0] font-mono">{config.populationSize}</span>
          </div>
          <input
            type="range"
            min={5}
            max={40}
            step={1}
            value={config.populationSize}
            onChange={(e) => setConfig({ populationSize: Number(e.target.value) })}
            className="slider-track w-full"
            disabled={phase !== 'idle'}
          />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs text-[#94a3b8] font-mono">MUTATION</label>
            <span className="text-xs text-[#00e5a0] font-mono">{config.mutationRate.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0.05}
            max={0.8}
            step={0.05}
            value={config.mutationRate}
            onChange={(e) => setConfig({ mutationRate: Number(e.target.value) })}
            className="slider-track w-full"
          />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs text-[#94a3b8] font-mono">ELITE COUNT</label>
            <span className="text-xs text-[#00e5a0] font-mono">{config.eliteCount}</span>
          </div>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={config.eliteCount}
            onChange={(e) => setConfig({ eliteCount: Number(e.target.value) })}
            className="slider-track w-full"
            disabled={phase !== 'idle'}
          />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs text-[#94a3b8] font-mono">CROSSOVER</label>
            <span className="text-xs text-[#00e5a0] font-mono">{config.crossoverRate.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0.3}
            max={1.0}
            step={0.05}
            value={config.crossoverRate}
            onChange={(e) => setConfig({ crossoverRate: Number(e.target.value) })}
            className="slider-track w-full"
          />
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={handleStart}
          disabled={isRunning || phase === 'evaluating'}
          className="glow-button w-full py-2 px-3 rounded-lg text-sm font-mono font-medium flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Zap size={14} />
          {genomes.length === 0 ? 'INIT & START' : 'START'}
        </button>

        <button
          onClick={handlePauseResume}
          disabled={!isRunning && !isPaused}
          className="glow-button-orange w-full py-2 px-3 rounded-lg text-sm font-mono font-medium flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isRunning ? <Pause size={14} /> : <Play size={14} />}
          {isRunning ? 'PAUSE' : 'RESUME'}
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleNewPopulation}
            disabled={isRunning || phase === 'evaluating'}
            className="glow-button flex-1 py-2 px-3 rounded-lg text-xs font-mono flex items-center justify-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Zap size={12} />
            NEW POP
          </button>
          <button
            onClick={handleReset}
            className="glow-button-orange flex-1 py-2 px-3 rounded-lg text-xs font-mono flex items-center justify-center gap-1"
          >
            <RotateCcw size={12} />
            RESET
          </button>
        </div>
      </div>
    </div>
  );
}
