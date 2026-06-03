import type { RockLayer, RockModel } from '@/utils/waveSolver';

export const defaultRockLayers: RockLayer[] = [
  {
    id: 'soil',
    name: '表土层',
    depth: [0, 10],
    density: 1800,
    pWaveVelocity: 2000,
    sWaveVelocity: 800,
    color: '#8B7355',
  },
  {
    id: 'sedimentary',
    name: '沉积岩层',
    depth: [10, 30],
    density: 2400,
    pWaveVelocity: 3500,
    sWaveVelocity: 1800,
    color: '#A0522D',
  },
  {
    id: 'granite',
    name: '花岗岩层',
    depth: [30, 60],
    density: 2700,
    pWaveVelocity: 5500,
    sWaveVelocity: 3000,
    color: '#696969',
  },
  {
    id: 'basement',
    name: '基岩层',
    depth: [60, 100],
    density: 3000,
    pWaveVelocity: 6500,
    sWaveVelocity: 3600,
    color: '#2F4F4F',
  },
];

export const homogeneousModel: RockModel = {
  layers: [
    {
      id: 'homogeneous',
      name: '均质岩层',
      depth: [0, 100],
      density: 2600,
      pWaveVelocity: 5000,
      sWaveVelocity: 2800,
      color: '#708090',
    },
  ],
  size: { x: 100, y: 100, z: 100 },
};

export const layeredModel: RockModel = {
  layers: defaultRockLayers,
  size: { x: 100, y: 100, z: 100 },
};

export const faultModel: RockModel = {
  layers: [
    {
      id: 'upper',
      name: '上盘岩层',
      depth: [0, 40],
      density: 2400,
      pWaveVelocity: 4000,
      sWaveVelocity: 2200,
      color: '#CD853F',
    },
    {
      id: 'fault-zone',
      name: '断层破碎带',
      depth: [40, 50],
      density: 2000,
      pWaveVelocity: 2500,
      sWaveVelocity: 1000,
      color: '#8B4513',
    },
    {
      id: 'lower',
      name: '下盘岩层',
      depth: [50, 100],
      density: 2800,
      pWaveVelocity: 6000,
      sWaveVelocity: 3300,
      color: '#4A4A4A',
    },
  ],
  size: { x: 100, y: 100, z: 100 },
};

export const gradientModel: RockModel = {
  layers: [
    {
      id: 'layer1',
      name: '浅层',
      depth: [0, 20],
      density: 2000,
      pWaveVelocity: 3000,
      sWaveVelocity: 1500,
      color: '#DEB887',
    },
    {
      id: 'layer2',
      name: '中层1',
      depth: [20, 40],
      density: 2300,
      pWaveVelocity: 4000,
      sWaveVelocity: 2000,
      color: '#D2691E',
    },
    {
      id: 'layer3',
      name: '中层2',
      depth: [40, 60],
      density: 2500,
      pWaveVelocity: 4800,
      sWaveVelocity: 2500,
      color: '#8B4513',
    },
    {
      id: 'layer4',
      name: '中层3',
      depth: [60, 80],
      density: 2700,
      pWaveVelocity: 5500,
      sWaveVelocity: 3000,
      color: '#654321',
    },
    {
      id: 'layer5',
      name: '深层',
      depth: [80, 100],
      density: 2900,
      pWaveVelocity: 6200,
      sWaveVelocity: 3400,
      color: '#3D3D3D',
    },
  ],
  size: { x: 100, y: 100, z: 100 },
};
