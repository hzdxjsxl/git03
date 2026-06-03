import React, { useMemo } from 'react';
import * as THREE from 'three';
import { getFurnitureById } from '@/config/furniture';
import { getMaterialById } from '@/config/materials';
import { FURNITURE_MODELS } from './FurnitureModels';
import { canPlaceItem } from '@/utils/collision';
import { useSceneStore } from '@/store/useSceneStore';

interface GhostPreviewProps {
  furnitureId: string;
  position: [number, number, number];
  rotation: [number, number, number];
}

export const GhostPreview: React.FC<GhostPreviewProps> = ({ furnitureId, position, rotation }) => {
  const { placedItems } = useSceneStore();

  const furniture = getFurnitureById(furnitureId);
  const baseMaterialConfig = furniture ? getMaterialById(furniture.defaultMaterialId) : null;
  const ModelComponent = furniture ? FURNITURE_MODELS[furnitureId] : null;

  const canPlace = useMemo(() => {
    if (!furniture) return false;
    const testItem = {
      instanceId: 'ghost',
      furnitureId,
      position,
      rotation,
      materialId: furniture.defaultMaterialId,
      scale: 1,
    };
    return canPlaceItem(testItem, placedItems);
  }, [furnitureId, position, rotation, placedItems, furniture]);

  if (!furniture || !ModelComponent || !baseMaterialConfig) return null;

  return (
    <group position={position} rotation={rotation}>
      <ModelComponent
        materialConfig={baseMaterialConfig}
        transparent={true}
        opacity={canPlace ? 0.6 : 0.4}
        emissive={canPlace ? '#00ff00' : '#ff0000'}
        emissiveIntensity={canPlace ? 0.1 : 0.2}
      />
      <mesh position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry
          args={[
            Math.max(furniture.boundingBox.width, furniture.boundingBox.depth) * 0.52,
            Math.max(furniture.boundingBox.width, furniture.boundingBox.depth) * 0.6,
            32,
          ]}
        />
        <meshBasicMaterial
          color={canPlace ? '#00ff00' : '#ff0000'}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};
