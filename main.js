import { TerrainGenerator } from './terrain.js';
import { GreedyMesher } from './greedy.js';
import { Camera } from './camera.js';

class VoxelWorld {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.gl = this.canvas.getContext('webgl');
        
        this.chunkSize = 32;
        this.renderDistance = 4;
        this.chunks = new Map();
        this.loadingQueue = [];
        
        this.terrainGenerator = new TerrainGenerator(12345);
        this.mesher = new GreedyMesher();
        this.camera = new Camera(this.canvas);
        
        this.programs = {};
        
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        this.fps = 0;
        this.frameTime = 0;
        
        this.visibleFaceCount = 0;
        
        this.init();
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.lastTime = performance.now();
        this.targetDeltaTime = 1000 / 60;
        this.accumulator = 0;
        
        this.animate();
    }

    init() {
        if (!this.gl) {
            console.error('WebGL not supported');
            return;
        }
        
        this.gl.clearColor(0.5, 0.7, 1.0, 1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.frontFace(this.gl.CCW);
        
        this.createProgram();
        this.loadInitialChunksAsync();
    }

    createProgram() {
        const vertexShaderSource = `
            attribute vec3 aPosition;
            attribute vec3 aNormal;
            
            uniform mat4 uProjection;
            uniform mat4 uView;
            
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            void main() {
                vec4 pos = uProjection * uView * vec4(aPosition, 1.0);
                gl_Position = pos;
                vNormal = normalize(aNormal);
                vPosition = aPosition;
            }
        `;
        
        const fragmentShaderSource = `
            precision mediump float;
            
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            void main() {
                vec3 lightDir = normalize(vec3(1.0, 2.0, 1.0));
                float diff = max(dot(vNormal, lightDir), 0.25);
                float ambient = 0.3;
                
                float height = vPosition.y;
                vec3 color;
                
                if (height < 5.0) {
                    color = vec3(0.4, 0.26, 0.13);
                } else if (height < 8.0) {
                    color = vec3(0.54, 0.35, 0.17);
                } else if (height < 10.0) {
                    color = vec3(0.54, 0.47, 0.4);
                } else {
                    color = vec3(0.13, 0.55, 0.13);
                }
                
                gl_FragColor = vec4(color * (ambient + diff), 1.0);
            }
        `;
        
        const vertexShader = this.createShader(vertexShaderSource, this.gl.VERTEX_SHADER);
        const fragmentShader = this.createShader(fragmentShaderSource, this.gl.FRAGMENT_SHADER);
        
        if (!vertexShader || !fragmentShader) return;
        
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Shader link error:', this.gl.getProgramInfoLog(program));
            return;
        }
        
        this.programs.main = program;
        this.programs.main.aPosition = this.gl.getAttribLocation(program, 'aPosition');
        this.programs.main.aNormal = this.gl.getAttribLocation(program, 'aNormal');
        this.programs.main.uProjection = this.gl.getUniformLocation(program, 'uProjection');
        this.programs.main.uView = this.gl.getUniformLocation(program, 'uView');
    }

    createShader(source, type) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
            return null;
        }
        
        return shader;
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.gl) {
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    loadInitialChunksAsync() {
        const cameraChunkX = 0;
        const cameraChunkZ = 0;
        
        for (let dx = -this.renderDistance; dx <= this.renderDistance; dx++) {
            for (let dz = -this.renderDistance; dz <= this.renderDistance; dz++) {
                const priority = Math.abs(dx) + Math.abs(dz);
                this.loadingQueue.push({
                    x: cameraChunkX + dx,
                    z: cameraChunkZ + dz,
                    priority: priority
                });
            }
        }
        
        this.loadingQueue.sort((a, b) => a.priority - b.priority);
        this.processLoadingQueue();
    }

    processLoadingQueue() {
        if (this.loadingQueue.length === 0) return;
        
        const item = this.loadingQueue.shift();
        this.loadChunk(item.x, item.z);
        
        setTimeout(() => {
            this.processLoadingQueue();
        }, 16);
    }

    loadChunk(chunkX, chunkZ) {
        const key = `${chunkX},${chunkZ}`;
        if (this.chunks.has(key)) return;
        
        const chunk = this.terrainGenerator.generateChunk(chunkX, chunkZ, this.chunkSize);
        const meshData = this.mesher.mesh(chunk, chunkX, chunkZ);
        
        chunk.mesh = {
            vertexBuffer: this.gl.createBuffer(),
            normalBuffer: this.gl.createBuffer(),
            indexBuffer: this.gl.createBuffer(),
            indexCount: meshData.indices.length
        };
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, chunk.mesh.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, meshData.vertices, this.gl.STATIC_DRAW);
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, chunk.mesh.normalBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, meshData.normals, this.gl.STATIC_DRAW);
        
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, chunk.mesh.indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, meshData.indices, this.gl.STATIC_DRAW);
        
        this.chunks.set(key, chunk);
    }

    unloadChunk(chunkX, chunkZ) {
        const key = `${chunkX},${chunkZ}`;
        const chunk = this.chunks.get(key);
        
        if (chunk && chunk.mesh) {
            this.gl.deleteBuffer(chunk.mesh.vertexBuffer);
            this.gl.deleteBuffer(chunk.mesh.normalBuffer);
            this.gl.deleteBuffer(chunk.mesh.indexBuffer);
        }
        
        this.chunks.delete(key);
    }

    updateChunks() {
        const cameraChunkX = Math.floor(this.camera.position.x / this.chunkSize);
        const cameraChunkZ = Math.floor(this.camera.position.z / this.chunkSize);
        
        const toLoad = new Set();
        const toUnload = new Set();
        
        for (let dx = -this.renderDistance; dx <= this.renderDistance; dx++) {
            for (let dz = -this.renderDistance; dz <= this.renderDistance; dz++) {
                toLoad.add(`${cameraChunkX + dx},${cameraChunkZ + dz}`);
            }
        }
        
        this.chunks.forEach((_, key) => {
            if (!toLoad.has(key)) {
                toUnload.add(key);
            }
        });
        
        toUnload.forEach(key => {
            const [x, z] = key.split(',').map(Number);
            this.unloadChunk(x, z);
        });
        
        toLoad.forEach(key => {
            if (!this.chunks.has(key)) {
                const [x, z] = key.split(',').map(Number);
                const priority = Math.abs(x - cameraChunkX) + Math.abs(z - cameraChunkZ);
                const existing = this.loadingQueue.find(item => item.x === x && item.z === z);
                if (!existing) {
                    this.loadingQueue.push({ x, z, priority });
                    this.loadingQueue.sort((a, b) => a.priority - b.priority);
                }
            }
        });
    }

    render() {
        if (!this.gl || !this.programs.main) return;
        
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        const program = this.programs.main;
        this.gl.useProgram(program);
        
        const projectionMatrix = this.camera.getProjectionMatrix(this.canvas.width / this.canvas.height);
        const viewMatrix = this.camera.getViewMatrix();
        
        this.gl.uniformMatrix4fv(program.uProjection, false, projectionMatrix);
        this.gl.uniformMatrix4fv(program.uView, false, viewMatrix);
        
        let totalFaces = 0;
        
        this.chunks.forEach(chunk => {
            if (!chunk.mesh) return;
            
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, chunk.mesh.vertexBuffer);
            this.gl.vertexAttribPointer(program.aPosition, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(program.aPosition);
            
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, chunk.mesh.normalBuffer);
            this.gl.vertexAttribPointer(program.aNormal, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(program.aNormal);
            
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, chunk.mesh.indexBuffer);
            this.gl.drawElements(this.gl.TRIANGLES, chunk.mesh.indexCount, this.gl.UNSIGNED_INT, 0);
            
            totalFaces += chunk.mesh.indexCount / 3;
        });
        
        this.visibleFaceCount = totalFaces;
    }

    updateInfo() {
        const pos = document.getElementById('pos');
        const chunkElem = document.getElementById('chunk');
        const faces = document.getElementById('faces');
        const fps = document.getElementById('fps');
        
        if (pos) {
            pos.textContent = `${Math.floor(this.camera.position.x)}, ${Math.floor(this.camera.position.y)}, ${Math.floor(this.camera.position.z)}`;
        }
        
        const chunkX = Math.floor(this.camera.position.x / this.chunkSize);
        const chunkZ = Math.floor(this.camera.position.z / this.chunkSize);
        if (chunkElem) {
            chunkElem.textContent = `${chunkX}, ${chunkZ}`;
        }
        
        if (faces) {
            faces.textContent = this.visibleFaceCount.toLocaleString();
        }
        
        if (fps) {
            fps.textContent = this.fps;
        }
    }

    animate() {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.accumulator += deltaTime;
        
        while (this.accumulator >= this.targetDeltaTime) {
            this.camera.update(this.targetDeltaTime / 1000);
            this.updateChunks();
            this.accumulator -= this.targetDeltaTime;
        }
        
        this.frameCount++;
        if (currentTime - this.lastFpsUpdate >= 500) {
            this.fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
        }
        
        this.render();
        this.updateInfo();
        
        if (this.loadingQueue.length > 0) {
            requestAnimationFrame(() => {
                this.processLoadingQueue();
            });
        }
        
        requestAnimationFrame(() => this.animate());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new VoxelWorld();
});