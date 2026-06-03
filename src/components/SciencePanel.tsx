import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, BookOpen, Zap, Waves, GitBranch, Shield } from 'lucide-react';

const SciencePanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-xl bg-[rgba(10,22,40,0.85)] backdrop-blur-md border border-cyan-400/30 text-cyan-400 hover:bg-cyan-500/20 transition-all shadow-lg"
      >
        {isExpanded ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>

      <div
        className={`absolute left-0 top-0 bottom-0 w-96 bg-[rgba(10,22,40,0.95)] backdrop-blur-xl border-r border-cyan-400/20 transition-transform duration-300 ease-in-out z-10 overflow-y-auto ${
          isExpanded ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 pt-20 space-y-6">
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="w-7 h-7 text-cyan-400" />
            <h2 className="text-xl font-bold text-cyan-400">地震波科普</h2>
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-cyan-400 border-b border-cyan-400/20 pb-2 flex items-center gap-2">
              <Waves className="w-4 h-4" />
              波动方程
            </h3>
            <div className="bg-slate-800/50 rounded-lg p-4 font-mono text-sm space-y-2">
              <div className="text-orange-400">
                ∂²u/∂t² = Vp² ∇²u + f(x,t)
              </div>
              <div className="text-cyan-400">
                ∂²v/∂t² = Vs² ∇²v + g(x,t)
              </div>
              <div className="text-slate-400 text-xs mt-2">
                其中 Vp 为纵波速度，Vs 为横波速度，∇² 为拉普拉斯算子
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-cyan-400 border-b border-cyan-400/20 pb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              P 波（纵波）
            </h3>
            <div className="bg-slate-800/30 rounded-lg p-4 border-l-4 border-[#ff6b35]">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-[#ff6b35]"></span>
                <span className="text-[#ff6b35] font-medium">压缩波 · 速度快</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                P波（Primary Wave）是地震波中传播速度最快的波，属于纵波，质点振动方向与波的传播方向一致。
                它可以在固体、液体和气体中传播，速度约为5-7 km/s，通常约为S波速度的1.73倍。
              </p>
              <div className="mt-3 text-xs text-slate-400 font-mono">
                Vp = √[(λ + 2μ)/ρ]
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-cyan-400 border-b border-cyan-400/20 pb-2 flex items-center gap-2">
              <Waves className="w-4 h-4" />
              S 波（横波）
            </h3>
            <div className="bg-slate-800/30 rounded-lg p-4 border-l-4 border-[#00d4ff]">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-[#00d4ff]"></span>
                <span className="text-[#00d4ff] font-medium">剪切波 · 速度慢</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                S波（Secondary Wave）是横波，质点振动方向与波的传播方向垂直。
                它只能在固体中传播，速度约为3-4 km/s。S波是造成建筑物破坏的主要原因。
              </p>
              <div className="mt-3 text-xs text-slate-400 font-mono">
                Vs = √(μ/ρ)
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-cyan-400 border-b border-cyan-400/20 pb-2 flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              折射原理
            </h3>
            <div className="bg-slate-800/30 rounded-lg p-4">
              <h4 className="text-emerald-400 font-medium text-sm mb-2">斯涅尔定律（Snell's Law）</h4>
              <div className="font-mono text-center text-slate-300 my-3">
                sinθ₁ / V₁ = sinθ₂ / V₂
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                当地震波从一种岩层进入另一种岩层时，由于波速的变化，波的传播方向会发生改变。
                当入射角大于临界角时，会发生全反射现象。这是地震勘探中探测地下构造的基本原理。
              </p>
              <div className="mt-3 text-xs text-slate-400">
                临界角: θc = arcsin(V₁/V₂)
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-cyan-400 border-b border-cyan-400/20 pb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              防震小贴士
            </h3>
            <div className="space-y-3">
              <div className="bg-slate-800/30 rounded-lg p-3 flex gap-3">
                <span className="text-amber-400 font-bold text-lg">01</span>
                <div>
                  <h4 className="text-amber-300 font-medium text-sm">伏地、遮挡、手抓牢</h4>
                  <p className="text-slate-400 text-xs mt-1">
                    地震时立即蹲下，寻找坚固家具旁躲避，用手保护头部，抓住桌腿等牢固物体。
                  </p>
                </div>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-3 flex gap-3">
                <span className="text-amber-400 font-bold text-lg">02</span>
                <div>
                  <h4 className="text-amber-300 font-medium text-sm">远离危险物品</h4>
                  <p className="text-slate-400 text-xs mt-1">
                    避开玻璃窗、书架、高大家具等可能倒塌的物品，远离悬挂物。
                  </p>
                </div>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-3 flex gap-3">
                <span className="text-amber-400 font-bold text-lg">03</span>
                <div>
                  <h4 className="text-amber-300 font-medium text-sm">不要乘电梯</h4>
                  <p className="text-slate-400 text-xs mt-1">
                    地震时电梯可能断电或变形，应使用楼梯紧急疏散。
                  </p>
                </div>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-3 flex gap-3">
                <span className="text-amber-400 font-bold text-lg">04</span>
                <div>
                  <h4 className="text-amber-300 font-medium text-sm">户外远离建筑物</h4>
                  <p className="text-slate-400 text-xs mt-1">
                    在户外时远离高楼、电线杆、广告牌等，选择开阔地带避险。
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default SciencePanel;
