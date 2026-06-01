import type { Point } from '../shared/types';

interface ClusterConfig {
  centerX: number;
  centerY: number;
  radius: number;
  speed: number;
  angle: number;
  angularSpeed: number;
}

export class DataGenerator {
  private clusters: ClusterConfig[] = [];
  private canvasWidth: number = 1000;
  private canvasHeight: number = 600;

  constructor(numClusters: number = 4) {
    this.initClusters(numClusters);
  }

  private initClusters(numClusters: number) {
    const margin = 150;
    const centerX = this.canvasWidth / 2;
    const centerY = this.canvasHeight / 2;
    const orbitRadius = Math.min(this.canvasWidth, this.canvasHeight) / 2 - margin;

    for (let i = 0; i < numClusters; i++) {
      const angle = (i / numClusters) * Math.PI * 2;
      this.clusters.push({
        centerX: centerX + Math.cos(angle) * orbitRadius * (0.6 + Math.random() * 0.3),
        centerY: centerY + Math.sin(angle) * orbitRadius * (0.6 + Math.random() * 0.3),
        radius: 40 + Math.random() * 40,
        speed: 0.5 + Math.random() * 1.5,
        angle: angle,
        angularSpeed: (Math.random() - 0.5) * 0.015,
      });
    }
  }

  updateClusters() {
    const centerX = this.canvasWidth / 2;
    const centerY = this.canvasHeight / 2;
    const orbitRadius = Math.min(this.canvasWidth, this.canvasHeight) / 2 - 100;

    for (const cluster of this.clusters) {
      cluster.angle += cluster.angularSpeed;
      const targetX = centerX + Math.cos(cluster.angle) * orbitRadius * (0.3 + 0.4 * Math.sin(Date.now() * 0.0005 + cluster.angle));
      const targetY = centerY + Math.sin(cluster.angle) * orbitRadius * (0.3 + 0.4 * Math.cos(Date.now() * 0.0005 + cluster.angle));
      
      cluster.centerX += (targetX - cluster.centerX) * 0.01;
      cluster.centerY += (targetY - cluster.centerY) * 0.01;
    }
  }

  generatePoints(count: number): Point[] {
    this.updateClusters();
    const points: Point[] = [];
    const timestamp = Date.now();

    for (let i = 0; i < count; i++) {
      const clusterIdx = Math.floor(Math.random() * this.clusters.length);
      const cluster = this.clusters[clusterIdx];
      
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * cluster.radius;
      
      const x = cluster.centerX + Math.cos(angle) * distance;
      const y = cluster.centerY + Math.sin(angle) * distance;

      points.push({
        x: Math.max(0, Math.min(this.canvasWidth, x)),
        y: Math.max(0, Math.min(this.canvasHeight, y)),
        timestamp,
      });
    }

    return points;
  }

  setNumClusters(num: number) {
    this.clusters = [];
    this.initClusters(num);
  }

  setCanvasSize(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }
}
