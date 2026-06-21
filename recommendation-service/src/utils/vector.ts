import { Vector } from '../types';

export const generateRandomVector = (dimension: number): Vector => {
  const values: number[] = [];
  for (let i = 0; i < dimension; i++) {
    values.push(Math.random() * 2 - 1);
  }
  return normalize({ values });
};

export const normalize = (v: Vector): Vector => {
  const magnitude = Math.sqrt(v.values.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return v;
  return {
    values: v.values.map(val => val / magnitude),
  };
};

export const dotProduct = (a: Vector, b: Vector): number => {
  if (a.values.length !== b.values.length) {
    throw new Error('Vector dimensions do not match');
  }
  let sum = 0;
  for (let i = 0; i < a.values.length; i++) {
    sum += a.values[i] * b.values[i];
  }
  return sum;
};

export const cosineSimilarity = (a: Vector, b: Vector): number => {
  return dotProduct(a, b);
};

export const addVectors = (a: Vector, b: Vector): Vector => {
  if (a.values.length !== b.values.length) {
    throw new Error('Vector dimensions do not match');
  }
  return {
    values: a.values.map((val, i) => val + b.values[i]),
  };
};

export const scaleVector = (v: Vector, scalar: number): Vector => {
  return {
    values: v.values.map(val => val * scalar),
  };
};

export const averageVectors = (vectors: Vector[]): Vector => {
  if (vectors.length === 0) {
    throw new Error('Cannot average empty vector array');
  }
  const dimension = vectors[0].values.length;
  const sum: number[] = new Array(dimension).fill(0);
  for (const v of vectors) {
    for (let i = 0; i < dimension; i++) {
      sum[i] += v.values[i];
    }
  }
  return normalize({ values: sum.map(val => val / vectors.length) });
};

export const weightedAverageVectors = (
  vectors: Vector[],
  weights: number[]
): Vector => {
  if (vectors.length === 0) {
    throw new Error('Cannot average empty vector array');
  }
  if (vectors.length !== weights.length) {
    throw new Error('Vectors and weights length mismatch');
  }
  const dimension = vectors[0].values.length;
  const sum: number[] = new Array(dimension).fill(0);
  let totalWeight = 0;
  for (let i = 0; i < vectors.length; i++) {
    const weight = weights[i];
    totalWeight += weight;
    for (let j = 0; j < dimension; j++) {
      sum[j] += vectors[i].values[j] * weight;
    }
  }
  if (totalWeight === 0) {
    return averageVectors(vectors);
  }
  return normalize({ values: sum.map(val => val / totalWeight) });
};
