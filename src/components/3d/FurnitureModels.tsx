import React from 'react';
import * as THREE from 'three';

interface FurnitureModelProps {
  furnitureId: string;
  material: THREE.MeshStandardMaterial;
}

export const Sofa3Seater: React.FC<{ material: THREE.MeshStandardMaterial }> = ({ material }) => (
  <group>
    <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
      <boxGeometry args={[2.2, 0.4, 0.85]} />
      <primitive object={material} attach="material" />
    </mesh>
    <mesh position={[0, 0.7, -0.35]} castShadow receiveShadow>
      <boxGeometry args={[2.2, 0.5, 0.15]} />
      <primitive object={material} attach="material" />
    </mesh>
    <mesh position={[-0.95, 0.55, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.15, 0.4, 0.85]} />
      <primitive object={material} attach="material" />
    </mesh>
    <mesh position={[0.95, 0.55, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.15, 0.4, 0.85]} />
      <primitive object={material} attach="material" />
    </mesh>
    <mesh position={[-0.9, 0.1, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.08, 0.12, 0.75]} />
      <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
    </mesh>
    <mesh position={[0.9, 0.1, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.08, 0.12, 0.75]} />
      <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
    </mesh>
  </group>
);

export const Sofa2Seater: React.FC<{ material: THREE.MeshStandardMaterial }> = ({ material }) => (
  <group>
    <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
      <boxGeometry args={[1.6, 0.38, 0.8]} />
      <primitive object={material} attach="material" />
    </mesh>
    <mesh position={[0, 0.65, -0.32]} castShadow receiveShadow>
      <boxGeometry args={[1.6, 0.45, 0.14]} />
      <primitive object={material} attach="material" />
    </mesh>
    <mesh position={[-0.68, 0.5, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.14, 0.36, 0.8]} />
      <primitive object={material} attach="material" />
    </mesh>
    <mesh position={[0.68, 0.5, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.14, 0.36, 0.8]} />
      <primitive object={material} attach="material" />
    </mesh>
  </group>
);

export const SofaLounge: React.FC<{ material: THREE.MeshStandardMaterial }> = ({ material }) => (
  <group>
    <mesh position={[0, 0.3, 0.2]} castShadow receiveShadow>
      <boxGeometry args={[0.9, 0.4, 1.4]} />
      <primitive object={material} attach="material" />
    </mesh>
    <mesh position={[0, 0.65, -0.45]} castShadow receiveShadow>
      <boxGeometry args={[0.9, 0.45, 0.15]} />
      <primitive object={material} attach="material" />
    </mesh>
    <mesh position={[-0.38, 0.5, 0.2]} castShadow receiveShadow>
      <boxGeometry args={[0.14, 0.35, 1.4]} />
      <primitive object={material} attach="material" />
    </mesh>
    <mesh position={[0.38, 0.3, 0.65]} castShadow receiveShadow>
      <boxGeometry args={[0.14, 0.35, 0.5]} />
      <primitive object={material} attach="material" />
    </mesh>
  </group>
);

export const ChairDining: React.FC<{ material: THREE.MeshStandardMaterial }> = ({ material }) => (
  <group>
    <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.45, 0.05, 0.45]} />
      <primitive object={material} attach="material" />
    </mesh>
    <mesh position={[0, 0.7, -0.2]} castShadow receiveShadow>
      <boxGeometry args={[0.4, 0.45, 0.05]} />
      <primitive object={material} attach="material" />
    </mesh>
    {[[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].map(([x, z], i) => (
      <mesh key={i} position={[x, 0.22, z]} castShadow receiveShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.45]} />
        <meshStandardMaterial color="#3d2817" roughness={0.7} />
      </mesh>
    ))}
  </group>
);

export const ChairArmchair: React.FC<{ material: THREE.MeshStandardMaterial }> = ({ material }) => (
  <group>
    <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.65, 0.2, 0.7]} />
      <primitive object={material} attach="material" />
    </mesh>
    <mesh position={[0, 0.6, -0.28]} castShadow receiveShadow>
      <boxGeometry args={[0.65, 0.5, 0.15]} />
      <primitive object={material} attach="material" />
    </mesh>
    <mesh position={[-0.28, 0.45, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.12, 0.35, 0.7]} />
      <primitive object={material} attach="material" />
    </mesh>
    <mesh position={[0.28, 0.45, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.12, 0.35, 0.7]} />
      <primitive object={material} attach="material" />
    </mesh>
  </group>
);

