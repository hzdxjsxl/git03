import { PointCloudGenerator } from './BaseGenerator';
import { SphereGenerator } from './SphereGenerator';
import { BunnyGenerator } from './BunnyGenerator';
import { TerrainGenerator } from './TerrainGenerator';
import { DatasetInfo, PointCloudMetadata } from '../../src/types/pointcloud';

export class DatasetRegistry {
  private datasets: Map<string, PointCloudGenerator> = new Map();

  constructor() {
    this.registerDatasets();
  }

  private registerDatasets(): void {
    const datasets = [
      new SphereGenerator(1000000),
      new SphereGenerator(3000000),
      new SphereGenerator(5000000),
      new BunnyGenerator(1000000),
      new BunnyGenerator(3000000),
      new TerrainGenerator(1000000),
      new TerrainGenerator(3000000),
      new TerrainGenerator(5000000),
    ];

    for (const dataset of datasets) {
      this.datasets.set(dataset.getDatasetId(), dataset);
    }
  }

  public getDatasetList(): DatasetInfo[] {
    const result: DatasetInfo[] = [];
    for (const [id, generator] of this.datasets) {
      result.push({
        id,
        name: generator.getName(),
        description: generator.getDescription(),
        pointCount: generator.getPointCount(),
        fileSize: generator.getFileSize(),
        previewUrl: generator.getPreviewUrl(),
      });
    }
    return result;
  }

  public getGenerator(datasetId: string): PointCloudGenerator | undefined {
    return this.datasets.get(datasetId);
  }

  public getMetadata(datasetId: string): PointCloudMetadata | null {
    const generator = this.datasets.get(datasetId);
    if (!generator) return null;
    return generator.getMetadata();
  }

  public hasDataset(datasetId: string): boolean {
    return this.datasets.has(datasetId);
  }
}

export const datasetRegistry = new DatasetRegistry();
