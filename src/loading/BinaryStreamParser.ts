import { POINT_STRIDE, POINT_BYTE_SIZE, ChunkData } from '../types/pointcloud';

export class BinaryStreamParser {
  private leftover: Uint8Array | null = null;
  private chunkHeaderSize = 8;

  public parse(chunk: ArrayBuffer): ChunkData[] {
    const results: ChunkData[] = [];

    let data: Uint8Array;
    if (this.leftover) {
      const combined = new Uint8Array(this.leftover.length + chunk.byteLength);
      combined.set(this.leftover, 0);
      combined.set(new Uint8Array(chunk), this.leftover.length);
      data = combined;
      this.leftover = null;
    } else {
      data = new Uint8Array(chunk);
    }

    let offset = 0;
    while (offset + this.chunkHeaderSize <= data.length) {
      const view = new DataView(data.buffer, data.byteOffset + offset);
      const chunkIndex = view.getUint32(0, true);
      const pointCount = view.getUint32(4, true);
      const chunkDataSize = pointCount * POINT_BYTE_SIZE;

      if (offset + this.chunkHeaderSize + chunkDataSize > data.length) {
        break;
      }

      const pointDataOffset = offset + this.chunkHeaderSize;
      const rawBytes = pointCount * POINT_BYTE_SIZE;
      const floatData = new Float32Array(pointCount * POINT_STRIDE);
      const srcView = new Uint8Array(data.buffer, data.byteOffset + pointDataOffset, rawBytes);
      new Uint8Array(floatData.buffer).set(srcView);

      results.push({
        chunkIndex,
        pointCount,
        data: floatData,
      });

      offset += this.chunkHeaderSize + chunkDataSize;
    }

    if (offset < data.length) {
      this.leftover = new Uint8Array(data.length - offset);
      this.leftover.set(data.subarray(offset));
    }

    return results;
  }

  public reset(): void {
    this.leftover = null;
  }

  public hasLeftover(): boolean {
    return this.leftover !== null && this.leftover.length > 0;
  }
}