export const ChairOffice: React.FC<{ material: THREE.MeshStandardMaterial }> = ({ material }) => (
  <group>
    <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.55, 0.1, 0.55]} />
      <primitive object={material} attach="material" />
    </mesh>
    <mesh position={[0, 0.9, -0.22]} castShadow receiveShadow>
      <boxGeometry args={[0.5, 0.65, 0.12]} />
      <primitive object={material} attach="material" />
    </mesh>
    <mesh position={[-0.22, 0.7, 0.05]} castShadow receiveShadow>
      <boxGeometry args={[0.08, 0.35, 0.35]} />
      <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.2} />
    </mesh>
    <mesh position={[0.22, 0.7, 0.05]} castShadow receiveShadow>
      <boxGeometry args={[0.08, 0.35, 0.35]} />
      <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.2} />
    </mesh>
    <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.04, 0.04, 0.4]} />
      <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
    </mesh>
    <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.25, 0.25, 0.05]} />
      <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
    </mesh>
  </group>
);

export const TableCoffee: React.FC<{ material: THREE.MeshStandardMaterial }> = ({ material }) => (
  <group>
    <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
      <boxGeometry args={[1.2, 0.05, 0.6]} />
      <primitive object={material} attach="material" />
    </mesh>
    {[[-0.55, -0.25], [0.55, -0.25], [-0.55, 0.25], [0.55, 0.25]].map(([x, z], i) => (
      <mesh key={i} position={[x, 0.18, z]} castShadow receiveShadow>
        <boxGeometry args={[0.04, 0.35, 0.04]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.3} />
      </mesh>
    ))}
  </group>
);

export const TableDining: React.FC<{ material: THREE.MeshStandardMaterial }> = ({ material }) => (
  <group>
    <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
      <boxGeometry args={[1.8, 0.08, 0.9]} />
      <primitive object={material} attach="material" />
    </mesh>
    {[[-0.8, -0.38], [0.8, -0.38], [-0.8, 0.38], [0.8, 0.38]].map(([x, z], i) => (
      <mesh key={i} position={[x, 0.34, z]} castShadow receiveShadow>
        <boxGeometry args={[0.08, 0.68, 0.08]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.4} />
      </mesh>
    ))}
  </group>
);

export const TableSide: React.FC<{ material: THREE.MeshStandardMaterial }> = ({ material }) => (
  <group>
    <mesh position={[0, 0.52, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.5, 0.04, 0.5]} />
      <primitive object={material} attach="material" />
    </mesh>
    <mesh position={[0, 0.26, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.03, 0.03, 0.48]} />
      <meshStandardMaterial color="#d4af37" metalness={0.95} roughness={0.2} />
    </mesh>
    <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.18, 0.18, 0.05]} />
      <meshStandardMaterial color="#d4af37" metalness={0.95} roughness={0.2} />
    </mesh>
  </group>
);

export const BedDouble: React.FC<{ material: THREE.MeshStandardMaterial }> = ({ material }) => (
  <group>
    <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
      <boxGeometry args={[1.8, 0.25, 2.0]} />
      <meshStandardMaterial color="#4a3728" roughness={0.7} />
    </mesh>
    <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
      <boxGeometry args={[1.75, 0.15, 1.95]} />
      <meshStandardMaterial color="#ffffff" roughness={0.6} />
    </mesh>
    <mesh position={[0, 0.65, -0.85]} castShadow receiveShadow>
      <boxGeometry args={[1.8, 0.6, 0.1]} />
      <primitive object={material} attach="material" />
    </mesh>
    <mesh position={[0, 0.32, 0.8]} castShadow receiveShadow>
      <boxGeometry args={[1.8, 0.15, 0.08]} />
      <primitive object={material} attach="material" />
    </mesh>
  </group>
);

