export type FurnitureCategory = 'sofa' | 'chair' | 'table' | 'bed' | 'decoration' | 'lamp';

export interface MaterialConfig {
  id: string;
  name: string;
  color: string;
  roughness: number;
  metalness: number;
  normalScale?: number;
}

export interface FurnitureItem {
  id: string;
  name: string;
  category: FurnitureCategory;
  defaultMaterialId: string;
  availableMaterials: string[];
  boundingBox: { width: number; depth: number; height: number };
  geometryType: 'box' | 'cylinder' | 'cone' | 'sphere' | 'custom';
  geometryParams: Record<string, number>;
}

export interface PlacedFurniture {
  instanceId: string;
  furnitureId: string;
  position: [number, number, number];
  rotation: [number, number, number];
  materialId: string;
  scale: number;
}

export interface SceneState {
  placedItems: PlacedFurniture[];
  selectedItemId: string | null;
  isDragging: boolean;
  dragFurnitureId: string | null;
}

export interface SceneActions {
  addFurniture: (item: PlacedFurniture) => void;
  removeFurniture: (instanceId: string) => void;
  updateFurniture: (instanceId: string, updates: Partial<PlacedFurniture>) => void;
  selectItem: (instanceId: string | null) => void;
  setDragging: (isDragging: boolean, furnitureId?: string) => void;
  clearScene: () => void;
}

export const CATEGORY_LABELS: Record<FurnitureCategory, string> = {
  sofa: '沙发',
  chair: '椅子',
  table: '桌子',
  bed: '床',
  decoration: '装饰',
  lamp: '灯具',
};
