import { PointCloudMetadata } from '../../src/types/pointcloud';

export abstract class PointCloudGenerator {
  protected pointCount: number;
  protected metadata: PointCloudMetadata | null = null;

  constructor(pointCount: number) {
    this.pointCount = pointCount;
  }

  public abstract getDatasetId(): string;
  public abstract getName(): string;
  public abstract getDescription(): string;
  public abstract generateChunk(startIndex: number, count: number): Float32Array;

  public getPointCount(): number {
    return this.pointCount;
  }

  public getFileSize(): string {
    const bytes = this.pointCount * 40;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }

  public getMetadata(): PointCloudMetadata {
    if (this.metadata) return this.metadata;
    this.metadata = this.computeMetadata();
    return this.metadata;
  }

  protected abstract computeMetadata(): PointCloudMetadata;

  protected writePoint(
    data: Float32Array,
    offset: number,
    x: number, y: number, z: number,
    r: number, g: number, b: number,
    nx: number, ny: number, nz: number,
    size: number
  ): void {
    data[offset] = x;
    data[offset + 1] = y;
    data[offset + 2] = z;
    data[offset + 3] = r;
    data[offset + 4] = g;
    data[offset + 5] = b;
    data[offset + 6] = nx;
    data[offset + 7] = ny;
    data[offset + 8] = nz;
    data[offset + 9] = size;
  }

  public getPreviewUrl(): string {
    return '';
  }
}
