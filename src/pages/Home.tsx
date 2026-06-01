import SimCanvas from '../components/SimCanvas';
import ControlPanel from '../components/ControlPanel';
import StatsPanel from '../components/StatsPanel';
import CarDetail from '../components/CarDetail';

export default function Home() {
  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#0a0e17]">
      <div className="flex-1 relative">
        <SimCanvas />
        <div className="absolute top-3 left-3 pointer-events-none">
          <h1 className="font-display text-lg font-bold tracking-tight">
            <span className="text-[#00e5a0]">EVO</span>
            <span className="text-[#ff6b35]">CARS</span>
          </h1>
          <p className="text-[9px] font-mono text-[#64748b] tracking-widest mt-0.5">
            GENETIC ALGORITHM SANDBOX
          </p>
        </div>
      </div>

      <div className="w-[280px] flex flex-col border-l border-[#2d3a52] bg-[#111827] overflow-y-auto">
        <div className="p-3 flex flex-col gap-3 flex-1">
          <ControlPanel />
          <StatsPanel />
          <CarDetail />
        </div>

        <div className="p-2 border-t border-[#2d3a52]">
          <p className="text-[8px] font-mono text-[#64748b] text-center">
            MATTER.JS + GENETIC ALGORITHM • PURE FRONTEND
          </p>
        </div>
      </div>
    </div>
  );
}
