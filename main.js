import { TerrainGenerator } from './terrain.js';
import { GreedyMesher } from './greedy.js';
import { Camera } from './camera.js';

class VoxelWorld {
    constructor() {
        this.canvas = null;
        this.gl = null;
        
        this.chunkSize = 32;
        this.renderDistance = 3;
        this.chunks = new Map();
        
        this.terrainGenerator = new TerrainGenerator(12345);
        this.mesher = new GreedyMesher();
        this.camera = null;
        
        this.program = null;
        this.attribLocations = {};
        this.uniformLocations = {};
        
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsTime = 0;
        this.visibleFaceCount = 0;
        
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setup();
        });
    }

    setup() {
        this.canvas = document.getElementById('canvas');
        if (!this.canvas) {
            console.error('Canvas not found');
            return;
        }

        this.gl = this.canvas.getContext('webgl');
        if (!this.gl) {
            console.error('WebGL not supported');
            return;
        }

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.gl.clearColor(0.5, 0.7, 1.0, 1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.frontFace(this.gl.CCW);
        this.gl.cullFace(this.gl.BACK);

        this.createProgram();
        this.camera = new Camera(this.canvas);
        this.camera.position = { x: 0, y: 35, z: 0 };
        
        this.loadAllChunks();
        this.startLoop();
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.canvas.style.width = `${window.innerWidth}px`;
        this.canvas.style.height = `${window.innerHeight}px`;
        if (this.gl) {
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    createProgram() {
        const vertexSource = `
            attribute vec3 aPosition;
            attribute vec3 aNormal;
            
            uniform mat4 uProj;
            uniform mat4 uView;
            
            varying vec3 vNormal;
            varying vec3 vPos;
            
            void main() {
                gl_Position = uProj * uView * vec4(aPosition, 1.0);
                vNormal = normalize(aNormal);
                vPos = aPosition;
            }
        `;

        const fragmentSource = `
            precision mediump float;
            
            varying vec3 vNormal;
            varying vec3 vPos;
            
            void main() {
                vec3 light = normalize(vec3(1.0, 2.0, 1.0));
                float diff = max(dot(vNormal, light), 0.2);
                
                float h = vPos.y;
                vec3 col;
                
                if (h < 5.0) {
                    col = vec3(0.4, 0.26, 0.13);
                } else if (h < 8.0) {
                    col = vec3(0.54, 0.35, 0.17);
                } else if (h < 10.0) {
                    col = vec3(0.54, 0.47, 0.4);
                } else {
                    col = vec3(0.13, 0.55, 0.13);
                }
                
                gl_FragColor = vec4(col * (0.3 + diff), 1.0);
            }
        `;

        const vertexShader = this.createShader(vertexSource, this.gl.VERTEX_SHADER);
        const fragmentShader = this.createShader(fragmentSource, this.gl.FRAGMENT_SHADER);

        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error('Link error:', this.gl.getProgramInfoLog(this.program));
            return;
        }

        this.gl.useProgram(this.program);

        this.attribLocations.pos = this.gl.getAttribLocation(this.program, 'aPosition');
        this.attribLocations.normal = this.gl.getAttribLocation(this.program, 'aNormal');
        this.uniformLocations.proj = this.gl.getUniformLocation(this.program, 'uProj');
        this.uniformLocations.view = this.gl.getUniformLocation(this.program, 'uView');
    }

    createShader(source, type) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader error:', this.gl.getShaderInfoLog(shader));
            return null;
        }
        
        return shader;
    }

    loadAllChunks() {
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
        const mesh = this.mesher.mesh(chunk, chunkX, chunkZ);

        chunk.vbo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, chunk.vbo);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, mesh.vertices, this.gl.STATIC_DRAW);

        chunk.nbo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, chunk.nbo);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, mesh.normals, this.gl.STATIC_DRAW);

        chunk.ibo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, chunk.ibo);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, mesh.indices, this.gl.STATIC_DRAW);

        chunk.indexCount = mesh.indices.length;
        chunk.loaded = true;

        this.chunks.set(key, chunk);
    }

    render() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        const proj = this.camera.getProjectionMatrix(this.canvas.width / this.canvas.height);
        const view = this.camera.getViewMatrix();

        this.gl.uniformMatrix4fv(this.uniformLocations.proj, false, proj);
        this.gl.uniformMatrix4fv(this.uniformLocations.view, false, view);

        let totalFaces = 0;

        this.chunks.forEach(chunk => {
            if (!chunk.loaded || !chunk.vbo) return;

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, chunk.vbo);
            this.gl.vertexAttribPointer(this.attribLocations.pos, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(this.attribLocations.pos);

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, chunk.nbo);
            this.gl.vertexAttribPointer(this.attribLocations.normal, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(this.attribLocations.normal);

            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, chunk.ibo);
            this.gl.drawElements(this.gl.TRIANGLES, chunk.indexCount, this.gl.UNSIGNED_INT, 0);

            totalFaces += chunk.indexCount / 3;
        });

        this.visibleFaceCount = totalFaces;
        this.gl.flush();
    }

    updateInfo() {
        if (!this.camera) return;

        document.getElementById('pos').textContent = 
            `${Math.floor(this.camera.position.x)}, ${Math.floor(this.camera.position.y)}, ${Math.floor(this.camera.position.z)}`;
        
        const cx = Math.floor(this.camera.position.x / this.chunkSize);
        const cz = Math.floor(this.camera.position.z / this.chunkSize);
        document.getElementById('chunk').textContent = `${cx}, ${cz}`;
        
        document.getElementById('faces').textContent = this.visibleFaceCount.toLocaleString();
        document.getElementById('fps').textContent = this.fps;
    }

    startLoop() {
        let lastTime = performance.now();
        
        const loop = () => {
            const now = performance.now();
            const delta = (now - lastTime) / 1000;
            lastTime = now;

            this.frameCount++;
            if (now - this.lastFpsTime >= 500) {
                this.fps = Math.round(this.frameCount * 1000 / (now - this.lastFpsTime));
                this.frameCount = 0;
                this.lastFpsTime = now;
            }

            this.camera.update(delta);
            this.render();
            this.updateInfo();

            requestAnimationFrame(loop);
        };

        loop();
    }
}

new VoxelWorld();