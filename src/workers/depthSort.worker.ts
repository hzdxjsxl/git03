export interface DepthSortRequest {
  type: 'sort';
  positions: Float32Array;
  viewMatrix: Float32Array;
  pointCount: number;
  stride: number;
}

export interface DepthSortResponse {
  type: 'sorted';
  sortedIndices: Uint32Array;
  sortTime: number;
}

export interface DepthSortInit {
  type: 'init';
  maxPoints: number;
}

type Message = DepthSortRequest | DepthSortInit;

let depthBuffer: Float32Array | null = null;
let indexBuffer: Uint32Array | null = null;

function initBuffers(maxPoints: number): void {
  depthBuffer = new Float32Array(maxPoints);
  indexBuffer = new Uint32Array(maxPoints);
  for (let i = 0; i < maxPoints; i++) {
    indexBuffer[i] = i;
  }
}

function computeDepth(
  positions: Float32Array,
  viewMatrix: Float32Array,
  pointCount: number,
  stride: number,
  depths: Float32Array
): void {
  const m20 = viewMatrix[8];
  const m21 = viewMatrix[9];
  const m22 = viewMatrix[10];
  const m23 = viewMatrix[11];

  for (let i = 0; i < pointCount; i++) {
    const offset = i * stride;
    const x = positions[offset];
    const y = positions[offset + 1];
    const z = positions[offset + 2];
    depths[i] = m20 * x + m21 * y + m22 * z + m23;
  }
}

function quickSortIndices(
  depths: Float32Array,
  indices: Uint32Array,
  left: number,
  right: number
): void {
  if (left >= right) return;

  const pivotDepth = depths[indices[(left + right) >> 1]];
  let i = left;
  let j = right;

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

function radixSortIndices(
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
      const radix = key & 0xff;
      temp[count[radix]++] = indices[i];
    }

    indices.set(temp);
  }
}

self.onmessage = function (e: MessageEvent<Message>): void {
  const msg = e.data;

  if (msg.type === 'init') {
    initBuffers(msg.maxPoints);
    return;
  }

  if (msg.type === 'sort') {
    const startTime = performance.now();

    if (!depthBuffer || !indexBuffer) {
      initBuffers(msg.pointCount);
    }

    if (depthBuffer!.length < msg.pointCount) {
      initBuffers(msg.pointCount);
    }

    computeDepth(
      msg.positions,
      msg.viewMatrix,
      msg.pointCount,
      msg.stride,
      depthBuffer!
    );

    for (let i = 0; i < msg.pointCount; i++) {
      indexBuffer![i] = i;
    }

    if (msg.pointCount < 50000) {
      quickSortIndices(depthBuffer!, indexBuffer!, 0, msg.pointCount - 1);
    } else {
      radixSortIndices(depthBuffer!, indexBuffer!, msg.pointCount);
    }

    const sortTime = performance.now() - startTime;

    const response: DepthSortResponse = {
      type: 'sorted',
      sortedIndices: indexBuffer!.slice(0, msg.pointCount),
      sortTime,
    };

    (self as unknown as Worker).postMessage(response, [response.sortedIndices.buffer as ArrayBuffer]);
  }
};
