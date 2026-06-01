import type { Point, Cluster } from '../../shared/types';
import { CLUSTER_COLORS } from '../../shared/types';

export class DynamicClusterer {
  private k: number;
  private alpha: number;
  private centroids: Point[] = [];
  private initialized: boolean = false;
  private labels: number[] = [];
  private points: Point[] = [];
  private maxPoints: number;

  constructor(k: number = 4, alpha: number = 0.1, maxPoints: number = 1000) {
    this.k = k;
    this.alpha = alpha;
    this.maxPoints = maxPoints;
  }

  private initializeCentroids(points: Point[]) {
    const shuffled = [...points].sort(() => Math.random() - 0.5);
    this.centroids = shuffled.slice(0, this.k).map(p => ({ ...p }));
    this.initialized = true;
  }

  private findNearestCentroid(point: Point): number {
    let minDist = Infinity;
    let nearestIdx = 0;

    for (let i = 0; i < this.centroids.length; i++) {
      const dist = this.distance(point, this.centroids[i]);
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = i;
      }
    }

    return nearestIdx;
  }

  private distance(p1: Point, p2: Point): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return dx * dx + dy * dy;
  }

  update(newPoints: Point[]): Cluster[] {
    if (newPoints.length === 0) {
      return this.getClusters();
    }

    this.points = [...this.points, ...newPoints].slice(-this.maxPoints);

    if (!this.initialized && this.points.length >= this.k) {
      this.initializeCentroids(this.points);
    }

    if (!this.initialized) {
      return [];
    }

    const batchSums: Point[] = Array(this.k).fill(null).map(() => ({ x: 0, y: 0 }));
    const batchCounts: number[] = Array(this.k).fill(0);

    for (const point of newPoints) {
      const label = this.findNearestCentroid(point);
      batchSums[label].x += point.x;
      batchSums[label].y += point.y;
      batchCounts[label]++;
    }

    for (let i = 0; i < this.k; i++) {
      if (batchCounts[i] > 0) {
        const batchMeanX = batchSums[i].x / batchCounts[i];
        const batchMeanY = batchSums[i].y / batchCounts[i];
        
        this.centroids[i].x += this.alpha * (batchMeanX - this.centroids[i].x);
        this.centroids[i].y += this.alpha * (batchMeanY - this.centroids[i].y);
      }
    }

    this.labels = this.points.map(p => this.findNearestCentroid(p));

    return this.getClusters();
  }

  getClusters(): Cluster[] {
    if (!this.initialized) return [];

    const counts: number[] = Array(this.k).fill(0);
    for (const label of this.labels) {
      counts[label]++;
    }

    return this.centroids.map((centroid, i) => ({
      centroid: { ...centroid },
      count: counts[i],
      label: i,
      color: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
    }));
  }

  getCentroids(): Point[] {
    return this.centroids.map(c => ({ ...c }));
  }

  getLabels(): number[] {
    return [...this.labels];
  }

  getPoints(): Point[] {
    return [...this.points];
  }

  setK(k: number) {
    if (k !== this.k) {
      this.k = k;
      this.initialized = false;
      this.centroids = [];
      this.labels = [];
    }
  }

  setAlpha(alpha: number) {
    this.alpha = alpha;
  }

  reset() {
    this.initialized = false;
    this.centroids = [];
    this.labels = [];
    this.points = [];
  }
}
