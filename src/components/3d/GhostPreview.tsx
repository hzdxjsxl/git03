import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
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
  const groupRef = useRef<THREE.Group>(null);
  const { placedItems } = useSceneStore();

  const furniture = getFurnitureById(furnitureId);
  const materialConfig = furniture ? getMaterialById(furniture.defaultMaterialId) : null;
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

  const material = useMemo(() => {
    if (!materialConfig) return new THREE.MeshStandardMaterial();
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(materialConfig.color),
      roughness: materialConfig.roughness,
      metalness: materialConfig.metalness,
      transparent: true,
      opacity: canPlace ? 0.6 : 0.4,
      emissive: canPlace ? new THREE.Color('#00ff00') : new THREE.Color('#ff0000'),
      emissiveIntensity: canPlace ? 0.1 : 0.2,
    });
  }, [materialConfig, canPlace]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.set(...position);
      groupRef.current.rotation.set(...rotation);
    }
  });

  if (!furniture || !ModelComponent) return null;

  return (
    <group ref={groupRef}>
      <ModelComponent material={material} />
    </group>
  );
};
