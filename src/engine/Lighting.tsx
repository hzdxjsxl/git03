import React from 'react';
import { Environment, SoftShadows } from '@react-three/drei';

export const Lighting: React.FC = () => {
  return (
    <>
      <ambientLight intensity={0.4} color="#ffffff" />

      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0001}
      />

      <directionalLight
        position={[-4, 5, -3]}
        intensity={0.3}
        color="#e8f0ff"
      />

      <pointLight
        position={[0, 2.5, 0]}
        intensity={0.4}
        color="#fff5e0"
        distance={10}
      />

      <rectAreaLight
        position={[0, 2.8, -2.8]}
        width={4}
        height={2}
        intensity={1}
        color="#fff8f0"
      />

      <Environment preset="city" blur={0.8} />
      
      <SoftShadows size={10} samples={10} focus={0.5} />
    </>
  );
};
