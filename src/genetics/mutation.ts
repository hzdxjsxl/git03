import type { Genome } from './genome';
import { cloneGenome } from './genome';

function gaussianRandom(mean: number = 0, stdDev: number = 1): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1 || 0.0001)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function mutate(genome: Genome, mutationRate: number): Genome {
  const mutated = cloneGenome(genome);
  const sigma = mutationRate * 0.5;

  mutated.bodyVertices = mutated.bodyVertices.map((v) => ({
    x: clamp(v.x + gaussianRandom(0, sigma * 20), -70, 70),
    y: clamp(v.y + gaussianRandom(0, sigma * 20), -70, 70),
  }));

  if (Math.random() < mutationRate * 0.15) {
    const addCount = Math.random() < 0.5 ? 1 : -1;
    const targetCount = clamp(mutated.bodyVertices.length + addCount, 6, 10);
    if (targetCount > mutated.bodyVertices.length) {
      const angle = Math.random() * 2 * Math.PI;
      const radius = 20 + Math.random() * 35;
      mutated.bodyVertices.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
    } else if (targetCount < mutated.bodyVertices.length) {
      const idx = Math.floor(Math.random() * mutated.bodyVertices.length);
      mutated.bodyVertices.splice(idx, 1);
    }
  }

  mutated.wheels = mutated.wheels.map((w) => ({
    radius: clamp(w.radius + gaussianRandom(0, sigma * 10), 8, 30),
    position: clamp(w.position + gaussianRandom(0, sigma * 0.3), 0, 1),
    motorSpeed: clamp(w.motorSpeed + gaussianRandom(0, sigma * 0.2), 0.1, 0.8),
  }));

  if (Math.random() < mutationRate * 0.1) {
    if (mutated.wheels.length < 3 && Math.random() < 0.5) {
      mutated.wheels.push({
        radius: 8 + Math.random() * 22,
        position: Math.random(),
        motorSpeed: 0.1 + Math.random() * 0.7,
      });
    } else if (mutated.wheels.length > 2) {
      mutated.wheels.splice(Math.floor(Math.random() * mutated.wheels.length), 1);
    }
  }

  mutated.density = clamp(
    mutated.density + gaussianRandom(0, sigma * 0.002),
    0.001,
    0.005
  );

  mutated.friction = clamp(
    mutated.friction + gaussianRandom(0, sigma * 0.3),
    0.3,
    1.0
  );

  if (Math.random() < mutationRate * 0.3) {
    const hue = Math.floor(Math.random() * 360);
    const sat = Math.floor(60 + Math.random() * 40);
    const light = Math.floor(50 + Math.random() * 20);
    mutated.color = `hsl(${hue}, ${sat}%, ${light}%)`;
  }

  return mutated;
}
