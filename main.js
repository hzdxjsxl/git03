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
        
        this.terrainGenerator = new TerrainGenerator(12345);
        this.mesher = new GreedyMesher();
        this.camera = new Camera(this.canvas);
        
        this.programs = {};
        this.buffers = {};
        
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        this.fps = 0;
        
        this.visibleFaceCount = 0;
        
        this.init();
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.lastTime = performance.now();
        this.animate();
    }

    init() {
        this.gl.clearColor(0.5, 0.7, 1.0, 1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        
        this.createProgram();
        this.createBuffers();
        this.loadInitialChunks();
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
                gl_Position = uProjection * uView * vec4(aPosition, 1.0);
                vNormal = aNormal;
                vPosition = aPosition;
            }
        `;
        
        const fragmentShaderSource = `
            precision mediump float;
            
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            void main() {
                vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
                float diff = max(dot(vNormal, lightDir), 0.3);
                
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
                
                gl_FragColor = vec4(color * diff, 1.0);
            }
        `;
        
        const vertexShader = this.createShader(vertexShaderSource, this.gl.VERTEX_SHADER);
        const fragmentShader = this.createShader(fragmentShaderSource, this.gl.FRAGMENT_SHADER);
        
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Shader link error:', this.gl.getProgramInfoLog(program));
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

    createBuffers() {
        this.buffers.position = this.gl.createBuffer();
        this.buffers.normal = this.gl.createBuffer();
        this.buffers.index = this.gl.createBuffer();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    loadInitialChunks() {
        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                this.loadChunk(x, z);
            }
        }
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
        
        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                toLoad.add(`${cameraChunkX + x},${cameraChunkZ + z}`);
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
                this.loadChunk(x, z);
            }
        });
    }

    render() {
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
        document.getElementById('pos').textContent = 
            `${Math.floor(this.camera.position.x)}, ${Math.floor(this.camera.position.y)}, ${Math.floor(this.camera.position.z)}`;
        
        const chunkX = Math.floor(this.camera.position.x / this.chunkSize);
        const chunkZ = Math.floor(this.camera.position.z / this.chunkSize);
        document.getElementById('chunk').textContent = `${chunkX}, ${chunkZ}`;
        
        document.getElementById('faces').textContent = this.visibleFaceCount.toLocaleString();
        document.getElementById('fps').textContent = this.fps;
    }

    animate() {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.frameCount++;
        if (currentTime - this.lastFpsUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
        }
        
        this.camera.update(deltaTime);
        this.updateChunks();
        this.render();
        this.updateInfo();
        
        requestAnimationFrame(() => this.animate());
    }
}

new VoxelWorld();