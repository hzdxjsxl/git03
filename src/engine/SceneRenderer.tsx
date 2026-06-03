import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Room } from '@/components/3d/Room';
import { FurnitureItem } from '@/components/3d/FurnitureItem';
import { GhostPreview } from '@/components/3d/GhostPreview';
import { Lighting } from './Lighting';
import { useSceneStore } from '@/store/useSceneStore';
import { getFurnitureById } from '@/config/furniture';
import { canPlaceItem } from '@/utils/collision';

interface SceneContentProps {
  onCanvasClick: (point: THREE.Vector3) => void;
}

const SceneContent: React.FC<SceneContentProps> = ({ onCanvasClick }) => {
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const { isDragging, dragFurnitureId, placedItems, addFurniture, selectItem } = useSceneStore();
  const [ghostPosition, setGhostPosition] = useState<[number, number, number]>([0, 0.01, 0]);
  const [ghostRotation, setGhostRotation] = useState<[number, number, number]>([0, 0, 0]);
  const { camera, gl } = useThree();

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !dragFurnitureId) return;
    
    mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.current.setFromCamera(mouse.current, camera);
    const intersect = new THREE.Vector3();
    raycaster.current.ray.intersectPlane(plane.current, intersect);
    
    if (intersect) {
      setGhostPosition([intersect.x, 0.01, intersect.z]);
    }
  };

  const handleCanvasClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.target !== e.currentTarget) return;
    
    mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.current.setFromCamera(mouse.current, camera);
    const intersect = new THREE.Vector3();
    raycaster.current.ray.intersectPlane(plane.current, intersect);
    
    if (intersect) {
      if (isDragging && dragFurnitureId) {
        const furniture = getFurnitureById(dragFurnitureId);
        if (furniture) {
          const newItem = {
            instanceId: `${dragFurnitureId}-${Date.now()}`,
            furnitureId: dragFurnitureId,
            position: [intersect.x, 0.01, intersect.z] as [number, number, number],
            rotation: ghostRotation,
            materialId: furniture.defaultMaterialId,
            scale: 1,
          };
          
          if (canPlaceItem(newItem, placedItems)) {
            addFurniture(newItem);
          }
        }
      } else {
        onCanvasClick(intersect);
        selectItem(null);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (isDragging && dragFurnitureId) {
      if (e.key === 'r' || e.key === 'R') {
        setGhostRotation(prev => [prev[0], prev[1] + Math.PI / 4, prev[2]]);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDragging, dragFurnitureId]);

  return (
    <>
      <Lighting />
      <Room />
      
      <mesh
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleCanvasClick}
        onPointerMove={handlePointerMove}
      >
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {placedItems.map(item => (
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
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
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
  const handleCanvasClick = (point: THREE.Vector3) => {
  };

  return (
    <Canvas
      shadows
      camera={{ position: [6, 5, 6], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#1a1a2e' }}
    >
      <SceneContent onCanvasClick={handleCanvasClick} />
    </Canvas>
  );
};
