import React, { useRef } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { PlacedFurniture } from '@/types';
import { getFurnitureById } from '@/config/furniture';
import { getMaterialById } from '@/config/materials';
import { FURNITURE_MODELS } from './FurnitureModels';
import { useSceneStore } from '@/store/useSceneStore';

interface FurnitureItemProps {
  item: PlacedFurniture;
}

export const FurnitureItem: React.FC<FurnitureItemProps> = ({ item }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { selectedItemId, selectItem, updateFurniture, isDragging } = useSceneStore();
  const isSelected = selectedItemId === item.instanceId;

  const furniture = getFurnitureById(item.furnitureId);
  const materialConfig = getMaterialById(item.materialId);
  const ModelComponent = furniture ? FURNITURE_MODELS[item.furnitureId] : null;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!isDragging) {
      selectItem(item.instanceId);
    }
  };

  useFrame((state, delta) => {
    if (groupRef.current && isSelected) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.003;
      groupRef.current.scale.setScalar(scale * item.scale);
    } else if (groupRef.current) {
      groupRef.current.scale.setScalar(item.scale);
    }
  });

  if (!furniture || !ModelComponent || !materialConfig) return null;

  return (
    <group
      ref={groupRef}
      position={item.position}
      rotation={item.rotation as [number, number, number]}
      onClick={handleClick}
    >
      <ModelComponent materialConfig={materialConfig} />

      {isSelected && (
        <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.max(furniture.boundingBox.width, furniture.boundingBox.depth) * 0.55, Math.max(furniture.boundingBox.width, furniture.boundingBox.depth) * 0.6, 32]} />
          <meshBasicMaterial color="#ff6b35" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
};
