import { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { RockLayers } from './RockLayers';
import { WaveField } from './WaveField';
import { stepWaveField } from '@/utils/waveSolver';
import { useSimulationStore } from '@/store/useSimulationStore';

function SceneContent() {
  const {
    rockModel,
    waveField,
    isRunning,
    simulationParams,
    simulationSpeed,
    showPWave,
    showSWave,
    showRockLayers,
    opacity,
    gridSize,
    cellSize,
    setCurrentTime,
    setWaveDistances,
  } = useSimulationStore();

  const { scene } = useThree();
  const lastTimeRef = useRef(0);

  useEffect(() => {
    scene.fog = new THREE.FogExp2(0x0a1628, 0.003);
    scene.background = new THREE.Color(0x0a1628);
  }, [scene]);

  useFrame((_, delta) => {
    if (!waveField || !isRunning) return;

    const dt = delta * simulationSpeed;
    lastTimeRef.current += dt;

    let steps = 0;
    while (lastTimeRef.current >= simulationParams.timeStep && steps < 10) {
      stepWaveField(waveField, simulationParams, simulationParams.timeStep);
      lastTimeRef.current -= simulationParams.timeStep;
      steps++;
    }

    setCurrentTime(waveField.time);
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[50, 100, 50]} intensity={0.8} castShadow />
      <pointLight position={[100, 100, 100]} intensity={0.5} />
      <pointLight position={[-50, -50, 50]} intensity={0.3} />

      <RockLayers
        rockModel={rockModel}
        opacity={opacity}
        showRockLayers={showRockLayers}
      />

      <WaveField
        waveField={waveField}
        showPWave={showPWave}
        showSWave={showSWave}
        gridSize={gridSize}
        cellSize={cellSize}
      />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={10}
        maxDistance={300}
      />

      <EffectComposer>
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

export function EarthScene() {
  return (
    <Canvas
      camera={{ position: [80, 80, 80], fov: 60 }}
      gl={{ antialias: true, alpha: false }}
    >
      <SceneContent />
    </Canvas>
  );
}
