import { PlacedFurniture } from '@/types';
import { getFurnitureById } from '@/config/furniture';
import { RoomBounds } from '@/components/3d/Room';

export interface BoundingBox2D {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export const getItemBoundingBox = (item: PlacedFurniture): BoundingBox2D => {
  const furniture = getFurnitureById(item.furnitureId);
  if (!furniture) return { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };

  const { width, depth } = furniture.boundingBox;
  const halfWidth = (width * item.scale) / 2;
  const halfDepth = (depth * item.scale) / 2;

  const rotation = item.rotation[1];
  const cos = Math.abs(Math.cos(rotation));
  const sin = Math.abs(Math.sin(rotation));

  const rotatedHalfWidth = halfWidth * cos + halfDepth * sin;
  const rotatedHalfDepth = halfWidth * sin + halfDepth * cos;

  return {
    minX: item.position[0] - rotatedHalfWidth,
    maxX: item.position[0] + rotatedHalfWidth,
    minZ: item.position[2] - rotatedHalfDepth,
    maxZ: item.position[2] + rotatedHalfDepth,
  };
};

export const checkCollision = (
  box1: BoundingBox2D,
  box2: BoundingBox2D,
  padding: number = 0.05
): boolean => {
  return !(
    box1.maxX + padding < box2.minX ||
    box1.minX - padding > box2.maxX ||
    box1.maxZ + padding < box2.minZ ||
    box1.minZ - padding > box2.maxZ
  );
};

export const checkRoomBounds = (box: BoundingBox2D): boolean => {
  return (
    box.minX >= RoomBounds.minX &&
    box.maxX <= RoomBounds.maxX &&
    box.minZ >= RoomBounds.minZ &&
    box.maxZ <= RoomBounds.maxZ
  );
};

export const canPlaceItem = (
  newItem: PlacedFurniture,
  existingItems: PlacedFurniture[],
  excludeInstanceId?: string
): boolean => {
  const newBox = getItemBoundingBox(newItem);

  if (!checkRoomBounds(newBox)) {
    return false;
  }

  for (const existing of existingItems) {
    if (excludeInstanceId && existing.instanceId === excludeInstanceId) {
      continue;
    }
    const existingBox = getItemBoundingBox(existing);
    if (checkCollision(newBox, existingBox)) {
      return false;
    }
  }

  return true;
};

export const clampToRoomBounds = (position: [number, number, number], item: PlacedFurniture): [number, number, number] => {
  const furniture = getFurnitureById(item.furnitureId);
  if (!furniture) return position;

  const { width, depth } = furniture.boundingBox;
  const halfWidth = (width * item.scale) / 2;
  const halfDepth = (depth * item.scale) / 2;

  const rotation = item.rotation[1];
  const cos = Math.abs(Math.cos(rotation));
  const sin = Math.abs(Math.sin(rotation));

  const rotatedHalfWidth = halfWidth * cos + halfDepth * sin;
  const rotatedHalfDepth = halfWidth * sin + halfDepth * cos;

  return [
    Math.max(RoomBounds.minX + rotatedHalfWidth, Math.min(RoomBounds.maxX - rotatedHalfWidth, position[0])),
    position[1],
    Math.max(RoomBounds.minZ + rotatedHalfDepth, Math.min(RoomBounds.maxZ - rotatedHalfDepth, position[2])),
  ];
};
