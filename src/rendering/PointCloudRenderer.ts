import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DepthSorter, SortResult } from './DepthSorter';
import {
  RenderParams,
  PerformanceMetrics,
  DEFAULT_RENDER_PARAMS,
  POINT_STRIDE,
  POINT_BYTE_SIZE,
} from '../types/pointcloud';

const vertexShader = `
precision highp float;

attribute vec2 corner;

attribute vec3 instancePosition;
attribute vec3 instanceColor;
attribute vec3 instanceNormal;
attribute float instanceSize;

uniform float uPointScale;
uniform float uMinPointSize;
uniform float uMaxPointSize;
uniform float uViewportHeight;

varying vec3 vColor;
varying vec3 vNormal;
varying vec2 vUv;
varying float vPointSize;
varying vec3 vViewPosition;
varying float vDepth;

void main() {
    vec4 mvPosition = modelViewMatrix * vec4(instancePosition, 1.0);
    vViewPosition = mvPosition.xyz;
    vDepth = -mvPosition.z;
    
    float dist = length(mvPosition.xyz);
    float size = instanceSize * uPointScale * (uViewportHeight / dist);
    size = clamp(size, uMinPointSize, uMaxPointSize);
    
    vec3 right = vec3(modelViewMatrix[0].x, modelViewMatrix[1].x, modelViewMatrix[2].x);
    vec3 up = vec3(modelViewMatrix[0].y, modelViewMatrix[1].y, modelViewMatrix[2].y);
    
    vec3 offset = (right * corner.x + up * corner.y) * size * 0.5;
    vec4 worldPos = mvPosition + vec4(offset, 0.0);
    
    vPointSize = size;
    vUv = corner * 0.5 + 0.5;
    vColor = instanceColor;
    vNormal = normalize((modelViewMatrix * vec4(instanceNormal, 0.0)).xyz);
    
    gl_Position = projectionMatrix * worldPos;
}
`;

