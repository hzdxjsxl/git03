import { NoiseGenerator } from './noise.js';

export class Chunk {
    constructor(size) {
        this.size = size;
        this.voxels = new Uint8Array(size * size * size);
        this.mesh = null;
        this.loaded = false;
    }
}

export class TerrainGenerator {
    constructor(seed = 12345) {
        this.noise = new NoiseGenerator(seed);
        this.seed = seed;
    }

    generateChunk(chunkX, chunkZ, chunkSize = 32, worldHeight = 64) {
        const chunk = new Chunk(chunkSize);
        
        const offsetX = chunkX * chunkSize;
        const offsetZ = chunkZ * chunkSize;

        for (let x = 0; x < chunkSize; x++) {
            for (let z = 0; z < chunkSize; z++) {
                const worldX = offsetX + x;
                const worldZ = offsetZ + z;
                
                const height = this.getHeight(worldX, worldZ, worldHeight);
                
                for (let y = 0; y < chunkSize; y++) {
                    const worldY = y;
                    if (worldY <= height) {
                        const voxelType = this.getVoxelType(worldY, height);
                        chunk.voxels[x + y * chunkSize + z * chunkSize * chunkSize] = voxelType;
                    }
                }
            }
        }

        chunk.loaded = true;
        return chunk;
    }

    getHeight(x, z, worldHeight) {
        const baseHeight = worldHeight * 0.4;
        
        const terrainNoise = this.noise.octaveNoise(x * 0.01, z * 0.01, 0, 6, 0.5) * 20;
        const detailNoise = this.noise.octaveNoise(x * 0.03, z * 0.03, 0, 4, 0.4) * 5;
        const mountainNoise = this.noise.octaveNoise(x * 0.005, z * 0.005, 0, 5, 0.5) * 30;
        
        let height = baseHeight + terrainNoise + detailNoise + mountainNoise;
        
        const caveNoise = this.noise.octaveNoise(x * 0.02, height * 0.02, z * 0.02, 4, 0.5);
        if (caveNoise > 0.3) {
            height -= caveNoise * 8;
        }
        
        return Math.max(2, Math.min(worldHeight - 1, height));
    }

    getVoxelType(y, height) {
        if (y === 0) {
            return 4;
        } else if (y === height) {
            return 2;
        } else if (y >= height - 1) {
            return 3;
        } else if (y >= height - 3) {
            return 1;
        } else {
            return 4;
        }
    }

    getVoxelColor(type) {
        const colors = {
            0: [0, 0, 0, 0],
            1: [139, 90, 43, 255],
            2: [34, 139, 34, 255],
            3: [139, 119, 101, 255],
            4: [101, 67, 33, 255]
        };
        return colors[type] || [128, 128, 128, 255];
    }
}