import React, { useState, useEffect, useCallback } from 'react';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Room } from '@/components/3d/Room';
import { FurnitureItem } from '@/components/3d/FurnitureItem';
import { GhostPreview } from '@/components/3d/GhostPreview';
import { Lighting } from './Lighting';
import { useSceneStore } from '@/store/useSceneStore';
import { getFurnitureById } from '@/config/furniture';
import { canPlaceItem } from '@/utils/collision';

const SceneContent: React.FC = () => {
  const {
    isDragging,
    dragFurnitureId,
    placedItems,
    addFurniture,
    selectItem,
    setDragging,
  } = useSceneStore();

  const [ghostPosition, setGhostPosition] = useState<[number, number, number]>([0, 0.01, 0]);
  const [ghostRotation, setGhostRotation] = useState<[number, number, number]>([0, 0, 0]);

  const handleFloorClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();

      const point = e.point;

      if (isDragging && dragFurnitureId) {
        const furniture = getFurnitureById(dragFurnitureId);
        if (furniture) {
          const position: [number, number, number] = [point.x, 0.01, point.z];
          const newItem = {
            instanceId: `${dragFurnitureId}-${Date.now()}`,
            furnitureId: dragFurnitureId,
            position,
            rotation: ghostRotation,
            materialId: furniture.defaultMaterialId,
            scale: 1,
          };

          if (canPlaceItem(newItem, placedItems)) {
            addFurniture(newItem);
            setDragging(false);
          }
        }
      } else {
        selectItem(null);
      }
    },
    [isDragging, dragFurnitureId, placedItems, addFurniture, selectItem, ghostRotation, setDragging]
  );

  const handleFloorPointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isDragging || !dragFurnitureId) return;
      e.stopPropagation();
      const point = e.point;
      setGhostPosition([point.x, 0.01, point.z]);
    },
    [isDragging, dragFurnitureId]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDragging(false);
        setGhostRotation([0, 0, 0]);
      }
      if ((e.key === 'r' || e.key === 'R') && isDragging && dragFurnitureId) {
        setGhostRotation((prev) => [prev[0], prev[1] + Math.PI / 4, prev[2]]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDragging, dragFurnitureId, setDragging]);

  return (
    <>
      <Lighting />
      <Room />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.005, 0]}
        onClick={handleFloorClick}
        onPointerMove={handleFloorPointerMove}
      >
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {placedItems.map((item) => (
        <FurnitureItem key={item.instanceId} item={item} />
      ))}

      {isDragging && dragFurnitureId && (
        <GhostPreview
          furnitureId={dragFurnitureId}
          position={ghostPosition}
          rotation={ghostRotation}
        />
      )}

      <OrbitControls
        makeDefault
        enabled={!isDragging}
        enableZoom={true}
        minDistance={3}
        maxDistance={15}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2 - 0.1}
        target={[0, 0, 0]}
      />
    </>
  );
};

export const SceneRenderer: React.FC = () => {
  return (
    <Canvas
      shadows
      camera={{ position: [6, 5, 6], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#1a1a2e' }}
      onPointerMissed={() => {
        useSceneStore.getState().selectItem(null);
      }}
    >
      <SceneContent />
    </Canvas>
  );
};
