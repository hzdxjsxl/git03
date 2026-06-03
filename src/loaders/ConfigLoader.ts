import { FurnitureItem, MaterialConfig } from '@/types';

export class ConfigLoader {
  private static furnitureCache: FurnitureItem[] | null = null;
  private static materialsCache: MaterialConfig[] | null = null;

  static async loadFurniture(): Promise<FurnitureItem[]> {
    if (this.furnitureCache) {
      return this.furnitureCache;
    }

    try {
      const response = await fetch('/api/config/furniture');
      const result = await response.json();
      if (result.success) {
        this.furnitureCache = result.data;
        return result.data;
      }
      throw new Error('Failed to load furniture config');
    } catch (error) {
      console.warn('Using fallback furniture config:', error);
      return this.getFallbackFurniture();
    }
  }

  static async loadMaterials(): Promise<MaterialConfig[]> {
    if (this.materialsCache) {
      return this.materialsCache;
    }

    try {
      const response = await fetch('/api/config/materials');
      const result = await response.json();
      if (result.success) {
        this.materialsCache = result.data;
        return result.data;
      }
      throw new Error('Failed to load materials config');
    } catch (error) {
      console.warn('Using fallback materials config:', error);
      return this.getFallbackMaterials();
    }
  }

  static async loadFurnitureById(id: string): Promise<FurnitureItem | null> {
    const furniture = await this.loadFurniture();
    return furniture.find(f => f.id === id) || null;
  }

  static async loadMaterialById(id: string): Promise<MaterialConfig | null> {
    const materials = await this.loadMaterials();
    return materials.find(m => m.id === id) || null;
  }

  private static getFallbackFurniture(): FurnitureItem[] {
    return [
      {
        id: 'sofa-3seater',
        name: '三人沙发',
        category: 'sofa',
        defaultMaterialId: 'fabric-gray',
        availableMaterials: ['fabric-beige', 'fabric-gray', 'fabric-navy'],
        boundingBox: { width: 2.2, depth: 0.9, height: 0.85 },
        geometryType: 'custom',
        geometryParams: {},
      },
    ];
  }

  private static getFallbackMaterials(): MaterialConfig[] {
    return [
      {
        id: 'fabric-gray',
        name: '灰色布艺',
        color: '#8a8d91',
        roughness: 0.85,
        metalness: 0.0,
      },
    ];
  }

  static clearCache(): void {
    this.furnitureCache = null;
    this.materialsCache = null;
  }
}
