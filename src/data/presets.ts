import type { RockModel } from '@/utils/waveSolver';
import { homogeneousModel, layeredModel, faultModel, gradientModel } from './rockLayers';

export interface Preset {
  id: string;
  name: string;
  description: string;
  rockModel: RockModel;
  defaultSource: { x: number; y: number; z: number };
  defaultMagnitude: number;
}

export const presets: Preset[] = [
  {
    id: 'homogeneous',
    name: '均质岩层',
    description: '单一均匀介质，观察波在无界均质介质中的球面扩散',
    rockModel: homogeneousModel,
    defaultSource: { x: 50, y: 50, z: 50 },
    defaultMagnitude: 5.0,
  },
  {
    id: 'layered',
    name: '水平分层',
    description: '典型沉积地层结构，观察波在岩层分界面的折射和反射',
    rockModel: layeredModel,
    defaultSource: { x: 50, y: 50, z: 20 },
    defaultMagnitude: 6.0,
  },
  {
    id: 'fault',
    name: '断层构造',
    description: '包含断层破碎带，观察波在复杂地质构造中的传播路径',
    rockModel: faultModel,
    defaultSource: { x: 50, y: 50, z: 45 },
    defaultMagnitude: 7.0,
  },
  {
    id: 'gradient',
    name: '速度梯度',
    description: '波速随深度逐渐增加，观察波的弯曲传播路径',
    rockModel: gradientModel,
    defaultSource: { x: 50, y: 50, z: 10 },
    defaultMagnitude: 5.5,
  },
];
