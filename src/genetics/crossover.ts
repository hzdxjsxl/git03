import type { Genome, WheelGene } from './genome';
import { cloneGenome } from './genome';

function mergeVertices(
  parentA: { x: number; y: number }[],
  parentB: { x: number; y: number }[]
): { x: number; y: number }[] {
  const count = Math.random() < 0.5 ? parentA.length : parentB.length;
  const result: { x: number; y: number }[] = [];

  for (let i = 0; i < count; i++) {
    const a = parentA[i % parentA.length];
    const b = parentB[i % parentB.length];
    if (Math.random() < 0.5) {
      result.push({ x: a.x, y: a.y });
    } else {
      result.push({ x: b.x, y: b.y });
    }
  }

  return result;
}

function mergeWheels(parentA: WheelGene[], parentB: WheelGene[]): WheelGene[] {
  const count = Math.random() < 0.5 ? parentA.length : parentB.length;
  const result: WheelGene[] = [];

  for (let i = 0; i < count; i++) {
    const source =
      Math.random() < 0.5 ? parentA[i % parentA.length] : parentB[i % parentB.length];
    result.push({ ...source });
  }

  return result;
}

export function crossover(parentA: Genome, parentB: Genome): [Genome, Genome] {
  const childA = cloneGenome(parentA);
  const childB = cloneGenome(parentB);

  childA.bodyVertices = mergeVertices(parentA.bodyVertices, parentB.bodyVertices);
  childB.bodyVertices = mergeVertices(parentB.bodyVertices, parentA.bodyVertices);

  childA.wheels = mergeWheels(parentA.wheels, parentB.wheels);
  childB.wheels = mergeWheels(parentB.wheels, parentA.wheels);

  childA.density = Math.random() < 0.5 ? parentA.density : parentB.density;
  childB.density = Math.random() < 0.5 ? parentB.density : parentA.density;

  childA.friction = Math.random() < 0.5 ? parentA.friction : parentB.friction;
  childB.friction = Math.random() < 0.5 ? parentB.friction : parentA.friction;

  return [childA, childB];
}
