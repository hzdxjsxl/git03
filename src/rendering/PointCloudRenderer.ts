import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  RenderParams,
  PerformanceMetrics,
  DEFAULT_RENDER_PARAMS,
  POINT_STRIDE,
} from '../types/pointcloud';

const vertexShader = `
precision highp float;

attribute vec3 aColor;
attribute vec3 aNormal;
attribute float aPointSize;

uniform float uPointScale;
uniform float uMinPointSize;
uniform float uMaxPointSize;
uniform float uViewportHeight;

varying vec3 vColor;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    float dist = -mvPosition.z;
    float fovFactor = projectionMatrix[1][1];
    float pixelSize = aPointSize * uPointScale * fovFactor * uViewportHeight / (2.0 * max(dist, 0.001));
    gl_PointSize = clamp(pixelSize, uMinPointSize, uMaxPointSize);

    vColor = aColor;
    vWorldNormal = normalize(mat3(modelMatrix) * aNormal);
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

    gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = `
precision highp float;

varying vec3 vColor;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

uniform float uSigma;
uniform float uAlphaThreshold;
uniform float uBrightness;
uniform bool uShowNormals;
uniform vec3 uLightPosition;
uniform vec3 uLightColor;
uniform vec3 uAmbientColor;

void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv) * 2.0;

    float alpha = exp(-(d * d) / (2.0 * uSigma * uSigma));

    if (alpha < uAlphaThreshold) discard;

    vec3 baseColor = vColor;
    if (uShowNormals) baseColor = vWorldNormal * 0.5 + 0.5;

    vec3 N = normalize(vWorldNormal);
    vec3 L = normalize(uLightPosition - vWorldPosition);
    vec3 V = normalize(cameraPosition - vWorldPosition);
    vec3 H = normalize(L + V);

    float diff = max(dot(N, L), 0.0);
    float spec = pow(max(dot(N, H), 0.0), 48.0);

    vec3 ambient = uAmbientColor * baseColor;
    vec3 diffuse = uLightColor * baseColor * diff;
    vec3 specular = uLightColor * spec * 0.4;

    vec3 finalColor = (ambient + diffuse + specular) * uBrightness;

    gl_FragColor = vec4(finalColor * alpha, alpha);
}
`;

export class PointCloudRenderer {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;

  private points: THREE.Points | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private material: THREE.ShaderMaterial | null = null;

  private srcPosition: Float32Array;
  private srcColor: Float32Array;
  private srcNormal: Float32Array;
  private srcSize: Float32Array;

  private gpuPosition: Float32Array;
  private gpuColor: Float32Array;
  private gpuNormal: Float32Array;
  private gpuSize: Float32Array;

  private pointCount = 0;
  private maxPoints = 5000000;
  private gpuAllocated = 0;

  private renderParams: RenderParams;
  private animationFrameId: number | null = null;
  private onMetricsUpdate: ((metrics: PerformanceMetrics) => void) | null = null;

  private lastFrameTime = 0;
  private frameTimes: number[] = [];
  private currentSortTime = 0;
  private currentRenderTime = 0;
  private currentDrawCalls = 0;

  private sortDepthBuf: Float32Array;
  private sortIndexBuf: Uint32Array;
  private sortTempBuf: Uint32Array;
  private sortCountBuf: Uint32Array;
  private lastCameraPos = new THREE.Vector3();
  private cameraMovedDist = 0;
  private sortFrameCounter = 0;
  private lastSortedIndices: Uint32Array | null = null;

  private boundingBox = new THREE.Box3();
  private autoFitPending = false;

  constructor(container: HTMLElement, renderParams?: Partial<RenderParams>) {
    this.container = container;
    this.renderParams = { ...DEFAULT_RENDER_PARAMS, ...renderParams };

    this.srcPosition = new Float32Array(this.maxPoints * 3);
    this.srcColor = new Float32Array(this.maxPoints * 3);
    this.srcNormal = new Float32Array(this.maxPoints * 3);
    this.srcSize = new Float32Array(this.maxPoints);

    this.gpuPosition = new Float32Array(this.maxPoints * 3);
    this.gpuColor = new Float32Array(this.maxPoints * 3);
    this.gpuNormal = new Float32Array(this.maxPoints * 3);
    this.gpuSize = new Float32Array(this.maxPoints);

    this.sortDepthBuf = new Float32Array(this.maxPoints);
    this.sortIndexBuf = new Uint32Array(this.maxPoints);
    this.sortTempBuf = new Uint32Array(this.maxPoints);
    this.sortCountBuf = new Uint32Array(256);

    this.renderer = this.createRenderer();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e17);
    this.camera = this.createCamera();
    this.controls = this.createControls();

    window.addEventListener('resize', this.handleResize);
    this.createMaterial();
    this.createGeometry();
  }

  private createRenderer(): THREE.WebGLRenderer {
    const r = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
    });
    r.setPixelRatio(1);
    r.setSize(this.container.clientWidth, this.container.clientHeight);
    r.setClearColor(0x0a0e17, 1);

    const gl = r.getContext();
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.disable(gl.DEPTH_TEST);

    this.container.appendChild(r.domElement);
    return r;
  }

  private createCamera(): THREE.PerspectiveCamera {
    const cam = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      10000
    );
    cam.position.set(5, 4, 10);
    cam.lookAt(0, 0, 0);
    return cam;
  }

  private createControls(): OrbitControls {
    const c = new OrbitControls(this.camera, this.renderer.domElement);
    c.enableDamping = true;
    c.dampingFactor = 0.08;
    c.minDistance = 0.1;
    c.maxDistance = 500;
    c.screenSpacePanning = true;
    return c;
  }

  private handleResize = (): void => {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    if (this.material) {
      this.material.uniforms.uViewportHeight.value = this.container.clientHeight;
    }
  };

  private createMaterial(): void {
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      uniforms: {
        uPointScale: { value: this.renderParams.pointSize },
        uMinPointSize: { value: 1.0 },
        uMaxPointSize: { value: 512.0 },
        uViewportHeight: { value: this.container.clientHeight },
        uSigma: { value: this.renderParams.sigma },
        uAlphaThreshold: { value: this.renderParams.alphaThreshold },
        uBrightness: { value: this.renderParams.brightness },
        uShowNormals: { value: this.renderParams.showNormals },
        uLightPosition: { value: new THREE.Vector3(5, 8, 12) },
        uLightColor: { value: new THREE.Color(1.0, 0.98, 0.95) },
        uAmbientColor: { value: new THREE.Color(0.55, 0.55, 0.6) },
      },
    });
  }

  private createGeometry(): void {
    this.geometry = new THREE.BufferGeometry();
    const placeholder = new THREE.BufferAttribute(new Float32Array(3), 3);
    placeholder.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('position', placeholder);
    this.geometry.setAttribute('aColor', new THREE.BufferAttribute(new Float32Array(3), 3));
    this.geometry.setAttribute('aNormal', new THREE.BufferAttribute(new Float32Array(3), 3));
    this.geometry.setAttribute('aPointSize', new THREE.BufferAttribute(new Float32Array(1), 1));
    this.geometry.setDrawRange(0, 0);

    this.points = new THREE.Points(this.geometry, this.material!);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
  }

  private ensureGPUBuffers(): void {
    if (this.pointCount <= this.gpuAllocated) return;

    this.gpuAllocated = Math.max(this.pointCount, Math.min(this.pointCount * 2, this.maxPoints));

    const posAttr = new THREE.BufferAttribute(new Float32Array(this.gpuAllocated * 3), 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    this.geometry!.setAttribute('position', posAttr);

    const colAttr = new THREE.BufferAttribute(new Float32Array(this.gpuAllocated * 3), 3);
    colAttr.setUsage(THREE.DynamicDrawUsage);
    this.geometry!.setAttribute('aColor', colAttr);

    const normAttr = new THREE.BufferAttribute(new Float32Array(this.gpuAllocated * 3), 3);
    normAttr.setUsage(THREE.DynamicDrawUsage);
    this.geometry!.setAttribute('aNormal', normAttr);

    const sizeAttr = new THREE.BufferAttribute(new Float32Array(this.gpuAllocated), 1);
    sizeAttr.setUsage(THREE.DynamicDrawUsage);
    this.geometry!.setAttribute('aPointSize', sizeAttr);
  }

  public setPointData(data: Float32Array, pointCount: number): void {
    if (pointCount > this.maxPoints) pointCount = this.maxPoints;
    this.pointCount = pointCount;
    this.deinterleave(data, pointCount);
    this.applySort(null);
    this.uploadToGPU();
    this.updateBoundingBox();
    this.autoFitPending = true;
  }

  public appendPointData(data: Float32Array, chunkPointCount: number): void {
    const newCount = Math.min(this.pointCount + chunkPointCount, this.maxPoints);
    const actual = newCount - this.pointCount;
    if (actual <= 0) return;

    const base = this.pointCount;
    for (let i = 0; i < actual; i++) {
      const s = i * POINT_STRIDE;
      const p = (base + i) * 3;
      this.srcPosition[p] = data[s];
      this.srcPosition[p + 1] = data[s + 1];
      this.srcPosition[p + 2] = data[s + 2];
      this.srcColor[p] = data[s + 3];
      this.srcColor[p + 1] = data[s + 4];
      this.srcColor[p + 2] = data[s + 5];
      this.srcNormal[p] = data[s + 6];
      this.srcNormal[p + 1] = data[s + 7];
      this.srcNormal[p + 2] = data[s + 8];
      this.srcSize[base + i] = data[s + 9];
    }

    this.pointCount = newCount;

    this.gpuPosition.set(this.srcPosition.subarray(0, newCount * 3));
    this.gpuColor.set(this.srcColor.subarray(0, newCount * 3));
    this.gpuNormal.set(this.srcNormal.subarray(0, newCount * 3));
    this.gpuSize.set(this.srcSize.subarray(0, newCount));
    this.uploadToGPU();
  }

  public finalizeLoad(): void {
    this.updateBoundingBox();
    this.autoFitPending = true;
    if (this.renderParams.sortEnabled && this.pointCount > 0) {
      this.computeDepth();
      this.radixSort();
      this.applySort(this.lastSortedIndices!);
      this.uploadToGPU();
    }
  }

  private deinterleave(data: Float32Array, count: number): void {
    for (let i = 0; i < count; i++) {
      const s = i * POINT_STRIDE;
      const p = i * 3;
      this.srcPosition[p] = data[s];
      this.srcPosition[p + 1] = data[s + 1];
      this.srcPosition[p + 2] = data[s + 2];
      this.srcColor[p] = data[s + 3];
      this.srcColor[p + 1] = data[s + 4];
      this.srcColor[p + 2] = data[s + 5];
      this.srcNormal[p] = data[s + 6];
      this.srcNormal[p + 1] = data[s + 7];
      this.srcNormal[p + 2] = data[s + 8];
      this.srcSize[i] = data[s + 9];
    }
  }

  private applySort(indices: Uint32Array | null): void {
    const n = this.pointCount;
    if (indices === null || indices.length !== n) {
      this.gpuPosition.set(this.srcPosition.subarray(0, n * 3));
      this.gpuColor.set(this.srcColor.subarray(0, n * 3));
      this.gpuNormal.set(this.srcNormal.subarray(0, n * 3));
      this.gpuSize.set(this.srcSize.subarray(0, n));
    } else {
      for (let i = 0; i < n; i++) {
        const src = indices[i];
        const sp = src * 3;
        const dp = i * 3;
        this.gpuPosition[dp] = this.srcPosition[sp];
        this.gpuPosition[dp + 1] = this.srcPosition[sp + 1];
        this.gpuPosition[dp + 2] = this.srcPosition[sp + 2];
        this.gpuColor[dp] = this.srcColor[sp];
        this.gpuColor[dp + 1] = this.srcColor[sp + 1];
        this.gpuColor[dp + 2] = this.srcColor[sp + 2];
        this.gpuNormal[dp] = this.srcNormal[sp];
        this.gpuNormal[dp + 1] = this.srcNormal[sp + 1];
        this.gpuNormal[dp + 2] = this.srcNormal[sp + 2];
        this.gpuSize[i] = this.srcSize[src];
      }
    }
  }

  private uploadToGPU(): void {
    this.ensureGPUBuffers();
    const n = this.pointCount;

    const posAttr = this.geometry!.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = this.geometry!.getAttribute('aColor') as THREE.BufferAttribute;
    const normAttr = this.geometry!.getAttribute('aNormal') as THREE.BufferAttribute;
    const sizeAttr = this.geometry!.getAttribute('aPointSize') as THREE.BufferAttribute;

    posAttr.array.set(this.gpuPosition.subarray(0, n * 3));
    colAttr.array.set(this.gpuColor.subarray(0, n * 3));
    normAttr.array.set(this.gpuNormal.subarray(0, n * 3));
    sizeAttr.array.set(this.gpuSize.subarray(0, n));

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    normAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;

    this.geometry!.setDrawRange(0, n);
  }

  private computeDepth(): void {
    this.camera.updateMatrixWorld();
    const e = this.camera.matrixWorldInverse.elements;
    const m20 = e[8], m21 = e[9], m22 = e[10], m23 = e[11];
    const pos = this.srcPosition;
    const n = this.pointCount;
    const depths = this.sortDepthBuf;
    for (let i = 0; i < n; i++) {
      const p = i * 3;
      depths[i] = m20 * pos[p] + m21 * pos[p + 1] + m22 * pos[p + 2] + m23;
    }
  }

  private radixSort(): void {
    const n = this.pointCount;
    const depths = this.sortDepthBuf;
    const indices = this.sortIndexBuf;
    const temp = this.sortTempBuf;
    const count = this.sortCountBuf;
    const fv = new Float32Array(1);
    const iv = new Uint32Array(fv.buffer);

    for (let i = 0; i < n; i++) indices[i] = i;

    for (let shift = 0; shift < 32; shift += 8) {
      count.fill(0);
      for (let i = 0; i < n; i++) {
        fv[0] = depths[indices[i]];
        let k = iv[0];
        k = (k ^ ((k >> 31) | 0x80000000)) >>> shift;
        count[k & 0xff]++;
      }
      let prefix = 0;
      for (let i = 0; i < 256; i++) {
        const c = count[i];
        count[i] = prefix;
        prefix += c;
      }
      for (let i = 0; i < n; i++) {
        fv[0] = depths[indices[i]];
        let k = iv[0];
        k = (k ^ ((k >> 31) | 0x80000000)) >>> shift;
        temp[count[k & 0xff]++] = indices[i];
      }
      indices.set(temp.subarray(0, n));
    }

    this.lastSortedIndices = indices.subarray(0, n);
  }

  private performDepthSort(): void {
    if (this.pointCount === 0 || !this.renderParams.sortEnabled) return;

    this.sortFrameCounter++;

    const moved = this.camera.position.distanceTo(this.lastCameraPos);
    this.cameraMovedDist += moved;
    this.lastCameraPos.copy(this.camera.position);

    const sortInterval = this.renderParams.sortInterval || 3;
    const moveThreshold = this.boundingBox.isEmpty() ? 0.01 :
      this.boundingBox.getSize(new THREE.Vector3()).length() * 0.003;

    if (this.sortFrameCounter % sortInterval !== 0 && this.cameraMovedDist < moveThreshold) {
      return;
    }

    this.cameraMovedDist = 0;
    const t0 = performance.now();

    this.computeDepth();
    this.radixSort();
    this.applySort(this.lastSortedIndices!);
    this.uploadToGPU();

    this.currentSortTime = performance.now() - t0;
  }

  private updateBoundingBox(): void {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    const pos = this.srcPosition;
    for (let i = 0; i < this.pointCount; i++) {
      const p = i * 3;
      const x = pos[p], y = pos[p + 1], z = pos[p + 2];
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (z < minZ) minZ = z;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (z > maxZ) maxZ = z;
    }
    this.boundingBox.min.set(minX, minY, minZ);
    this.boundingBox.max.set(maxX, maxY, maxZ);
  }

  public updateRenderParams(params: Partial<RenderParams>): void {
    this.renderParams = { ...this.renderParams, ...params };
    if (!this.material) return;
    const u = this.material.uniforms;
    if (params.pointSize !== undefined) u.uPointScale.value = params.pointSize;
    if (params.sigma !== undefined) u.uSigma.value = params.sigma;
    if (params.alphaThreshold !== undefined) u.uAlphaThreshold.value = params.alphaThreshold;
    if (params.brightness !== undefined) u.uBrightness.value = params.brightness;
    if (params.showNormals !== undefined) u.uShowNormals.value = params.showNormals;
  }

  public setOnMetricsUpdate(cb: (m: PerformanceMetrics) => void): void {
    this.onMetricsUpdate = cb;
  }

  public start(): void {
    if (this.animationFrameId !== null) return;

    const animate = (time: number): void => {
      this.animationFrameId = requestAnimationFrame(animate);
      const dt = time - this.lastFrameTime;
      this.lastFrameTime = time;
      this.frameTimes.push(dt);
      if (this.frameTimes.length > 30) this.frameTimes.shift();

      this.controls.update();

      if (this.autoFitPending && this.pointCount > 0) {
        this.fitCameraToBoundingBox();
        this.autoFitPending = false;
      }

      this.performDepthSort();

      const t0 = performance.now();
      this.renderer.render(this.scene, this.camera);
      this.currentRenderTime = performance.now() - t0;
      this.currentDrawCalls = this.renderer.info.render.calls;

      this.updateMetrics();
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  public stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private fitCameraToBoundingBox(): void {
    if (this.boundingBox.isEmpty()) return;
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    this.boundingBox.getCenter(center);
    this.boundingBox.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = (this.camera.fov * Math.PI) / 180;
    const dist = (maxDim / 2) / Math.tan(fov / 2) * 2.2;

    const dir = new THREE.Vector3(0.3, 0.4, 1).normalize();
    this.camera.position.copy(center).add(dir.multiplyScalar(dist));
    this.controls.target.copy(center);
    this.controls.update();
    this.lastCameraPos.copy(this.camera.position);
  }

  private updateMetrics(): void {
    if (!this.onMetricsUpdate) return;
    const avg = this.frameTimes.length > 0
      ? this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
      : 16;
    const mb = this.pointCount * 40 / (1024 * 1024);
    this.onMetricsUpdate({
      fps: Math.round(1000 / Math.max(avg, 1)),
      frameTime: avg,
      pointCount: this.pointCount,
      visiblePoints: this.pointCount,
      gpuMemoryMB: mb,
      sortTime: this.currentSortTime,
      renderTime: this.currentRenderTime,
      drawCalls: this.currentDrawCalls,
    });
  }

  public getPointCount(): number { return this.pointCount; }

  public dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    if (this.points) {
      this.scene.remove(this.points);
      this.geometry?.dispose();
      this.material?.dispose();
    }
    this.renderer.dispose();
    this.renderer.domElement.parentNode?.removeChild(this.renderer.domElement);
  }
}
