import React from 'react';
import * as THREE from 'three';

const ROOM_WIDTH = 8;
const ROOM_DEPTH = 6;
const ROOM_HEIGHT = 3;

const FLOOR_COLOR = '#e8ddd0';
const WALL_COLOR = '#f5f2ee';

export const Room: React.FC = () => {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial
          color={FLOOR_COLOR}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      <mesh position={[0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, ROOM_HEIGHT]} />
        <meshStandardMaterial
          color={WALL_COLOR}
          roughness={0.9}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh
        position={[-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[ROOM_DEPTH, ROOM_HEIGHT]} />
        <meshStandardMaterial
          color={WALL_COLOR}
          roughness={0.9}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.03}
          wireframe
        />
      </mesh>

      <gridHelper
        args={[ROOM_WIDTH, 16, '#cccccc', '#e0e0e0']}
        position={[0, 0.02, 0]}
      />
    </group>
  );
};

export const RoomBounds = {
  width: ROOM_WIDTH,
  depth: ROOM_DEPTH,
  height: ROOM_HEIGHT,
  minX: -ROOM_WIDTH / 2,
  maxX: ROOM_WIDTH / 2,
  minZ: -ROOM_DEPTH / 2,
  maxZ: ROOM_DEPTH / 2,
};
