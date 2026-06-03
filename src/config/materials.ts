import { MaterialConfig } from '@/types';

export const MATERIALS: MaterialConfig[] = [
  {
    id: 'fabric-beige',
    name: '米白布艺',
    color: '#f5f0e8',
    roughness: 0.9,
    metalness: 0.0,
  },
  {
    id: 'fabric-gray',
    name: '灰色布艺',
    color: '#8a8d91',
    roughness: 0.85,
    metalness: 0.0,
  },
  {
    id: 'fabric-navy',
    name: '藏青布艺',
    color: '#1e3a5f',
    roughness: 0.9,
    metalness: 0.0,
  },
  {
    id: 'fabric-terracotta',
    name: '陶土布艺',
    color: '#c4784a',
    roughness: 0.85,
    metalness: 0.0,
  },
  {
    id: 'fabric-emerald',
    name: '祖母绿',
    color: '#2d5a4a',
    roughness: 0.9,
    metalness: 0.0,
  },
  {
    id: 'leather-black',
    name: '黑色皮革',
    color: '#1a1a1a',
    roughness: 0.4,
    metalness: 0.1,
  },
  {
    id: 'leather-brown',
    name: '棕色皮革',
    color: '#5c3d2e',
    roughness: 0.45,
    metalness: 0.1,
  },
  {
    id: 'wood-light',
    name: '浅色木纹',
    color: '#d4c4a8',
    roughness: 0.7,
    metalness: 0.0,
  },
  {
    id: 'wood-dark',
    name: '深色木纹',
    color: '#5c4033',
    roughness: 0.75,
    metalness: 0.0,
  },
  {
    id: 'metal-brushed',
    name: '拉丝金属',
    color: '#c0c0c0',
    roughness: 0.3,
    metalness: 0.9,
  },
  {
    id: 'metal-gold',
    name: '金色金属',
    color: '#d4af37',
    roughness: 0.2,
    metalness: 0.95,
  },
  {
    id: 'marble-white',
    name: '白色大理石',
    color: '#f5f5f5',
    roughness: 0.2,
    metalness: 0.0,
  },
  {
    id: 'glass-clear',
    name: '透明玻璃',
    color: '#e8f4f8',
    roughness: 0.05,
    metalness: 0.0,
  },
];

export const getMaterialById = (id: string): MaterialConfig | undefined => {
  return MATERIALS.find(m => m.id === id);
};
