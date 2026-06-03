import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { WaveField as WaveFieldType, Vector3 } from '@/utils/waveSolver';
import { useSimulationStore } from '@/store/useSimulationStore';

interface WaveFieldProps {
  waveField: WaveFieldType | null;
  showPWave: boolean;
  showSWave: boolean;
  gridSize: Vector3;
  cellSize: Vector3;
}

export function WaveField({ waveField, showPWave, showSWave, gridSize, cellSize }: WaveFieldProps) {
  const pPointsRef = useRef<THREE.Points>(null);
  const sPointsRef = useRef<THREE.Points>(null);
  const pPositionsRef = useRef<Float32Array | null>(null);
  const pColorsRef = useRef<Float32Array | null>(null);
  const sPositionsRef = useRef<Float32Array | null>(null);
  const sColorsRef = useRef<Float32Array | null>(null);
  const frameCountRef = useRef(0);

  const setWaveDistances = useSimulationStore((state) => state.setWaveDistances);

  const maxPoints = Math.floor(gridSize.x) * Math.floor(gridSize.y) * Math.floor(gridSize.z);

  const pInitialPositions = useMemo(() => new Float32Array(maxPoints * 3), [maxPoints]);
  const pInitialColors = useMemo(() => new Float32Array(maxPoints * 4), [maxPoints]);
  const sInitialPositions = useMemo(() => new Float32Array(maxPoints * 3), [maxPoints]);
  const sInitialColors = useMemo(() => new Float32Array(maxPoints * 4), [maxPoints]);

  useFrame(() => {
    if (!waveField) return;

    frameCountRef.current++;

    const source = waveField.source;
    let pMaxDist = 0;
    let sMaxDist = 0;
    let pCount = 0;
    let sCount = 0;

    if (!pPositionsRef.current || pPositionsRef.current.length !== maxPoints * 3) {
      pPositionsRef.current = new Float32Array(maxPoints * 3);
      pColorsRef.current = new Float32Array(maxPoints * 4);
      sPositionsRef.current = new Float32Array(maxPoints * 3);
      sColorsRef.current = new Float32Array(maxPoints * 4);
    }

    const pPositions = pPositionsRef.current!;
    const pColors = pColorsRef.current!;
    const sPositions = sPositionsRef.current!;
    const sColors = sColorsRef.current!;

    for (let k = 0; k < waveField.nz; k++) {
      for (let j = 0; j < waveField.ny; j++) {
        for (let i = 0; i < waveField.nx; i++) {
          const idx = k * waveField.nx * waveField.ny + j * waveField.nx + i;

          const pDisp = Math.abs(waveField.pWave[idx]);
          const sx = waveField.sWaveX[idx];
          const sy = waveField.sWaveY[idx];
          const sz = waveField.sWaveZ[idx];
          const sMag = Math.sqrt(sx * sx + sy * sy + sz * sz);

          let dx = 0, dy = 0, dz = 0, dist = 0;
          if (source) {
            dx = (i - source.x) * waveField.dx;
            dy = (j - source.y) * waveField.dy;
            dz = (k - source.z) * waveField.dz;
            dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          }

          if (showPWave && pDisp > 0.000000001 && pCount < maxPoints) {
            const posIdx = pCount * 3;
            const colIdx = pCount * 4;

            pPositions[posIdx] = i * cellSize.x + cellSize.x / 2;
            pPositions[posIdx + 1] = j * cellSize.y + cellSize.y / 2;
            pPositions[posIdx + 2] = k * cellSize.z + cellSize.z / 2;

            const normalizedDisp = Math.min(pDisp * 200, 1.0);
            pColors[colIdx] = 1.0;
            pColors[colIdx + 1] = 0.42;
            pColors[colIdx + 2] = 0.21;
            pColors[colIdx + 3] = Math.min(normalizedDisp * 1.5, 1.0);

            pCount++;
            if (source) pMaxDist = Math.max(pMaxDist, dist);
          }

          if (showSWave && sMag > 0.000000001 && sCount < maxPoints) {
            const posIdx = sCount * 3;
            const colIdx = sCount * 4;

            sPositions[posIdx] = i * cellSize.x + cellSize.x / 2;
            sPositions[posIdx + 1] = j * cellSize.y + cellSize.y / 2;
            sPositions[posIdx + 2] = k * cellSize.z + cellSize.z / 2;

            const normalizedMag = Math.min(sMag * 200, 1.0);
            sColors[colIdx] = 0.0;
            sColors[colIdx + 1] = 0.83;
            sColors[colIdx + 2] = 1.0;
            sColors[colIdx + 3] = Math.min(normalizedMag * 1.5, 1.0);

            sCount++;
            if (source) sMaxDist = Math.max(sMaxDist, dist);
          }
        }
      }
    }

    setWaveDistances(pMaxDist, sMaxDist);

    if (showPWave && pPointsRef.current) {
      const pGeometry = pPointsRef.current.geometry;
      const posAttribute = pGeometry.attributes.position as THREE.BufferAttribute;
      const colAttribute = pGeometry.attributes.color as THREE.BufferAttribute;

      if (pCount > 0) {
        const posArray = posAttribute.array as Float32Array;
        const colArray = colAttribute.array as Float32Array;
        for (let i = 0; i < pCount * 3; i++) {
          posArray[i] = pPositions[i];
        }
        for (let i = 0; i < pCount * 4; i++) {
          colArray[i] = pColors[i];
        }
        posAttribute.needsUpdate = true;
        colAttribute.needsUpdate = true;
        pGeometry.setDrawRange(0, pCount);
        pPointsRef.current.visible = true;
      } else {
        pPointsRef.current.visible = false;
      }
    }

    if (showSWave && sPointsRef.current) {
      const sGeometry = sPointsRef.current.geometry;
      const posAttribute = sGeometry.attributes.position as THREE.BufferAttribute;
      const colAttribute = sGeometry.attributes.color as THREE.BufferAttribute;

      if (sCount > 0) {
        const posArray = posAttribute.array as Float32Array;
        const colArray = colAttribute.array as Float32Array;
        for (let i = 0; i < sCount * 3; i++) {
          posArray[i] = sPositions[i];
        }
        for (let i = 0; i < sCount * 4; i++) {
          colArray[i] = sColors[i];
        }
        posAttribute.needsUpdate = true;
        colAttribute.needsUpdate = true;
        sGeometry.setDrawRange(0, sCount);
        sPointsRef.current.visible = true;
      } else {
        sPointsRef.current.visible = false;
      }
    }
  });

  if (!waveField) return null;

  return (
    <>
      {showPWave && (
        <points ref={pPointsRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={maxPoints}
              array={pInitialPositions}
              itemSize={3}
              usage={THREE.DynamicDrawUsage}
            />
            <bufferAttribute
              attach="attributes-color"
              count={maxPoints}
              array={pInitialColors}
              itemSize={4}
              usage={THREE.DynamicDrawUsage}
            />
          </bufferGeometry>
          <pointsMaterial
            size={2.5}
            vertexColors
            transparent
            opacity={1.0}
            blending={THREE.AdditiveBlending}
            sizeAttenuation
            depthWrite={false}
          />
        </points>
      )}
      {showSWave && (
        <points ref={sPointsRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={maxPoints}
              array={sInitialPositions}
              itemSize={3}
              usage={THREE.DynamicDrawUsage}
            />
            <bufferAttribute
              attach="attributes-color"
              count={maxPoints}
              array={sInitialColors}
              itemSize={4}
              usage={THREE.DynamicDrawUsage}
            />
          </bufferGeometry>
          <pointsMaterial
            size={2.5}
            vertexColors
            transparent
            opacity={1.0}
            blending={THREE.AdditiveBlending}
            sizeAttenuation
            depthWrite={false}
          />
        </points>
      )}
    </>
  );
}