const fragmentShader = `
precision highp float;

varying vec3 vColor;
varying vec3 vNormal;
varying vec2 vUv;
varying float vPointSize;
varying vec3 vViewPosition;
varying float vDepth;

uniform float uSigma;
uniform float uAlphaThreshold;
uniform float uBrightness;
uniform bool uShowNormals;
uniform vec3 uLightPosition;
uniform vec3 uLightColor;
uniform vec3 uAmbientColor;

void main() {
    vec2 center = vUv - 0.5;
    float dist = length(center) * 2.0;
    
    float sigma = uSigma;
    float alpha = exp(-(dist * dist) / (2.0 * sigma * sigma));
    
    if (alpha < uAlphaThreshold) {
        discard;
    }
    
    vec3 baseColor = vColor;
    if (uShowNormals) {
        baseColor = vNormal * 0.5 + 0.5;
    }
    
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(uLightPosition - vViewPosition);
    vec3 viewDir = normalize(-vViewPosition);
    vec3 halfDir = normalize(lightDir + viewDir);
    
    float diff = max(dot(normal, lightDir), 0.0);
    float spec = pow(max(dot(normal, halfDir), 0.0), 32.0);
    
    vec3 ambient = uAmbientColor * baseColor;
    vec3 diffuse = uLightColor * baseColor * diff;
    vec3 specular = uLightColor * spec * 0.3;
    
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
  private depthSorter: DepthSorter;

  private pointCloud: THREE.Mesh | null = null;
  private geometry: THREE.InstancedBufferGeometry | null = null;
  private material: THREE.ShaderMaterial | null = null;

  private positionBuffer: Float32Array;
  private colorBuffer: Float32Array;
  private normalBuffer: Float32Array;
  private sizeBuffer: Float32Array;

  private sortedPositionBuffer: Float32Array;
  private sortedColorBuffer: Float32Array;
  private sortedNormalBuffer: Float32Array;
  private sortedSizeBuffer: Float32Array;

  private gpuPositionAttr: THREE.InstancedBufferAttribute | null = null;
  private gpuColorAttr: THREE.InstancedBufferAttribute | null = null;
  private gpuNormalAttr: THREE.InstancedBufferAttribute | null = null;
  private gpuSizeAttr: THREE.InstancedBufferAttribute | null = null;

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

  private cameraPositionArray = new Float32Array(3);
  private viewMatrixArray = new Float32Array(16);

  private boundingBox: THREE.Box3 = new THREE.Box3();
  private autoFitPending = false;

  constructor(container: HTMLElement, renderParams?: Partial<RenderParams>) {
    this.container = container;
    this.renderParams = { ...DEFAULT_RENDER_PARAMS, ...renderParams };
    this.depthSorter = new DepthSorter();

    this.positionBuffer = new Float32Array(this.maxPoints * 3);
    this.colorBuffer = new Float32Array(this.maxPoints * 3);
    this.normalBuffer = new Float32Array(this.maxPoints * 3);
    this.sizeBuffer = new Float32Array(this.maxPoints);

    this.sortedPositionBuffer = new Float32Array(this.maxPoints * 3);
    this.sortedColorBuffer = new Float32Array(this.maxPoints * 3);
    this.sortedNormalBuffer = new Float32Array(this.maxPoints * 3);
    this.sortedSizeBuffer = new Float32Array(this.maxPoints);

    this.renderer = this.createRenderer();
    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.controls = this.createControls();

    this.setupEventListeners();
    this.createPointCloudGeometry();
    this.createPointCloudMaterial();
    this.createPointCloudMesh();
  }

  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(1);
    renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    renderer.setClearColor(0x0a0e17, 1);

    const gl = renderer.getContext();
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.disable(gl.DEPTH_TEST);

    this.container.appendChild(renderer.domElement);
    return renderer;
  }

  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e17);
    return scene;
  }

  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      10000
    );
    camera.position.set(0, 0, 10);
    return camera;
  }

  private createControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.1;
    controls.maxDistance = 500;
    controls.screenSpacePanning = true;
    return controls;
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = (): void => {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    if (this.material) {
      this.material.uniforms.uViewportHeight.value = this.container.clientHeight;
    }
  };

  private createPointCloudGeometry(): void {
    const geometry = new THREE.InstancedBufferGeometry();

    const cornerVerts = new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]);
    geometry.setAttribute('corner', new THREE.BufferAttribute(cornerVerts, 2));

    const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    geometry.instanceCount = 0;
    this.geometry = geometry;
  }

  private createPointCloudMaterial(): void {
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
        uMaxPointSize: { value: 80.0 },
        uViewportHeight: { value: this.container.clientHeight },
        uSigma: { value: this.renderParams.sigma },
        uAlphaThreshold: { value: this.renderParams.alphaThreshold },
        uBrightness: { value: this.renderParams.brightness },
        uShowNormals: { value: this.renderParams.showNormals },
        uLightPosition: { value: new THREE.Vector3(5, 5, 10) },
        uLightColor: { value: new THREE.Color(0xffffff) },
        uAmbientColor: { value: new THREE.Color(0x444444) },
      },
    });
  }

  private createPointCloudMesh(): void {
    if (!this.geometry || !this.material) return;
    this.pointCloud = new THREE.Mesh(this.geometry, this.material);
    this.pointCloud.frustumCulled = false;
    this.scene.add(this.pointCloud);
  }

  private ensureGPUAttributes(): void {
    if (!this.geometry || this.pointCount === 0) return;

    const needsRealloc = this.pointCount > this.gpuAllocated;

    if (needsRealloc) {
      this.gpuAllocated = Math.max(this.pointCount, Math.min(this.pointCount * 2, this.maxPoints));

      this.gpuPositionAttr = new THREE.InstancedBufferAttribute(
        new Float32Array(this.gpuAllocated * 3), 3
      );
      this.gpuColorAttr = new THREE.InstancedBufferAttribute(
        new Float32Array(this.gpuAllocated * 3), 3
      );
      this.gpuNormalAttr = new THREE.InstancedBufferAttribute(
        new Float32Array(this.gpuAllocated * 3), 3
      );
      this.gpuSizeAttr = new THREE.InstancedBufferAttribute(
        new Float32Array(this.gpuAllocated), 1
      );

      this.geometry.setAttribute('instancePosition', this.gpuPositionAttr);
      this.geometry.setAttribute('instanceColor', this.gpuColorAttr);
      this.geometry.setAttribute('instanceNormal', this.gpuNormalAttr);
      this.geometry.setAttribute('instanceSize', this.gpuSizeAttr);
    }

    this.geometry.instanceCount = this.pointCount;
  }

  public setPointData(data: Float32Array, pointCount: number): void {
    if (pointCount > this.maxPoints) {
      console.warn(`Point count ${pointCount} exceeds max ${this.maxPoints}, truncating`);
      pointCount = this.maxPoints;
    }

    this.pointCount = pointCount;

    for (let i = 0; i < pointCount; i++) {
      const srcOffset = i * POINT_STRIDE;
      const posOffset = i * 3;

      this.positionBuffer[posOffset] = data[srcOffset];
      this.positionBuffer[posOffset + 1] = data[srcOffset + 1];
      this.positionBuffer[posOffset + 2] = data[srcOffset + 2];

      this.colorBuffer[posOffset] = data[srcOffset + 3];
      this.colorBuffer[posOffset + 1] = data[srcOffset + 4];
      this.colorBuffer[posOffset + 2] = data[srcOffset + 5];

      this.normalBuffer[posOffset] = data[srcOffset + 6];
      this.normalBuffer[posOffset + 1] = data[srcOffset + 7];
      this.normalBuffer[posOffset + 2] = data[srcOffset + 8];

      this.sizeBuffer[i] = data[srcOffset + 9];
    }

    this.copyToSorted(null);
    this.uploadToGPU();
    this.updateBoundingBox();
    this.autoFitPending = true;
  }

  public appendPointData(data: Float32Array, chunkPointCount: number): void {
    const newCount = Math.min(this.pointCount + chunkPointCount, this.maxPoints);
    const actualChunk = newCount - this.pointCount;

    if (actualChunk <= 0) return;

    for (let i = 0; i < actualChunk; i++) {
      const srcOffset = i * POINT_STRIDE;
      const dstIdx = this.pointCount + i;
      const posOffset = dstIdx * 3;

      this.positionBuffer[posOffset] = data[srcOffset];
      this.positionBuffer[posOffset + 1] = data[srcOffset + 1];
      this.positionBuffer[posOffset + 2] = data[srcOffset + 2];

      this.colorBuffer[posOffset] = data[srcOffset + 3];
      this.colorBuffer[posOffset + 1] = data[srcOffset + 4];
      this.colorBuffer[posOffset + 2] = data[srcOffset + 5];

      this.normalBuffer[posOffset] = data[srcOffset + 6];
      this.normalBuffer[posOffset + 1] = data[srcOffset + 7];
      this.normalBuffer[posOffset + 2] = data[srcOffset + 8];

      this.sizeBuffer[dstIdx] = data[srcOffset + 9];
    }

    this.pointCount = newCount;
    this.copyToSorted(null);
    this.uploadToGPU();
    this.updateBoundingBox();
  }

  private copyToSorted(sortedIndices: Uint32Array | null): void {
    if (sortedIndices === null || sortedIndices.length !== this.pointCount) {
      this.sortedPositionBuffer.set(this.positionBuffer.subarray(0, this.pointCount * 3));
      this.sortedColorBuffer.set(this.colorBuffer.subarray(0, this.pointCount * 3));
      this.sortedNormalBuffer.set(this.normalBuffer.subarray(0, this.pointCount * 3));
      this.sortedSizeBuffer.set(this.sizeBuffer.subarray(0, this.pointCount));
    } else {
      for (let i = 0; i < this.pointCount; i++) {
        const srcIdx = sortedIndices[i];
        const srcPos = srcIdx * 3;
        const dstPos = i * 3;

        this.sortedPositionBuffer[dstPos] = this.positionBuffer[srcPos];
        this.sortedPositionBuffer[dstPos + 1] = this.positionBuffer[srcPos + 1];
        this.sortedPositionBuffer[dstPos + 2] = this.positionBuffer[srcPos + 2];

        this.sortedColorBuffer[dstPos] = this.colorBuffer[srcPos];
        this.sortedColorBuffer[dstPos + 1] = this.colorBuffer[srcPos + 1];
        this.sortedColorBuffer[dstPos + 2] = this.colorBuffer[srcPos + 2];

        this.sortedNormalBuffer[dstPos] = this.normalBuffer[srcPos];
        this.sortedNormalBuffer[dstPos + 1] = this.normalBuffer[srcPos + 1];
        this.sortedNormalBuffer[dstPos + 2] = this.normalBuffer[srcPos + 2];

        this.sortedSizeBuffer[i] = this.sizeBuffer[srcIdx];
      }
    }
  }

  private uploadToGPU(): void {
    this.ensureGPUAttributes();

    if (!this.gpuPositionAttr) return;

    this.gpuPositionAttr.array.set(this.sortedPositionBuffer.subarray(0, this.pointCount * 3));
    this.gpuColorAttr!.array.set(this.sortedColorBuffer.subarray(0, this.pointCount * 3));
    this.gpuNormalAttr!.array.set(this.sortedNormalBuffer.subarray(0, this.pointCount * 3));
    this.gpuSizeAttr!.array.set(this.sortedSizeBuffer.subarray(0, this.pointCount));

    this.gpuPositionAttr.needsUpdate = true;
    this.gpuColorAttr!.needsUpdate = true;
    this.gpuNormalAttr!.needsUpdate = true;
    this.gpuSizeAttr!.needsUpdate = true;
  }

  private updateBoundingBox(): void {
    this.boundingBox.makeEmpty();
    for (let i = 0; i < this.pointCount; i++) {
      const offset = i * 3;
      this.boundingBox.expandByPoint(
        new THREE.Vector3(
          this.positionBuffer[offset],
          this.positionBuffer[offset + 1],
          this.positionBuffer[offset + 2]
        )
      );
    }
  }

  public updateRenderParams(params: Partial<RenderParams>): void {
    this.renderParams = { ...this.renderParams, ...params };

    if (this.material) {
      if (params.pointSize !== undefined) this.material.uniforms.uPointScale.value = params.pointSize;
      if (params.sigma !== undefined) this.material.uniforms.uSigma.value = params.sigma;
      if (params.alphaThreshold !== undefined) this.material.uniforms.uAlphaThreshold.value = params.alphaThreshold;
      if (params.brightness !== undefined) this.material.uniforms.uBrightness.value = params.brightness;
      if (params.showNormals !== undefined) this.material.uniforms.uShowNormals.value = params.showNormals;
      if (params.sortInterval !== undefined) this.depthSorter.setSortInterval(params.sortInterval);
      if (params.sortEnabled !== undefined) this.depthSorter.setEnabled(params.sortEnabled);
    }
  }

  public setOnMetricsUpdate(callback: (metrics: PerformanceMetrics) => void): void {
    this.onMetricsUpdate = callback;
  }

  public start(): void {
    if (this.animationFrameId !== null) return;

    const animate = (time: number): void => {
      this.animationFrameId = requestAnimationFrame(animate);

      const deltaTime = time - this.lastFrameTime;
      this.lastFrameTime = time;

      this.frameTimes.push(deltaTime);
      if (this.frameTimes.length > 30) this.frameTimes.shift();

      this.controls.update();

      if (this.autoFitPending && this.pointCount > 0) {
        this.fitCameraToBoundingBox();
        this.autoFitPending = false;
      }

      if (this.pointCount > 0 && this.renderParams.sortEnabled) {
        this.performDepthSort();
      }

      const renderStart = performance.now();
      this.renderer.render(this.scene, this.camera);
      this.currentRenderTime = performance.now() - renderStart;
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

  private performDepthSort(): void {
    if (this.pointCount === 0) return;

    this.camera.updateMatrixWorld();
    this.camera.matrixWorldInverse.copy(this.camera.matrixWorld).invert();

    this.cameraPositionArray[0] = this.camera.position.x;
    this.cameraPositionArray[1] = this.camera.position.y;
    this.cameraPositionArray[2] = this.camera.position.z;

    this.viewMatrixArray.set(this.camera.matrixWorldInverse.elements);

    const result: SortResult = this.depthSorter.requestSort(
      this.positionBuffer,
      this.viewMatrixArray,
      this.cameraPositionArray,
      this.pointCount,
      3
    );

    if (result.sortTime > 0) {
      this.currentSortTime = result.sortTime;
    }

    if (result.sortedIndices && !result.pending) {
      this.copyToSorted(result.sortedIndices);
      this.uploadToGPU();
    }
  }

  private fitCameraToBoundingBox(): void {
    if (this.boundingBox.isEmpty()) return;

    const center = new THREE.Vector3();
    this.boundingBox.getCenter(center);

    const size = new THREE.Vector3();
    this.boundingBox.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = (this.camera.fov * Math.PI) / 180;
    const distance = (maxDim / 2) / Math.tan(fov / 2) * 2.5;

    const direction = new THREE.Vector3(0.3, 0.5, 1).normalize();
    const newPosition = center.clone().add(direction.multiplyScalar(distance));

    this.camera.position.copy(newPosition);
    this.controls.target.copy(center);
    this.controls.update();
  }

  private updateMetrics(): void {
    if (!this.onMetricsUpdate) return;

    const avgFrameTime = this.frameTimes.length > 0
      ? this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
      : 16;
    const fps = 1000 / Math.max(avgFrameTime, 1);

    const gpuMemoryMB = this.pointCount * (40 + 24) / (1024 * 1024);

    this.onMetricsUpdate({
      fps: Math.round(fps),
      frameTime: avgFrameTime,
      pointCount: this.pointCount,
      visiblePoints: this.pointCount,
      gpuMemoryMB,
      sortTime: this.currentSortTime,
      renderTime: this.currentRenderTime,
      drawCalls: this.currentDrawCalls,
    });
  }

  public getPointCount(): number {
    return this.pointCount;
  }

  public dispose(): void {
    this.stop();
    this.depthSorter.dispose();
    window.removeEventListener('resize', this.handleResize);

    if (this.pointCloud) {
      this.scene.remove(this.pointCloud);
      this.pointCloud.geometry.dispose();
      (this.pointCloud.material as THREE.Material).dispose();
    }

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
