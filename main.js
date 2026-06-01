import { TerrainGenerator } from './terrain.js';
import { GreedyMesher } from './greedy.js';
import { Camera } from './camera.js';

class VoxelWorld {
    constructor() {
        this.canvas = null;
        this.gl = null;
        
        this.chunkSize = 32;
        this.renderDistance = 4;
        this.chunks = new Map();
        this.loadingQueue = [];
        this.isLoading = false;
        
        this.terrainGenerator = new TerrainGenerator(12345);
        this.mesher = new GreedyMesher();
        this.camera = null;
        
        this.program = null;
        this.attribLocations = {};
        this.uniformLocations = {};
        
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        this.fps = 0;
        this.visibleFaceCount = 0;
        
        this.lastTime = 0;
        this.accumulator = 0;
        this.targetDeltaTime = 1000 / 60;
        
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupCanvas();
            if (!this.setupWebGL()) return;
            this.setupCamera();
            if (!this.createShaderProgram()) return;
            this.loadInitialChunks();
            this.startRenderLoop();
        });
    }

    setupCanvas() {
        this.canvas = document.getElementById('canvas');
        if (!this.canvas) {
            console.error('Canvas element not found');
            return;
        }
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    setupWebGL() {
        this.gl = this.canvas.getContext('webgl');
        if (!this.gl) {
            console.error('WebGL not supported');
            return false;
        }
        
        this.gl.clearColor(0.5, 0.7, 1.0, 1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.frontFace(this.gl.CCW);
        this.gl.cullFace(this.gl.BACK);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.flush();
        
        return true;
    }

    setupCamera() {
        this.camera = new Camera(this.canvas);
        this.camera.position = { x: 0, y: 40, z: 0 };
    }

    resize() {
        if (!this.canvas) return;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.canvas.style.width = `${window.innerWidth}px`;
        this.canvas.style.height = `${window.innerHeight}px`;
        if (this.gl) {
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    createShaderProgram() {
        const vertexShader = this.createShader(`
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
        `, this.gl.VERTEX_SHADER);
        
        const fragmentShader = this.createShader(`
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
        `, this.gl.FRAGMENT_SHADER);
        
        if (!vertexShader || !fragmentShader) return false;
        
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);
        
        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error('Shader link error:', this.gl.getProgramInfoLog(this.program));
            return false;
        }
        
        this.gl.useProgram(this.program);
        
        this.attribLocations.position = this.gl.getAttribLocation(this.program, 'aPosition');
        this.attribLocations.normal = this.gl.getAttribLocation(this.program, 'aNormal');
        this.uniformLocations.projection = this.gl.getUniformLocation(this.program, 'uProjection');
        this.uniformLocations.view = this.gl.getUniformLocation(this.program, 'uView');
        
        return true;
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

    loadInitialChunks() {
        for (let dx = -this.renderDistance; dx <= this.renderDistance; dx++) {
            for (let dz = -this.renderDistance; dz <= this.renderDistance; dz++) {
                const priority = Math.abs(dx) + Math.abs(dz);
                this.loadingQueue.push({ x: dx, z: dz, priority });
            }
        }
        this.loadingQueue.sort((a, b) => a.priority - b.priority);
    }

    processLoadingQueue() {
        if (this.loadingQueue.length === 0 || this.isLoading) return;
        
        this.isLoading = true;
        const itemsToLoad = Math.min(1, this.loadingQueue.length);
        
        for (let i = 0; i < itemsToLoad; i++) {
            if (this.loadingQueue.length === 0) break;
            const item = this.loadingQueue.shift();
            this.loadChunk(item.x, item.z);
        }
        
        this.isLoading = false;
    }

    loadChunk(chunkX, chunkZ) {
        const key = `${chunkX},${chunkZ}`;
        if (this.chunks.has(key)) return;
        
        try {
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
        } catch (error) {
            console.error('Failed to load chunk:', error);
        }
    }

    unloadChunk(chunkX, chunkZ) {
        const key = `${chunkX},${chunkZ}`;
        const chunk = this.chunks.get(key);
        
        if (chunk && chunk.mesh) {
            try {
                this.gl.deleteBuffer(chunk.mesh.vertexBuffer);
                this.gl.deleteBuffer(chunk.mesh.normalBuffer);
                this.gl.deleteBuffer(chunk.mesh.indexBuffer);
            } catch (error) {
                console.error('Failed to unload chunk:', error);
            }
        }
        
        this.chunks.delete(key);
    }

    updateChunks() {
        if (!this.camera) return;
        
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
                const exists = this.loadingQueue.some(item => item.x === x && item.z === z);
                if (!exists) {
                    this.loadingQueue.push({ x, z, priority });
                }
            }
        });
        
        this.loadingQueue.sort((a, b) => a.priority - b.priority);
    }

    render() {
        if (!this.gl || !this.program) return;
        
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        const projectionMatrix = this.camera.getProjectionMatrix(this.canvas.width / this.canvas.height);
        const viewMatrix = this.camera.getViewMatrix();
        
        this.gl.uniformMatrix4fv(this.uniformLocations.projection, false, projectionMatrix);
        this.gl.uniformMatrix4fv(this.uniformLocations.view, false, viewMatrix);
        
        let totalFaces = 0;
        
        this.chunks.forEach(chunk => {
            if (!chunk.mesh) return;
            
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, chunk.mesh.vertexBuffer);
            this.gl.vertexAttribPointer(this.attribLocations.position, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(this.attribLocations.position);
            
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, chunk.mesh.normalBuffer);
            this.gl.vertexAttribPointer(this.attribLocations.normal, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(this.attribLocations.normal);
            
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, chunk.mesh.indexBuffer);
            this.gl.drawElements(this.gl.TRIANGLES, chunk.mesh.indexCount, this.gl.UNSIGNED_INT, 0);
            
            totalFaces += chunk.mesh.indexCount / 3;
        });
        
        this.visibleFaceCount = totalFaces;
        this.gl.flush();
    }

    updateInfo() {
        if (!this.camera) return;
        
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

    startRenderLoop() {
        this.lastTime = performance.now();
        this.animate();
    }

    animate() {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.accumulator += deltaTime;
        
        while (this.accumulator >= this.targetDeltaTime) {
            if (this.camera) {
                this.camera.update(this.targetDeltaTime / 1000);
            }
            this.updateChunks();
            this.accumulator -= this.targetDeltaTime;
        }
        
        this.frameCount++;
        if (currentTime - this.lastFpsUpdate >= 200) {
            this.fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
        }
        
        this.render();
        this.updateInfo();
        this.processLoadingQueue();
        
        requestAnimationFrame(() => this.animate());
    }
}

new VoxelWorld();