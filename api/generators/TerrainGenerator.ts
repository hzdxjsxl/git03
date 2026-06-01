import { PointCloudGenerator } from './BaseGenerator';
import { PointCloudMetadata } from '../../src/types/pointcloud';

export class TerrainGenerator extends PointCloudGenerator {
  private width = 8;
  private depth = 8;
  private heightScale = 1.5;
  private permutation: number[];

  constructor(pointCount: number) {
    super(pointCount);
    const p: number[] = [];
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    this.permutation = [...p, ...p];
  }

  public getDatasetId(): string {
    return `terrain_${this.pointCount}`;
  }

  public getName(): string {
    const million = (this.pointCount / 1000000).toFixed(1);
    return `地形点云 (${million}M点)`;
  }

  public getDescription(): string {
    return `使用Perlin噪声生成的地形扫描点云，共${this.pointCount.toLocaleString()}个点，包含丰富的高度变化和颜色纹理。`;
  }

  protected computeMetadata(): PointCloudMetadata {
    return {
      pointCount: this.pointCount,
      boundingBox: {
        min: [-this.width / 2, -this.heightScale, -this.depth / 2],
        max: [this.width / 2, this.heightScale, this.depth / 2],
      },
      center: [0, 0, 0],
      averagePointSpacing: Math.sqrt((this.width * this.depth) / this.pointCount),
    };
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerpVal(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  private noise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = this.fade(x);
    const v = this.fade(y);
    const A = this.permutation[X] + Y;
    const B = this.permutation[X + 1] + Y;
    return this.lerpVal(
      this.lerpVal(this.grad(this.permutation[A], x, y), this.grad(this.permutation[B], x - 1, y), u),
      this.lerpVal(this.grad(this.permutation[A + 1], x, y - 1), this.grad(this.permutation[B + 1], x - 1, y - 1), u),
      v
    );
  }

  private fbm(x: number, y: number): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < 6; i++) {
      value += amplitude * this.noise(x * frequency, y * frequency);
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }

    return value / maxValue;
  }

  private computeNormal(x: number, z: number, eps = 0.01): [number, number, number] {
    const h = this.fbm(x * 0.5, z * 0.5) * this.heightScale;
    const hx = this.fbm((x + eps) * 0.5, z * 0.5) * this.heightScale;
    const hz = this.fbm(x * 0.5, (z + eps) * 0.5) * this.heightScale;

    const dx = hx - h;
    const dz = hz - h;

    const nx = -dx / eps;
    const ny = 1;
    const nz = -dz / eps;

    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    return [nx / len, ny / len, nz / len];
  }

  public generateChunk(startIndex: number, count: number): Float32Array {
    const data = new Float32Array(count * 10);
    const actualCount = Math.min(count, this.pointCount - startIndex);

    const gridSize = Math.ceil(Math.sqrt(this.pointCount));
    const spacingX = this.width / gridSize;
    const spacingZ = this.depth / gridSize;

    for (let i = 0; i < actualCount; i++) {
      const globalIndex = startIndex + i;
      const offset = i * 10;

      const gridX = globalIndex % gridSize;
      const gridZ = Math.floor(globalIndex / gridSize);

      const jitterX = ((globalIndex * 0.618033988749895) % 1 - 0.5) * spacingX * 0.8;
      const jitterZ = ((globalIndex * 0.314159265358979) % 1 - 0.5) * spacingZ * 0.8;

      const x = (gridX - gridSize / 2) * spacingX + jitterX;
      const z = (gridZ - gridSize / 2) * spacingZ + jitterZ;

      const h = this.fbm(x * 0.5, z * 0.5) * this.heightScale;

      const [nx, ny, nz] = this.computeNormal(x, z);

      const heightFactor = (h + this.heightScale) / (2 * this.heightScale);

      let r: number, g: number, b: number;
      if (h < -0.3) {
        r = 0.2;
        g = 0.3 + 0.2 * (h + this.heightScale) / this.heightScale;
        b = 0.6;
      } else if (h < 0.2) {
        r = 0.4 + 0.2 * heightFactor;
        g = 0.5 + 0.2 * heightFactor;
        b = 0.2;
      } else if (h < 0.8) {
        r = 0.3 + 0.3 * heightFactor;
        g = 0.35 + 0.25 * heightFactor;
        b = 0.3 + 0.15 * heightFactor;
      } else {
        r = 0.8 + 0.2 * heightFactor;
        g = 0.85 + 0.15 * heightFactor;
        b = 0.9 + 0.1 * heightFactor;
      }

      const size = 0.015 + ((globalIndex * 0.12345) % 1) * 0.015;

      this.writePoint(data, offset, x, h, z, r, g, b, nx, ny, nz, size);
    }

    return data;
  }
}
