import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { WaveField as WaveFieldType, Vector3 } from '@/utils/waveSolver';

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
  const sPositionsRef = useRef<Float32Array | null>(null);
  const pColorsRef = useRef<Float32Array | null>(null);
  const sColorsRef = useRef<Float32Array | null>(null);

  const maxPoints = Math.floor(gridSize.x) * Math.floor(gridSize.y) * Math.floor(gridSize.z);

  const initialPositions = useMemo(() => new Float32Array(maxPoints * 3), [maxPoints]);
  const initialColors = useMemo(() => new Float32Array(maxPoints * 4), [maxPoints]);

  useFrame(() => {
    if (!waveField) return;

    if (showPWave && pPointsRef.current) {
      const pGeometry = pPointsRef.current.geometry;
      const posAttribute = pGeometry.attributes.position as THREE.BufferAttribute;
      const colAttribute = pGeometry.attributes.color as THREE.BufferAttribute;

      if (!pPositionsRef.current || pPositionsRef.current.length !== maxPoints * 3) {
        pPositionsRef.current = new Float32Array(maxPoints * 3);
        pColorsRef.current = new Float32Array(maxPoints * 4);
      }

      const pPositions = pPositionsRef.current!;
      const pColors = pColorsRef.current!;
      let pCount = 0;

      for (let k = 0; k < waveField.nz; k++) {
        for (let j = 0; j < waveField.ny; j++) {
          for (let i = 0; i < waveField.nx; i++) {
            const idx = k * waveField.nx * waveField.ny + j * waveField.nx + i;
            const displacement = Math.abs(waveField.pWave[idx]);

            if (displacement > 0.0000001) {
              const posIdx = pCount * 3;
              const colIdx = pCount * 4;

              pPositions[posIdx] = i * cellSize.x + cellSize.x / 2;
              pPositions[posIdx + 1] = j * cellSize.y + cellSize.y / 2;
              pPositions[posIdx + 2] = k * cellSize.z + cellSize.z / 2;

              const normalizedDisp = Math.min(displacement * 200, 1.0);
              pColors[colIdx] = 1.0;
              pColors[colIdx + 1] = 0.42;
              pColors[colIdx + 2] = 0.21;
              pColors[colIdx + 3] = Math.min(normalizedDisp * 1.5, 1.0);

              pCount++;
            }
          }
        }
      }

      if (pCount > 0) {
        (posAttribute.array as Float32Array).set(pPositions.slice(0, pCount * 3));
        (colAttribute.array as Float32Array).set(pColors.slice(0, pCount * 4));
        posAttribute.needsUpdate = true;
        colAttribute.needsUpdate = true;
        pGeometry.setDrawRange(0, pCount);
      } else {
        pGeometry.setDrawRange(0, 0);
      }
    }

    if (showSWave && sPointsRef.current) {
      const sGeometry = sPointsRef.current.geometry;
      const posAttribute = sGeometry.attributes.position as THREE.BufferAttribute;
      const colAttribute = sGeometry.attributes.color as THREE.BufferAttribute;

      if (!sPositionsRef.current || sPositionsRef.current.length !== maxPoints * 3) {
        sPositionsRef.current = new Float32Array(maxPoints * 3);
        sColorsRef.current = new Float32Array(maxPoints * 4);
      }

      const sPositions = sPositionsRef.current!;
      const sColors = sColorsRef.current!;
      let sCount = 0;

      for (let k = 0; k < waveField.nz; k++) {
        for (let j = 0; j < waveField.ny; j++) {
          for (let i = 0; i < waveField.nx; i++) {
            const idx = k * waveField.nx * waveField.ny + j * waveField.nx + i;
            const sx = waveField.sWaveX[idx];
            const sy = waveField.sWaveY[idx];
            const sz = waveField.sWaveZ[idx];
            const magnitude = Math.sqrt(sx * sx + sy * sy + sz * sz);

            if (magnitude > 0.0000001) {
              const posIdx = sCount * 3;
              const colIdx = sCount * 4;

              sPositions[posIdx] = i * cellSize.x + cellSize.x / 2;
              sPositions[posIdx + 1] = j * cellSize.y + cellSize.y / 2;
              sPositions[posIdx + 2] = k * cellSize.z + cellSize.z / 2;

              const normalizedMag = Math.min(magnitude * 200, 1.0);
              sColors[colIdx] = 0.0;
              sColors[colIdx + 1] = 0.83;
              sColors[colIdx + 2] = 1.0;
              sColors[colIdx + 3] = Math.min(normalizedMag * 1.5, 1.0);

              sCount++;
            }
          }
        }
      }

      if (sCount > 0) {
        (posAttribute.array as Float32Array).set(sPositions.slice(0, sCount * 3));
        (colAttribute.array as Float32Array).set(sColors.slice(0, sCount * 4));
        posAttribute.needsUpdate = true;
        colAttribute.needsUpdate = true;
        sGeometry.setDrawRange(0, sCount);
      } else {
        sGeometry.setDrawRange(0, 0);
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
              array={initialPositions}
              itemSize={3}
              usage={THREE.DynamicDrawUsage}
            />
            <bufferAttribute
              attach="attributes-color"
              count={maxPoints}
              array={initialColors}
              itemSize={4}
              usage={THREE.DynamicDrawUsage}
            />
          </bufferGeometry>
          <pointsMaterial
            size={1.2}
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
              array={initialPositions}
              itemSize={3}
              usage={THREE.DynamicDrawUsage}
            />
            <bufferAttribute
              attach="attributes-color"
              count={maxPoints}
              array={initialColors}
              itemSize={4}
              usage={THREE.DynamicDrawUsage}
            />
          </bufferGeometry>
          <pointsMaterial
            size={1.2}
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
