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

    while (lastTimeRef.current >= simulationParams.timeStep) {
      stepWaveField(waveField, simulationParams, simulationParams.timeStep);
      lastTimeRef.current -= simulationParams.timeStep;
    }

    setCurrentTime(waveField.time);

    let pMaxDist = 0;
    let sMaxDist = 0;
    const source = waveField.source;

    if (source) {
      for (let k = 0; k < waveField.nz; k++) {
        for (let j = 0; j < waveField.ny; j++) {
          for (let i = 0; i < waveField.nx; i++) {
            const idx = k * waveField.nx * waveField.ny + j * waveField.nx + i;
            const pDisp = Math.abs(waveField.pWave[idx]);
            const sMag = Math.sqrt(
              waveField.sWaveX[idx] * waveField.sWaveX[idx] +
              waveField.sWaveY[idx] * waveField.sWaveY[idx] +
              waveField.sWaveZ[idx] * waveField.sWaveZ[idx]
            );

            if (pDisp > 0.0000001) {
              const dx = (i - source.x) * waveField.dx;
              const dy = (j - source.y) * waveField.dy;
              const dz = (k - source.z) * waveField.dz;
              const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
              pMaxDist = Math.max(pMaxDist, dist);
            }

            if (sMag > 0.0000001) {
              const dx = (i - source.x) * waveField.dx;
              const dy = (j - source.y) * waveField.dy;
              const dz = (k - source.z) * waveField.dz;
              const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
              sMaxDist = Math.max(sMaxDist, dist);
            }
          }
        }
      }
    }

    setWaveDistances(pMaxDist, sMaxDist);
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
