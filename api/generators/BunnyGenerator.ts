import { PointCloudGenerator } from './BaseGenerator';
import { PointCloudMetadata } from '../../src/types/pointcloud';

export class BunnyGenerator extends PointCloudGenerator {
  private scale = 3.0;

  constructor(pointCount: number) {
    super(pointCount);
  }

  public getDatasetId(): string {
    return `bunny_${this.pointCount}`;
  }

  public getName(): string {
    const million = (this.pointCount / 1000000).toFixed(1);
    return `斯坦福兔子 (${million}M点)`;
  }

  public getDescription(): string {
    return `模拟斯坦福兔子模型的点云数据，共${this.pointCount.toLocaleString()}个点，包含复杂的几何细节和颜色渐变。`;
  }

  protected computeMetadata(): PointCloudMetadata {
    const s = this.scale;
    return {
      pointCount: this.pointCount,
      boundingBox: {
        min: [-s * 0.8, -s, -s * 0.6],
        max: [s * 0.8, s * 0.8, s * 0.6],
      },
      center: [0, -s * 0.1, 0],
      averagePointSpacing: 0.02,
    };
  }

  private bunnyImplicit(x: number, y: number, z: number): number {
    const s = this.scale;
    x /= s;
    y /= s;
    z /= s;

    const body = x * x + (y + 0.2) * (y + 0.2) + z * z - 0.36;
    const head = x * x + (y - 0.4) * (y - 0.4) + z * z - 0.16;
    const ear1 = (x - 0.25) * (x - 0.25) + (y - 0.7) * (y - 0.7) + z * z - 0.09;
    const ear2 = (x + 0.25) * (x + 0.25) + (y - 0.7) * (y - 0.7) + z * z - 0.09;
    const leg1 = (x - 0.3) * (x - 0.3) + (y + 0.8) * (y + 0.8) + z * z - 0.04;
    const leg2 = (x + 0.3) * (x + 0.3) + (y + 0.8) * (y + 0.8) + z * z - 0.04;

    return Math.min(body, head, ear1, ear2, leg1, leg2);
  }

  private computeNormal(x: number, y: number, z: number, eps = 0.01): [number, number, number] {
    const dx = this.bunnyImplicit(x + eps, y, z) - this.bunnyImplicit(x - eps, y, z);
    const dy = this.bunnyImplicit(x, y + eps, z) - this.bunnyImplicit(x, y - eps, z);
    const dz = this.bunnyImplicit(x, y, z + eps) - this.bunnyImplicit(x, y, z - eps);
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 0.0001) return [0, 0, 1];
    return [dx / len, dy / len, dz / len];
  }

  public generateChunk(startIndex: number, count: number): Float32Array {
    const data = new Float32Array(count * 10);
    const actualCount = Math.min(count, this.pointCount - startIndex);
    const s = this.scale;

    let pointsGenerated = 0;
    let attempts = 0;

    while (pointsGenerated < actualCount) {
      attempts++;
      const globalIndex = startIndex + pointsGenerated + attempts * 1337;

      const u1 = ((globalIndex * 0.618033988749895) % 1 + 1) % 1;
      const u2 = ((globalIndex * 0.432143214321432) % 1 + 1) % 1;
      const u3 = ((globalIndex * 0.785398163397448) % 1 + 1) % 1;
      const u4 = ((globalIndex * 0.314159265358979) % 1 + 1) % 1;

      const x = (u1 - 0.5) * 2 * s * 0.8;
      const y = (u2 - 0.5) * 2 * s * 1.8 - s * 0.1;
      const z = (u3 - 0.5) * 2 * s * 0.6;

      const dist = this.bunnyImplicit(x, y, z);

      if (dist > -0.02 && dist < 0.02) {
        const offset = pointsGenerated * 10;

        const noise = u4 * 0.02;
        const px = x + noise * (u1 - 0.5);
        const py = y + noise * (u2 - 0.5);
        const pz = z + noise * (u3 - 0.5);

        const [nx, ny, nz] = this.computeNormal(px, py, pz);

        const heightFactor = (py + s) / (2 * s);
        const r = 0.85 + 0.15 * Math.sin(heightFactor * Math.PI);
        const g = 0.75 + 0.2 * heightFactor;
        const b = 0.65 + 0.25 * Math.cos(heightFactor * Math.PI * 0.5);

        const size = 0.012 + u4 * 0.012;

        this.writePoint(data, offset, px, py, pz, r, g, b, nx, ny, nz, size);
        pointsGenerated++;
      }
    }

    return data;
  }
}
