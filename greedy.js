export class GreedyMesher {
    constructor() {
        this.vertices = [];
        this.indices = [];
        this.uvs = [];
        this.normals = [];
    }

    clear() {
        this.vertices = [];
        this.indices = [];
        this.uvs = [];
        this.normals = [];
    }

    mesh(chunk, chunkX, chunkZ) {
        this.clear();
        const size = chunk.size;
        const voxels = chunk.voxels;
        
        const offsetX = chunkX * size;
        const offsetZ = chunkZ * size;

        const faces = [
            { axis: 1, normal: [-1, 0, 0], shift: [-1, 0, 0] },
            { axis: 1, normal: [1, 0, 0], shift: [1, 0, 0] },
            { axis: 2, normal: [0, -1, 0], shift: [0, -1, 0] },
            { axis: 2, normal: [0, 1, 0], shift: [0, 1, 0] },
            { axis: 3, normal: [0, 0, -1], shift: [0, 0, -1] },
            { axis: 3, normal: [0, 0, 1], shift: [0, 0, 1] }
        ];

        for (const face of faces) {
            this.meshFace(voxels, size, face, offsetX, offsetZ);
        }

        return {
            vertices: new Float32Array(this.vertices),
            indices: new Uint32Array(this.indices),
            uvs: new Float32Array(this.uvs),
            normals: new Float32Array(this.normals)
        };
    }

    meshFace(voxels, size, face, offsetX, offsetZ) {
        const { axis, normal, shift } = face;
        const [sx, sy, sz] = shift;
        const [nx, ny, nz] = normal;

        const mask = new Uint8Array(size * size);
        const pos = [0, 0, 0];

        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (axis === 1) {
                    pos[0] = -1;
                    pos[1] = i;
                    pos[2] = j;
                } else if (axis === 2) {
                    pos[0] = i;
                    pos[1] = -1;
                    pos[2] = j;
                } else {
                    pos[0] = i;
                    pos[1] = j;
                    pos[2] = -1;
                }

                let filled = false;
                let nextFilled = false;

                for (let d = 0; d <= size; d++) {
                    const p0 = this.getVoxel(voxels, size, pos[0], pos[1], pos[2]);
                    pos[0] += sx;
                    pos[1] += sy;
                    pos[2] += sz;
                    const p1 = this.getVoxel(voxels, size, pos[0], pos[1], pos[2]);

                    if (!filled && p1) {
                        filled = true;
                        mask[j * size + i] = p1;
                    } else if (filled && !p1) {
                        filled = false;
                    }

                    nextFilled = p1;
                }
            }
        }

        let i = 0;
        while (i < size) {
            let j = 0;
            while (j < size) {
                const voxelType = mask[j * size + i];
                if (voxelType) {
                    const width = this.getWidth(mask, size, i, j);
                    const height = this.getHeight(mask, size, i, j, width);

                    this.addFace(i, j, width, height, voxelType, axis, normal, offsetX, offsetZ);

                    for (let y = 0; y < height; y++) {
                        for (let x = 0; x < width; x++) {
                            mask[(j + y) * size + (i + x)] = 0;
                        }
                    }

                    j += height;
                }
                j++;
            }
            i++;
        }
    }

    getWidth(mask, size, x, y) {
        let w = 1;
        while (x + w < size && mask[y * size + x + w] === mask[y * size + x]) {
            w++;
        }
        return w;
    }

    getHeight(mask, size, x, y, width) {
        let h = 1;
        while (y + h < size) {
            let valid = true;
            for (let i = 0; i < width; i++) {
                if (mask[(y + h) * size + x + i] !== mask[y * size + x]) {
                    valid = false;
                    break;
                }
            }
            if (!valid) break;
            h++;
        }
        return h;
    }

    getVoxel(voxels, size, x, y, z) {
        if (x < 0 || x >= size || y < 0 || y >= size || z < 0 || z >= size) {
            return 0;
        }
        return voxels[x + y * size + z * size * size];
    }

    addFace(x, y, width, height, voxelType, axis, normal, offsetX, offsetZ) {
        const baseIndex = this.vertices.length / 3;

        if (axis === 1) {
            const px = normal[0] < 0 ? 0 : 1;
            this.vertices.push(
                px + offsetX, y + 0.5, x + 0.5 + offsetZ,
                px + offsetX, y + 0.5, x + height + 0.5 + offsetZ,
                px + offsetX, y + width + 0.5, x + height + 0.5 + offsetZ,
                px + offsetX, y + width + 0.5, x + 0.5 + offsetZ
            );
            this.uvs.push(
                0, 0,
                0, height,
                width, height,
                width, 0
            );
        } else if (axis === 2) {
            const py = normal[1] < 0 ? 0 : 1;
            this.vertices.push(
                x + 0.5, py, y + 0.5 + offsetZ,
                x + width + 0.5, py, y + 0.5 + offsetZ,
                x + width + 0.5, py, y + height + 0.5 + offsetZ,
                x + 0.5, py, y + height + 0.5 + offsetZ
            );
            this.uvs.push(
                0, 0,
                width, 0,
                width, height,
                0, height
            );
        } else {
            const pz = normal[2] < 0 ? 0 : 1;
            this.vertices.push(
                x + 0.5, y + width + 0.5, pz + offsetZ,
                x + 0.5, y + 0.5, pz + offsetZ,
                x + width + 0.5, y + 0.5, pz + offsetZ,
                x + width + 0.5, y + width + 0.5, pz + offsetZ
            );
            this.uvs.push(
                0, width,
                0, 0,
                width, 0,
                width, width
            );
        }

        for (let i = 0; i < 4; i++) {
            this.normals.push(normal[0], normal[1], normal[2]);
        }

        this.indices.push(
            baseIndex, baseIndex + 1, baseIndex + 2,
            baseIndex, baseIndex + 2, baseIndex + 3
        );
    }
}