import { DepthSortRequest, DepthSortResponse } from '../workers/depthSort.worker';

export interface SortResult {
  sortedIndices: Uint32Array | null;
  sortTime: number;
  pending: boolean;
}

export class DepthSorter {
  private worker: Worker | null = null;
  private pending = false;
  private currentResult: Uint32Array | null = null;
  private lastSortTime = 0;
  private frameCount = 0;
  private sortInterval = 2;
  private enabled = true;
  private maxPoints = 5000000;
  private cameraMoved = true;
  private lastCameraPosition = new Float32Array(3);

  constructor() {
    this.initWorker();
  }

  private initWorker(): void {
    try {
      const workerCode = `
        ${this.getWorkerCode()}
        self.onmessage = onmessage;
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.worker = new Worker(URL.createObjectURL(blob));

      this.worker.onmessage = (e: MessageEvent<DepthSortResponse>) => {
        this.handleSortResult(e.data);
      };

      this.worker.postMessage({
        type: 'init',
        maxPoints: this.maxPoints,
      });
    } catch (e) {
      console.warn('Web Worker not available, falling back to main thread sorting');
      this.worker = null;
    }
  }

  private getWorkerCode(): string {
    return `
let depthBuffer = null;
let indexBuffer = null;

function initBuffers(maxPoints) {
  depthBuffer = new Float32Array(maxPoints);
  indexBuffer = new Uint32Array(maxPoints);
  for (let i = 0; i < maxPoints; i++) {
    indexBuffer[i] = i;
  }
}

function computeDepth(positions, viewMatrix, pointCount, stride, depths) {
  const m20 = viewMatrix[8];
  const m21 = viewMatrix[9];
  const m22 = viewMatrix[10];
  const m23 = viewMatrix[11];
  for (let i = 0; i < pointCount; i++) {
    const offset = i * stride;
    depths[i] = m20 * positions[offset] + m21 * positions[offset + 1] + m22 * positions[offset + 2] + m23;
  }
}

function quickSortIndices(depths, indices, left, right) {
  if (left >= right) return;
  const pivotDepth = depths[indices[(left + right) >> 1]];
  let i = left, j = right;
  while (i <= j) {
    while (depths[indices[i]] < pivotDepth) i++;
    while (depths[indices[j]] > pivotDepth) j--;
    if (i <= j) {
      const tmp = indices[i];
      indices[i] = indices[j];
      indices[j] = tmp;
      i++;
      j--;
    }
  }
  quickSortIndices(depths, indices, left, j);
  quickSortIndices(depths, indices, i, right);
}

function radixSortIndices(depths, indices, pointCount) {
  const floatView = new Float32Array(1);
  const intView = new Uint32Array(floatView.buffer);
  const temp = new Uint32Array(pointCount);
  const count = new Uint32Array(256);
  for (let shift = 0; shift < 32; shift += 8) {
    count.fill(0);
    for (let i = 0; i < pointCount; i++) {
      floatView[0] = depths[indices[i]];
      let key = intView[0];
      key = (key ^ ((key >> 31) | 0x80000000)) >>> shift;
      count[key & 0xff]++;
    }
    let prefix = 0;
    for (let i = 0; i < 256; i++) {
      const c = count[i];
      count[i] = prefix;
      prefix += c;
    }
    for (let i = 0; i < pointCount; i++) {
      floatView[0] = depths[indices[i]];
      let key = intView[0];
      key = (key ^ ((key >> 31) | 0x80000000)) >>> shift;
      temp[count[key & 0xff]++] = indices[i];
    }
    indices.set(temp);
  }
}

function onmessage(e) {
  const msg = e.data;
  if (msg.type === 'init') {
    initBuffers(msg.maxPoints);
    return;
  }
  if (msg.type === 'sort') {
    const startTime = performance.now();
    if (!depthBuffer || depthBuffer.length < msg.pointCount) {
      initBuffers(msg.pointCount);
    }
    computeDepth(msg.positions, msg.viewMatrix, msg.pointCount, msg.stride, depthBuffer);
    for (let i = 0; i < msg.pointCount; i++) {
      indexBuffer[i] = i;
    }
    if (msg.pointCount < 50000) {
      quickSortIndices(depthBuffer, indexBuffer, 0, msg.pointCount - 1);
    } else {
      radixSortIndices(depthBuffer, indexBuffer, msg.pointCount);
    }
    const sortTime = performance.now() - startTime;
    const response = {
      type: 'sorted',
      sortedIndices: indexBuffer.slice(0, msg.pointCount),
      sortTime: sortTime,
    };
    self.postMessage(response, [response.sortedIndices.buffer]);
  }
}
    `;
  }

  private handleSortResult(result: DepthSortResponse): void {
    this.currentResult = result.sortedIndices;
    this.lastSortTime = result.sortTime;
    this.pending = false;
  }

  public requestSort(
    positions: Float32Array,
    viewMatrix: Float32Array,
    cameraPosition: Float32Array,
    pointCount: number,
    stride: number
  ): SortResult {
    if (!this.enabled) {
      return {
        sortedIndices: null,
        sortTime: 0,
        pending: false,
      };
    }

    this.frameCount++;

    const dx = cameraPosition[0] - this.lastCameraPosition[0];
    const dy = cameraPosition[1] - this.lastCameraPosition[1];
    const dz = cameraPosition[2] - this.lastCameraPosition[2];
    const moved = dx * dx + dy * dy + dz * dz > 0.0001;
    this.cameraMoved = this.cameraMoved || moved;
    this.lastCameraPosition.set(cameraPosition);

    if (this.frameCount % this.sortInterval === 0 && !this.pending && this.cameraMoved) {
      this.pending = true;
      this.cameraMoved = false;

      const request: DepthSortRequest = {
        type: 'sort',
        positions: positions.slice(0, pointCount * stride),
        viewMatrix: viewMatrix.slice(),
        pointCount,
        stride,
      };

      if (this.worker) {
        this.worker.postMessage(request, [request.positions.buffer, request.viewMatrix.buffer]);
      } else {
        this.sortMainThread(positions, viewMatrix, pointCount, stride);
      }
    }

    return {
      sortedIndices: this.currentResult,
      sortTime: this.lastSortTime,
      pending: this.pending,
    };
  }

  private sortMainThread(
    positions: Float32Array,
    viewMatrix: Float32Array,
    pointCount: number,
    stride: number
  ): void {
    const startTime = performance.now();

    const depths = new Float32Array(pointCount);
    const indices = new Uint32Array(pointCount);

    for (let i = 0; i < pointCount; i++) {
      indices[i] = i;
    }

    const m20 = viewMatrix[8];
    const m21 = viewMatrix[9];
    const m22 = viewMatrix[10];
    const m23 = viewMatrix[11];

    for (let i = 0; i < pointCount; i++) {
      const offset = i * stride;
      depths[i] = m20 * positions[offset] + m21 * positions[offset + 1] + m22 * positions[offset + 2] + m23;
    }

    this.radixSortMainThread(depths, indices, pointCount);

    this.currentResult = indices;
    this.lastSortTime = performance.now() - startTime;
    this.pending = false;
  }

  private radixSortMainThread(
    depths: Float32Array,
    indices: Uint32Array,
    pointCount: number
  ): void {
    const floatView = new Float32Array(1);
    const intView = new Uint32Array(floatView.buffer);
    const temp = new Uint32Array(pointCount);
    const count = new Uint32Array(256);

    for (let shift = 0; shift < 32; shift += 8) {
      count.fill(0);

      for (let i = 0; i < pointCount; i++) {
        floatView[0] = depths[indices[i]];
        let key = intView[0];
        key = (key ^ ((key >> 31) | 0x80000000)) >>> shift;
        count[key & 0xff]++;
      }

      let prefix = 0;
      for (let i = 0; i < 256; i++) {
        const c = count[i];
        count[i] = prefix;
        prefix += c;
      }

      for (let i = 0; i < pointCount; i++) {
        floatView[0] = depths[indices[i]];
        let key = intView[0];
        key = (key ^ ((key >> 31) | 0x80000000)) >>> shift;
        temp[count[key & 0xff]++] = indices[i];
      }

      indices.set(temp);
    }
  }

  public setSortInterval(interval: number): void {
    this.sortInterval = Math.max(1, interval);
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public dispose(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.currentResult = null;
  }
}
