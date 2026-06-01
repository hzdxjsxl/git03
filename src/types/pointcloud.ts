export interface PointData {
  x: number;
  y: number;
  z: number;
  r: number;
  g: number;
  b: number;
  nx: number;
  ny: number;
  nz: number;
  size: number;
}

export const POINT_STRIDE = 10;
export const POINT_BYTE_SIZE = POINT_STRIDE * 4;

export interface PointCloudMetadata {
  pointCount: number;
  boundingBox: {
    min: [number, number, number];
    max: [number, number, number];
  };
  center: [number, number, number];
  averagePointSpacing: number;
}

export interface DatasetInfo {
  id: string;
  name: string;
  description: string;
  pointCount: number;
  fileSize: string;
  previewUrl: string;
}

export interface RenderParams {
  pointSize: number;
  sigma: number;
  alphaThreshold: number;
  brightness: number;
  showNormals: boolean;
  sortEnabled: boolean;
  sortInterval: number;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  pointCount: number;
  visiblePoints: number;
  gpuMemoryMB: number;
  sortTime: number;
  renderTime: number;
  drawCalls: number;
}

export interface LoadProgress {
  loaded: number;
  total: number;
  percentage: number;
  chunksLoaded: number;
  totalChunks: number;
}

export interface ChunkData {
  chunkIndex: number;
  pointCount: number;
  data: Float32Array;
}

export interface DepthSortResult {
  sortedIndices: Uint32Array;
  sortTime: number;
}

export const DEFAULT_RENDER_PARAMS: RenderParams = {
  pointSize: 8.0,
  sigma: 0.5,
  alphaThreshold: 0.01,
  brightness: 1.0,
  showNormals: false,
  sortEnabled: true,
  sortInterval: 2,
};
