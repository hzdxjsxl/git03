import { useAppStore } from '../store/useAppStore';
import { Settings, Eye, EyeOff, ChevronRight, ChevronLeft } from 'lucide-react';
import { useState } from 'react';

export default function ControlPanel() {
  const { renderParams, setRenderParams, panelOpen, setPanelOpen } = useAppStore();
  const [activeTab, setActiveTab] = useState<'render' | 'sort'>('render');

  const sliders: {
    key: keyof typeof renderParams;
    label: string;
    min: number;
    max: number;
    step: number;
  }[] = [
    { key: 'pointSize', label: '点大小', min: 1, max: 30, step: 0.5 },
    { key: 'sigma', label: '高斯衰减', min: 0.1, max: 1.0, step: 0.05 },
    { key: 'alphaThreshold', label: 'Alpha阈值', min: 0.001, max: 0.1, step: 0.005 },
    { key: 'brightness', label: '亮度', min: 0.2, max: 3.0, step: 0.1 },
  ];

  const sortSliders: {
    key: keyof typeof renderParams;
    label: string;
    min: number;
    max: number;
    step: number;
  }[] = [
    { key: 'sortInterval', label: '排序间隔(帧)', min: 1, max: 10, step: 1 },
  ];

  return (
    <>
      <button
        onClick={() => setPanelOpen(!panelOpen)}
        className="absolute top-4 right-4 z-30 p-2 rounded-lg transition-all duration-300"
        style={{
          background: 'rgba(10, 14, 23, 0.85)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          color: '#00d4ff',
          right: panelOpen ? 'calc(280px + 16px)' : '16px',
        }}
      >
        {panelOpen ? <ChevronRight size={18} /> : <Settings size={18} />}
      </button>

      <div
        className="absolute top-4 right-4 z-20 h-[calc(100vh-32px)] transition-all duration-300 overflow-hidden"
        style={{
          width: panelOpen ? 260 : 0,
          opacity: panelOpen ? 1 : 0,
        }}
      >
        <div
          className="h-full rounded-lg overflow-y-auto"
          style={{
            background: 'rgba(10, 14, 23, 0.92)',
            border: '1px solid rgba(0, 212, 255, 0.15)',
            backdropFilter: 'blur(12px)',
            minWidth: 260,
          }}
        >
          <div className="p-4">
            <h2
              className="text-xs uppercase tracking-widest mb-4"
              style={{
                color: '#00d4ff',
                fontFamily: "'Space Grotesk', sans-serif",
                borderBottom: '1px solid rgba(0, 212, 255, 0.15)',
                paddingBottom: 8,
              }}
            >
              渲染控制
            </h2>

            <div className="flex gap-1 mb-4">
              <button
                onClick={() => setActiveTab('render')}
                className="flex-1 py-1.5 text-xs rounded transition-all"
                style={{
                  background: activeTab === 'render' ? 'rgba(0, 212, 255, 0.15)' : 'transparent',
                  color: activeTab === 'render' ? '#00d4ff' : 'rgba(255,255,255,0.4)',
                  border: `1px solid ${activeTab === 'render' ? 'rgba(0, 212, 255, 0.3)' : 'transparent'}`,
                }}
              >
                渲染
              </button>
              <button
                onClick={() => setActiveTab('sort')}
                className="flex-1 py-1.5 text-xs rounded transition-all"
                style={{
                  background: activeTab === 'sort' ? 'rgba(0, 212, 255, 0.15)' : 'transparent',
                  color: activeTab === 'sort' ? '#00d4ff' : 'rgba(255,255,255,0.4)',
                  border: `1px solid ${activeTab === 'sort' ? 'rgba(0, 212, 255, 0.3)' : 'transparent'}`,
                }}
              >
                排序
              </button>
            </div>

            {activeTab === 'render' && (
              <div className="space-y-4">
                {sliders.map((slider) => (
                  <div key={slider.key}>
                    <div className="flex justify-between items-center mb-1">
                      <label
                        className="text-[11px]"
                        style={{
                          color: 'rgba(255,255,255,0.6)',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {slider.label}
                      </label>
                      <span
                        className="text-[11px] font-bold"
                        style={{
                          color: '#00ff88',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {(renderParams[slider.key] as number).toFixed(slider.step < 1 ? 2 : 0)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={slider.min}
                      max={slider.max}
                      step={slider.step}
                      value={renderParams[slider.key] as number}
                      onChange={(e) =>
                        setRenderParams({ [slider.key]: parseFloat(e.target.value) })
                      }
                      className="w-full h-1 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #00d4ff ${(((renderParams[slider.key] as number) - slider.min) / (slider.max - slider.min)) * 100}%, rgba(255,255,255,0.1) ${(((renderParams[slider.key] as number) - slider.min) / (slider.max - slider.min)) * 100}%)`,
                      }}
                    />
                  </div>
                ))}

                <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span
                    className="text-[11px]"
                    style={{
                      color: 'rgba(255,255,255,0.6)',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    显示法向
                  </span>
                  <button
                    onClick={() => setRenderParams({ showNormals: !renderParams.showNormals })}
                    className="p-1 rounded transition-all"
                    style={{
                      color: renderParams.showNormals ? '#00d4ff' : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    {renderParams.showNormals ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'sort' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span
                    className="text-[11px]"
                    style={{
                      color: 'rgba(255,255,255,0.6)',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    深度排序
                  </span>
                  <button
                    onClick={() => setRenderParams({ sortEnabled: !renderParams.sortEnabled })}
                    className="px-2 py-0.5 text-[10px] rounded transition-all"
                    style={{
                      background: renderParams.sortEnabled ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 107, 53, 0.15)',
                      color: renderParams.sortEnabled ? '#00ff88' : '#ff6b35',
                      border: `1px solid ${renderParams.sortEnabled ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 107, 53, 0.3)'}`,
                    }}
                  >
                    {renderParams.sortEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                {sortSliders.map((slider) => (
                  <div key={slider.key}>
                    <div className="flex justify-between items-center mb-1">
                      <label
                        className="text-[11px]"
                        style={{
                          color: 'rgba(255,255,255,0.6)',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {slider.label}
                      </label>
                      <span
                        className="text-[11px] font-bold"
                        style={{
                          color: '#00ff88',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {renderParams[slider.key]}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={slider.min}
                      max={slider.max}
                      step={slider.step}
                      value={renderParams[slider.key] as number}
                      onChange={(e) =>
                        setRenderParams({ [slider.key]: parseInt(e.target.value) })
                      }
                      className="w-full h-1 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #00d4ff ${(((renderParams[slider.key] as number) - slider.min) / (slider.max - slider.min)) * 100}%, rgba(255,255,255,0.1) ${(((renderParams[slider.key] as number) - slider.min) / (slider.max - slider.min)) * 100}%)`,
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