export const BedSingle: React.FC<{ material: THREE.MeshStandardMaterial }> = ({ material }) => (
  <group>
    <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
      <boxGeometry args={[1.2, 0.22, 2.0]} />
      <meshStandardMaterial color="#5c4033" roughness={0.7} />
    </mesh>
    <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
      <boxGeometry args={[1.16, 0.12, 1.95]} />
      <meshStandardMaterial color="#f5f5f5" roughness={0.6} />
    </mesh>
    <mesh position={[0, 0.58, -0.85]} castShadow receiveShadow>
      <boxGeometry args={[1.2, 0.5, 0.08]} />
      <primitive object={material} attach="material" />
    </mesh>
  </group>
);

export const LampFloor: React.FC<{ material: THREE.MeshStandardMaterial }> = ({ material }) => (
  <group>
    <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.2, 0.22, 0.05]} />
      <primitive object={material} attach="material" />
    </mesh>
    <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.02, 0.02, 1.4]} />
      <primitive object={material} attach="material" />
    </mesh>
    <mesh position={[0, 1.45, 0]} castShadow>
      <coneGeometry args={[0.25, 0.3, 32, 1, true]} />
      <meshStandardMaterial color="#fff8e7" side={THREE.DoubleSide} transparent opacity={0.9} />
    </mesh>
    <pointLight position={[0, 1.35, 0]} intensity={0.5} color="#fff5e0" distance={4} />
  </group>
);

export const LampTable: React.FC<{ material: THREE.MeshStandardMaterial }> = ({ material }) => (
  <group>
    <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.12, 0.12, 0.04]} />
      <primitive object={material} attach="material" />
    </mesh>
    <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.015, 0.015, 0.35]} />
      <primitive object={material} attach="material" />
    </mesh>
    <mesh position={[0, 0.42, 0]} castShadow>
      <coneGeometry args={[0.15, 0.18, 32, 1, true]} />
      <meshStandardMaterial color="#fff8e7" side={THREE.DoubleSide} transparent opacity={0.85} />
    </mesh>
    <pointLight position={[0, 0.38, 0]} intensity={0.3} color="#fff5e0" distance={3} />
  </group>
);

export const DecorPlant: React.FC<{ material: THREE.MeshStandardMaterial }> = ({ material }) => (
  <group>
    <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.15, 0.12, 0.3, 32]} />
      <primitive object={material} attach="material" />
    </mesh>
    <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
      <sphereGeometry args={[0.35, 16, 16]} />
      <meshStandardMaterial color="#3d8b40" roughness={0.9} />
    </mesh>
    <mesh position={[0.15, 0.65, 0.1]} castShadow receiveShadow>
      <sphereGeometry args={[0.2, 12, 12]} />
      <meshStandardMaterial color="#4a9e50" roughness={0.9} />
    </mesh>
    <mesh position={[-0.12, 0.6, -0.15]} castShadow receiveShadow>
      <sphereGeometry args={[0.18, 12, 12]} />
      <meshStandardMaterial color="#2d6b30" roughness={0.9} />
    </mesh>
  </group>
);

export const DecorVase: React.FC<{ material: THREE.MeshStandardMaterial }> = ({ material }) => (
  <group>
    <mesh position={[0, 0.17, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.08, 0.1, 0.35, 32]} />
      <primitive object={material} attach="material" />
    </mesh>
    <mesh position={[0, 0.35, 0]} castShadow>
      <cylinderGeometry args={[0.08, 0.08, 0.02, 32]} />
      <meshStandardMaterial color="#e0e0e0" />
    </mesh>
  </group>
);

export const DecorRug: React.FC<{ material: THREE.MeshStandardMaterial }> = ({ material }) => (
  <group>
    <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <boxGeometry args={[2.0, 1.4, 0.02]} />
      <primitive object={material} attach="material" />
    </mesh>
  </group>
);

export const FURNITURE_MODELS: Record<string, React.FC<{ material: THREE.MeshStandardMaterial }>> = {
  'sofa-3seater': Sofa3Seater,
  'sofa-2seater': Sofa2Seater,
  'sofa-lounge': SofaLounge,
  'chair-dining': ChairDining,
  'chair-armchair': ChairArmchair,
  'chair-office': ChairOffice,
  'table-coffee': TableCoffee,
  'table-dining': TableDining,
  'table-side': TableSide,
  'bed-double': BedDouble,
  'bed-single': BedSingle,
  'lamp-floor': LampFloor,
  'lamp-table': LampTable,
  'decor-plant': DecorPlant,
  'decor-vase': DecorVase,
  'decor-rug': DecorRug,
};
