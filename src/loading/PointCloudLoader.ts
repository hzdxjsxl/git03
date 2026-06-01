import { BinaryStreamParser } from './BinaryStreamParser';
import {
  DatasetInfo,
  PointCloudMetadata,
  LoadProgress,
  ChunkData,
} from '../types/pointcloud';

export type OnChunkCallback = (chunk: ChunkData) => void;
export type OnProgressCallback = (progress: LoadProgress) => void;
export type OnCompleteCallback = () => void;
export type OnErrorCallback = (error: Error) => void;

export class PointCloudLoader {
  private parser = new BinaryStreamParser();
  private abortController: AbortController | null = null;
  private totalPoints = 0;
  private loadedPoints = 0;
  private totalChunks = 0;
  private loadedChunks = 0;
  private isLoading = false;

  public async fetchDatasets(): Promise<DatasetInfo[]> {
    const response = await fetch('/api/datasets');
    if (!response.ok) {
      throw new Error(`Failed to fetch datasets: ${response.statusText}`);
    }
    return response.json();
  }

  public async fetchMetadata(datasetId: string): Promise<PointCloudMetadata> {
    const response = await fetch(`/api/pointcloud/${datasetId}/metadata`);
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.statusText}`);
    }
    return response.json();
  }

  public async loadPointCloud(
    datasetId: string,
    onChunk: OnChunkCallback,
    onProgress: OnProgressCallback,
    onComplete: OnCompleteCallback,
    onError: OnErrorCallback,
    chunkSize = 50000
  ): Promise<void> {
    if (this.isLoading) {
      this.abort();
    }

    this.isLoading = true;
    this.abortController = new AbortController();
    this.parser.reset();
    this.loadedPoints = 0;
    this.loadedChunks = 0;

    try {
      const metadata = await this.fetchMetadata(datasetId);
      this.totalPoints = metadata.pointCount;
      this.totalChunks = Math.ceil(this.totalPoints / chunkSize);

      const response = await fetch(
        `/api/pointcloud/${datasetId}?chunkSize=${chunkSize}`,
        {
          headers: {
            Accept: 'application/octet-stream',
          },
          signal: this.abortController.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load point cloud: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body available');
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunks = this.parser.parse(value.buffer);

        for (const chunk of chunks) {
          onChunk(chunk);
          this.loadedPoints += chunk.pointCount;
          this.loadedChunks++;

          onProgress({
            loaded: this.loadedPoints,
            total: this.totalPoints,
            percentage: (this.loadedPoints / this.totalPoints) * 100,
            chunksLoaded: this.loadedChunks,
            totalChunks: this.totalChunks,
          });
        }
      }

      if (this.parser.hasLeftover()) {
        console.warn('Stream ended with incomplete chunk data');
      }

      this.isLoading = false;
      onComplete();
    } catch (error) {
      this.isLoading = false;
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  public abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isLoading = false;
  }

  public getIsLoading(): boolean {
    return this.isLoading;
  }

  public getProgress(): LoadProgress {
    return {
      loaded: this.loadedPoints,
      total: this.totalPoints,
      percentage: this.totalPoints > 0 ? (this.loadedPoints / this.totalPoints) * 100 : 0,
      chunksLoaded: this.loadedChunks,
      totalChunks: this.totalChunks,
    };
  }

  public async generateTestData(
    pointCount: number,
    onChunk: OnChunkCallback,
    onProgress: OnProgressCallback,
    onComplete: OnCompleteCallback,
    chunkSize = 50000
  ): Promise<void> {
    const totalChunks = Math.ceil(pointCount / chunkSize);
    let loadedPoints = 0;

    this.totalPoints = pointCount;
    this.totalChunks = totalChunks;
    this.loadedPoints = 0;
    this.loadedChunks = 0;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const pointsInChunk = Math.min(chunkSize, pointCount - loadedPoints);
      const data = new Float32Array(pointsInChunk * 10);

      for (let i = 0; i < pointsInChunk; i++) {
        const offset = i * 10;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = 2 + Math.random() * 0.5;

        data[offset] = radius * Math.sin(phi) * Math.cos(theta);
        data[offset + 1] = radius * Math.sin(phi) * Math.sin(theta);
        data[offset + 2] = radius * Math.cos(phi);

        const t = (phi + Math.PI) / (Math.PI * 2);
        data[offset + 3] = t;
        data[offset + 4] = 0.5 + 0.5 * Math.sin(theta);
        data[offset + 5] = 1 - t;

        data[offset + 6] = -data[offset] / radius;
        data[offset + 7] = -data[offset + 1] / radius;
        data[offset + 8] = -data[offset + 2] / radius;

        data[offset + 9] = 0.02 + Math.random() * 0.02;
      }

      onChunk({
        chunkIndex,
        pointCount: pointsInChunk,
        data,
      });

      loadedPoints += pointsInChunk;
      this.loadedPoints = loadedPoints;
      this.loadedChunks = chunkIndex + 1;

      onProgress({
        loaded: loadedPoints,
        total: pointCount,
        percentage: (loadedPoints / pointCount) * 100,
        chunksLoaded: chunkIndex + 1,
        totalChunks,
      });

      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    onComplete();
  }
}
