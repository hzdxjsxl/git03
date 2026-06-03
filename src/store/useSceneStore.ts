import { create } from 'zustand';
import { SceneState, SceneActions, PlacedFurniture } from '@/types';

type SceneStore = SceneState & SceneActions;

export const useSceneStore = create<SceneStore>((set) => ({
  placedItems: [],
  selectedItemId: null,
  isDragging: false,
  dragFurnitureId: null,

  addFurniture: (item: PlacedFurniture) =>
    set((state) => ({
      placedItems: [...state.placedItems, item],
      selectedItemId: item.instanceId,
    })),

  removeFurniture: (instanceId: string) =>
    set((state) => ({
      placedItems: state.placedItems.filter((i) => i.instanceId !== instanceId),
      selectedItemId: state.selectedItemId === instanceId ? null : state.selectedItemId,
    })),

  updateFurniture: (instanceId: string, updates: Partial<PlacedFurniture>) =>
    set((state) => ({
      placedItems: state.placedItems.map((item) =>
        item.instanceId === instanceId ? { ...item, ...updates } : item
      ),
    })),

  selectItem: (instanceId: string | null) =>
    set(() => ({
      selectedItemId: instanceId,
    })),

  setDragging: (isDragging: boolean, furnitureId?: string) =>
    set(() => ({
      isDragging,
      dragFurnitureId: furnitureId || null,
    })),

  clearScene: () =>
    set(() => ({
      placedItems: [],
      selectedItemId: null,
    })),
}));

export const useSelectedItem = () => {
  const { placedItems, selectedItemId } = useSceneStore();
  return placedItems.find((item) => item.instanceId === selectedItemId) || null;
};
