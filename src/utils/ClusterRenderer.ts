import type { Point, Cluster } from '../../shared/types';
import { CLUSTER_COLORS } from '../../shared/types';

export interface HoverInfo {
  type: 'point' | 'centroid' | null;
  point?: Point;
  centroid?: Point;
  label: number;
  clusterLabel: number;
  clusterCount: number;
  clusterColor: string;
  distance?: number;
}

interface RenderPoint extends Point {
  opacity: number;
  birthTime: number;
}

export class ClusterRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private pulsePhase: number = 0;
  private points: RenderPoint[] = [];
  private labels: number[] = [];
  private centroids: Point[] = [];
  private clusterCounts: number[] = [];
  private animationId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }

  clear() {
    this.ctx.fillStyle = '#0a1628';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawGrid() {
    const gridSize = 40;
    const pulse = Math.sin(this.pulsePhase) * 0.1 + 0.15;
    
    this.ctx.strokeStyle = `rgba(0, 245, 255, ${pulse * 0.3})`;
    this.ctx.lineWidth = 1;

    for (let x = 0; x <= this.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }

    for (let y = 0; y <= this.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
  }

  private drawScatterPoints() {
    const now = Date.now();
    const scaleX = this.width / 1000;
    const scaleY = this.height / 600;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (this.width - 1000 * scale) / 2;
    const offsetY = (this.height - 600 * scale) / 2;
    
    for (let i = 0; i < this.points.length; i++) {
      const point = this.points[i];
      const label = this.labels[i] ?? 0;
      const color = CLUSTER_COLORS[label % CLUSTER_COLORS.length];
      
      const age = (now - point.birthTime) / 1000;
      const fadeIn = Math.min(1, age * 5);
      const opacity = point.opacity * fadeIn;

      const x = point.x * scale + offsetX;
      const y = point.y * scale + offsetY;

      this.ctx.beginPath();
      this.ctx.arc(x, y, 3, 0, Math.PI * 2);
      this.ctx.fillStyle = color;
      this.ctx.globalAlpha = opacity * 0.8;
      this.ctx.fill();
      
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 8;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
      this.ctx.globalAlpha = 1;
    }
  }

  private drawCentroids() {
    const pulse = Math.sin(this.pulsePhase * 2) * 0.5 + 0.5;
    const scaleX = this.width / 1000;
    const scaleY = this.height / 600;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (this.width - 1000 * scale) / 2;
    const offsetY = (this.height - 600 * scale) / 2;

    for (let i = 0; i < this.centroids.length; i++) {
      const centroid = this.centroids[i];
      const color = CLUSTER_COLORS[i % CLUSTER_COLORS.length];
      const x = centroid.x * scale + offsetX;
      const y = centroid.y * scale + offsetY;

      this.ctx.beginPath();
      this.ctx.arc(x, y, 12 + pulse * 4, 0, Math.PI * 2);
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 2;
      this.ctx.globalAlpha = 0.5 + pulse * 0.5;
      this.ctx.stroke();
      this.ctx.globalAlpha = 1;

      this.ctx.beginPath();
      this.ctx.arc(x, y, 8, 0, Math.PI * 2);
      this.ctx.fillStyle = color;
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 20;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      this.ctx.fillStyle = '#0a1628';
      this.ctx.beginPath();
      this.ctx.arc(x, y, 4, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = color;
      this.ctx.font = 'bold 10px "JetBrains Mono"';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`C${i + 1}`, x, y + 22);
    }
  }

  private drawCentroidConnections() {
    if (this.centroids.length < 2) return;

    const scaleX = this.width / 1000;
    const scaleY = this.height / 600;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (this.width - 1000 * scale) / 2;
    const offsetY = (this.height - 600 * scale) / 2;

    this.ctx.strokeStyle = 'rgba(0, 245, 255, 0.1)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]);

    for (let i = 0; i < this.centroids.length; i++) {
      for (let j = i + 1; j < this.centroids.length; j++) {
        const dx = this.centroids[i].x - this.centroids[j].x;
        const dy = this.centroids[i].y - this.centroids[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 300) {
          const x1 = this.centroids[i].x * scale + offsetX;
          const y1 = this.centroids[i].y * scale + offsetY;
          const x2 = this.centroids[j].x * scale + offsetX;
          const y2 = this.centroids[j].y * scale + offsetY;
          
          this.ctx.beginPath();
          this.ctx.moveTo(x1, y1);
          this.ctx.lineTo(x2, y2);
          this.ctx.stroke();
        }
      }
    }

    this.ctx.setLineDash([]);
  }

  render(points: Point[], labels: number[], centroids: Point[], clusterCounts: number[] = []) {
    const now = Date.now();
    const newPoints: RenderPoint[] = points.map((p, i) => ({
      ...p,
      opacity: 1,
      birthTime: this.points[i]?.birthTime || now,
    }));

    this.points = newPoints;
    this.labels = labels;
    this.centroids = centroids;
    this.clusterCounts = clusterCounts;
  }

  private getScaleAndOffset() {
    const scaleX = this.width / 1000;
    const scaleY = this.height / 600;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (this.width - 1000 * scale) / 2;
    const offsetY = (this.height - 600 * scale) / 2;
    return { scale, offsetX, offsetY };
  }

  private screenToData(screenX: number, screenY: number): Point {
    const { scale, offsetX, offsetY } = this.getScaleAndOffset();
    return {
      x: Math.max(0, Math.min(1000, (screenX - offsetX) / scale)),
      y: Math.max(0, Math.min(600, (screenY - offsetY) / scale)),
    };
  }

  getHoverInfo(screenX: number, screenY: number): HoverInfo {
    const dataPoint = this.screenToData(screenX, screenY);
    const { scale } = this.getScaleAndOffset();
    const pointRadius = 10 * scale;
    const centroidRadius = 20 * scale;

    let nearestCentroidDist = Infinity;
    let nearestCentroidIdx = -1;
    for (let i = 0; i < this.centroids.length; i++) {
      const c = this.centroids[i];
      const dx = dataPoint.x - c.x;
      const dy = dataPoint.y - c.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestCentroidDist) {
        nearestCentroidDist = dist;
        nearestCentroidIdx = i;
      }
    }

    if (nearestCentroidIdx >= 0 && nearestCentroidDist * scale < centroidRadius) {
      const count = Math.max(0, Math.floor(this.clusterCounts[nearestCentroidIdx] || 0));
      return {
        type: 'centroid',
        centroid: { ...this.centroids[nearestCentroidIdx] },
        label: nearestCentroidIdx,
        clusterLabel: nearestCentroidIdx,
        clusterCount: count,
        clusterColor: CLUSTER_COLORS[nearestCentroidIdx % CLUSTER_COLORS.length],
        distance: Math.abs(nearestCentroidDist),
      };
    }

    let nearestPointDist = Infinity;
    let nearestPointIdx = -1;
    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      const dx = dataPoint.x - p.x;
      const dy = dataPoint.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestPointDist) {
        nearestPointDist = dist;
        nearestPointIdx = i;
      }
    }

    if (nearestPointIdx >= 0 && nearestPointDist * scale < pointRadius) {
      const label = this.labels[nearestPointIdx] ?? 0;
      const count = Math.max(0, Math.floor(this.clusterCounts[label] || 0));
      return {
        type: 'point',
        point: { ...this.points[nearestPointIdx] },
        label,
        clusterLabel: label,
        clusterCount: count,
        clusterColor: CLUSTER_COLORS[label % CLUSTER_COLORS.length],
        distance: Math.abs(nearestPointDist),
      };
    }

    return {
      type: null,
      label: -1,
      clusterLabel: -1,
      clusterCount: 0,
      clusterColor: '#666666',
    };
  }

  animate() {
    this.pulsePhase += 0.05;

    this.clear();
    this.drawGrid();
    this.drawCentroidConnections();
    this.drawScatterPoints();
    this.drawCentroids();
  }

  startAnimation() {
    if (this.animationId) return;
    
    const loop = () => {
      this.animate();
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  destroy() {
    this.stopAnimation();
  }
}
