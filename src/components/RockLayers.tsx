import * as THREE from 'three';
import type { RockModel } from '@/utils/waveSolver';

interface RockLayersProps {
  rockModel: RockModel;
  opacity: number;
  showRockLayers: boolean;
}

export function RockLayers({ rockModel, opacity, showRockLayers }: RockLayersProps) {
  if (!showRockLayers) return null;

  const { size, layers } = rockModel;

  return (
    <>
      {layers.map((layer, index) => {
        const depthStart = layer.depth[0];
        const depthEnd = layer.depth[1];
        const layerHeight = depthEnd - depthStart;
        const centerZ = depthStart + layerHeight / 2;

        const offsetX = size.x / 2;
        const offsetY = size.y / 2;
        const offsetZ = 0;

        return (
          <group key={layer.id || index}>
            <mesh
              position={[offsetX, offsetY, centerZ + offsetZ]}
              renderOrder={-10}
            >
              <boxGeometry args={[size.x, size.y, layerHeight]} />
              <meshStandardMaterial
                color={layer.color}
                transparent
                opacity={opacity}
                side={THREE.DoubleSide}
                roughness={0.8}
                metalness={0.1}
                depthWrite
                depthTest
              />
            </mesh>
            <lineSegments
              position={[offsetX, offsetY, centerZ + offsetZ]}
              renderOrder={-9}
            >
              <edgesGeometry args={[new THREE.BoxGeometry(size.x, size.y, layerHeight)]} />
              <lineBasicMaterial color="#ffffff" opacity={0.3} transparent />
            </lineSegments>
          </group>
        );
      })}
    </>
  );
}
