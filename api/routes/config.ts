import express, { type Request, type Response } from 'express';

const router = express.Router();

const FURNITURE_CONFIG = [
  {
    id: 'sofa-3seater',
    name: '三人沙发',
    category: 'sofa',
    defaultMaterialId: 'fabric-gray',
    availableMaterials: ['fabric-beige', 'fabric-gray', 'fabric-navy', 'fabric-terracotta', 'fabric-emerald', 'leather-black', 'leather-brown'],
    boundingBox: { width: 2.2, depth: 0.9, height: 0.85 },
  },
  {
    id: 'sofa-2seater',
    name: '双人沙发',
    category: 'sofa',
    defaultMaterialId: 'fabric-beige',
    availableMaterials: ['fabric-beige', 'fabric-gray', 'fabric-navy', 'fabric-terracotta', 'leather-black'],
    boundingBox: { width: 1.6, depth: 0.85, height: 0.8 },
  },
  {
    id: 'sofa-lounge',
    name: '贵妃椅',
    category: 'sofa',
    defaultMaterialId: 'fabric-emerald',
    availableMaterials: ['fabric-emerald', 'fabric-navy', 'leather-brown'],
    boundingBox: { width: 0.9, depth: 1.8, height: 0.8 },
  },
  {
    id: 'chair-dining',
    name: '餐椅',
    category: 'chair',
    defaultMaterialId: 'wood-light',
    availableMaterials: ['wood-light', 'wood-dark', 'fabric-gray', 'fabric-beige'],
    boundingBox: { width: 0.5, depth: 0.5, height: 0.9 },
  },
  {
    id: 'chair-armchair',
    name: '扶手椅',
    category: 'chair',
    defaultMaterialId: 'fabric-terracotta',
    availableMaterials: ['fabric-terracotta', 'fabric-navy', 'leather-black', 'leather-brown'],
    boundingBox: { width: 0.75, depth: 0.8, height: 0.95 },
  },
  {
    id: 'chair-office',
    name: '办公椅',
    category: 'chair',
    defaultMaterialId: 'leather-black',
    availableMaterials: ['leather-black', 'fabric-gray', 'metal-brushed'],
    boundingBox: { width: 0.65, depth: 0.65, height: 1.1 },
  },
  {
    id: 'table-coffee',
    name: '茶几',
    category: 'table',
    defaultMaterialId: 'wood-light',
    availableMaterials: ['wood-light', 'wood-dark', 'marble-white', 'metal-gold'],
    boundingBox: { width: 1.2, depth: 0.6, height: 0.45 },
  },
  {
    id: 'table-dining',
    name: '餐桌',
    category: 'table',
    defaultMaterialId: 'wood-dark',
    availableMaterials: ['wood-dark', 'wood-light', 'marble-white', 'glass-clear'],
    boundingBox: { width: 1.8, depth: 0.9, height: 0.75 },
  },
  {
    id: 'table-side',
    name: '边桌',
    category: 'table',
    defaultMaterialId: 'metal-gold',
    availableMaterials: ['metal-gold', 'metal-brushed', 'wood-light', 'marble-white'],
    boundingBox: { width: 0.5, depth: 0.5, height: 0.55 },
  },
  {
    id: 'bed-double',
    name: '双人床',
    category: 'bed',
    defaultMaterialId: 'fabric-gray',
    availableMaterials: ['fabric-gray', 'fabric-beige', 'leather-brown', 'wood-light'],
    boundingBox: { width: 1.8, depth: 2.0, height: 0.5 },
  },
  {
    id: 'bed-single',
    name: '单人床',
    category: 'bed',
    defaultMaterialId: 'wood-light',
    availableMaterials: ['wood-light', 'wood-dark', 'fabric-gray'],
    boundingBox: { width: 1.2, depth: 2.0, height: 0.45 },
  },
  {
    id: 'lamp-floor',
    name: '落地灯',
    category: 'lamp',
    defaultMaterialId: 'metal-gold',
    availableMaterials: ['metal-gold', 'metal-brushed', 'wood-dark'],
    boundingBox: { width: 0.4, depth: 0.4, height: 1.6 },
  },
  {
    id: 'lamp-table',
    name: '台灯',
    category: 'lamp',
    defaultMaterialId: 'metal-brushed',
    availableMaterials: ['metal-brushed', 'metal-gold', 'glass-clear'],
    boundingBox: { width: 0.25, depth: 0.25, height: 0.5 },
  },
  {
    id: 'decor-plant',
    name: '绿植盆栽',
    category: 'decoration',
    defaultMaterialId: 'wood-light',
    availableMaterials: ['wood-light', 'marble-white'],
    boundingBox: { width: 0.4, depth: 0.4, height: 0.8 },
  },
  {
    id: 'decor-vase',
    name: '装饰花瓶',
    category: 'decoration',
    defaultMaterialId: 'marble-white',
    availableMaterials: ['marble-white', 'metal-gold', 'glass-clear'],
    boundingBox: { width: 0.2, depth: 0.2, height: 0.4 },
  },
  {
    id: 'decor-rug',
    name: '地毯',
    category: 'decoration',
    defaultMaterialId: 'fabric-beige',
    availableMaterials: ['fabric-beige', 'fabric-gray', 'fabric-terracotta'],
    boundingBox: { width: 2.0, depth: 1.4, height: 0.02 },
  },
];

const MATERIALS_CONFIG = [
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

router.get('/furniture', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: FURNITURE_CONFIG,
  });
});

router.get('/materials', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: MATERIALS_CONFIG,
  });
});

router.get('/furniture/:id', (req: Request, res: Response) => {
  const item = FURNITURE_CONFIG.find(f => f.id === req.params.id);
  if (item) {
    res.json({
      success: true,
      data: item,
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Furniture not found',
    });
  }
});

export default router;
