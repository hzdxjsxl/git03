import React from 'react';
import { useSimulationStore } from '@/store/useSimulationStore';

const InfoPanel: React.FC = () => {
  const {
    currentTime,
    pWaveMaxDistance,
    sWaveMaxDistance,
    rockModel,
    sourcePosition,
  } = useSimulationStore();

  const depth = (sourcePosition.z / 100) * rockModel.size.z;
  let currentLayer = rockModel.layers[0];
  for (const layer of rockModel.layers) {
    if (depth >= layer.depth[0] && depth < layer.depth[1]) {
      currentLayer = layer;
      break;
    }
  }

  const vp = currentLayer.pWaveVelocity;
  const vs = currentLayer.sWaveVelocity;
  const vpVsRatio = vp / vs;

  const dataItems = [
    {
      label: '模拟时间',
      value: currentTime.toFixed(2),
      unit: 's',
      color: 'text-white',
    },
    {
      label: 'P波传播距离',
      value: pWaveMaxDistance.toFixed(1),
      unit: 'm',
      color: 'text-[#ff6b35]',
    },
    {
      label: 'S波传播距离',
      value: sWaveMaxDistance.toFixed(1),
      unit: 'm',
      color: 'text-[#00d4ff]',
    },
    {
      label: 'P波速度',
      value: vp.toFixed(0),
      unit: 'm/s',
      color: 'text-[#ff6b35]',
    },
    {
      label: 'S波速度',
      value: vs.toFixed(0),
      unit: 'm/s',
      color: 'text-[#00d4ff]',
    },
    {
      label: '波速比 Vp/Vs',
      value: vpVsRatio.toFixed(2),
      unit: '',
      color: 'text-emerald-400',
    },
  ];

  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-4 px-6 py-4 rounded-xl bg-[rgba(10,22,40,0.85)] backdrop-blur-md border border-cyan-400/20">
      <div className="flex items-center gap-8">
        {dataItems.map((item, index) => (
          <div key={index} className="text-center">
            <div className="text-xs text-slate-400 mb-1">{item.label}</div>
            <div className={`font-orbitron text-lg font-semibold ${item.color}`}>
              {item.value}
              <span className="text-xs ml-1 text-slate-500">{item.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfoPanel;
