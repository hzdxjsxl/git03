import { useEffect } from 'react';
import { EarthScene } from '@/components/EarthScene';
import ControlPanel from '@/components/ControlPanel';
import InfoPanel from '@/components/InfoPanel';
import SciencePanel from '@/components/SciencePanel';
import { useSimulationStore } from '@/store/useSimulationStore';

export default function Home() {
  const initWaveField = useSimulationStore((state) => state.initWaveField);

  useEffect(() => {
    initWaveField();
  }, [initWaveField]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0a1628]">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-orange-400 font-orbitron tracking-wider">
          地震波传播三维可视化
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          纵波(P波) · 横波(S波) · 岩层折射
        </p>
      </div>

      <div className="w-full h-full">
        <EarthScene />
      </div>

      <ControlPanel />
      <InfoPanel />
      <SciencePanel />

      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-xs text-slate-500 pointer-events-none">
        拖拽旋转视角 · 滚轮缩放 · 点击右侧控制面板设置参数
      </div>
    </div>
  );
}