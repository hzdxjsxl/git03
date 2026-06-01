import { PointCloudGenerator } from './BaseGenerator';
import { PointCloudMetadata } from '../../src/types/pointcloud';

export class SphereGenerator extends PointCloudGenerator {
  private radius = 2.5;
  private center: [number, number, number] = [0, 0, 0];

  constructor(pointCount: number, radius = 2.5) {
    super(pointCount);
    this.radius = radius;
  }

  public getDatasetId(): string {
    return `sphere_${this.pointCount}`;
  }

  public getName(): string {
    const million = (this.pointCount / 1000000).toFixed(1);
    return `球体点云 (${million}M点)`;
  }

  public getDescription(): string {
    return `由${this.pointCount.toLocaleString()}个带颜色和法向的点组成的球体，用于测试抛雪球体积渲染效果。`;
  }

  protected computeMetadata(): PointCloudMetadata {
    const r = this.radius;
    const c = this.center;
    const area = 4 * Math.PI * r * r;
    const avgSpacing = Math.sqrt(area / this.pointCount);

    return {
      pointCount: this.pointCount,
      boundingBox: {
        min: [c[0] - r, c[1] - r, c[2] - r],
        max: [c[0] + r, c[1] + r, c[2] + r],
      },
      center: c,
      averagePointSpacing: avgSpacing,
    };
  }

  public generateChunk(startIndex: number, count: number): Float32Array {
    const data = new Float32Array(count * 10);
    const actualCount = Math.min(count, this.pointCount - startIndex);

    for (let i = 0; i < actualCount; i++) {
      const globalIndex = startIndex + i;
      const offset = i * 10;

      const u = (globalIndex * 0.618033988749895) % 1;
      const phi = Math.acos(2 * u - 1);
      const theta = (globalIndex * 2.399963229728653) % (Math.PI * 2);

      const radius = this.radius * (0.98 + Math.random() * 0.04);

      const x = radius * Math.sin(phi) * Math.cos(theta) + this.center[0];
      const y = radius * Math.sin(phi) * Math.sin(theta) + this.center[1];
      const z = radius * Math.cos(phi) + this.center[2];

      const nx = (x - this.center[0]) / radius;
      const ny = (y - this.center[1]) / radius;
      const nz = (z - this.center[2]) / radius;

      const t = (phi + Math.PI) / (Math.PI * 2);
      const r = 0.3 + 0.7 * t;
      const g = 0.5 + 0.5 * Math.sin(theta * 3);
      const b = 0.3 + 0.7 * (1 - t);

      const size = 0.015 + Math.random() * 0.015;

      this.writePoint(data, offset, x, y, z, r, g, b, nx, ny, nz, size);
    }

    return data;
  }
}
