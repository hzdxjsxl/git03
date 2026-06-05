import textureLoader from './textureLoader.js';

class SceneInitializer {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.container = null;
    this.clock = null;
  }

  init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`容器 ${containerId} 未找到`);
    }

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a1a);
    this.scene.fog = new THREE.Fog(0x0a0a1a, 50, 150);

    const { clientWidth, clientHeight } = this.container;
    this.camera = new THREE.PerspectiveCamera(60, clientWidth / clientHeight, 0.1, 1000);
    this.camera.position.set(40, 30, 40);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(clientWidth, clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    
    this.container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();
    
    this.setupLights();
    textureLoader.preloadDefaultTextures();
    
    window.addEventListener('resize', () => this.onResize());
    
    return {
      scene: this.scene,
      camera: this.camera,
      renderer: this.renderer,
      clock: this.clock
    };
  }

  setupLights() {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(30, 50, 30);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 200;
    mainLight.shadow.camera.left = -60;
    mainLight.shadow.camera.right = 60;
    mainLight.shadow.camera.top = 60;
    mainLight.shadow.camera.bottom = -60;
    this.scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.4);
    fillLight.position.set(-30, 20, -30);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x00ffaa, 0.3);
    rimLight.position.set(0, 30, -40);
    this.scene.add(rimLight);

    const pointLight1 = new THREE.PointLight(0x00d4ff, 0.8, 50);
    pointLight1.position.set(-20, 15, 0);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x00ff88, 0.8, 50);
    pointLight2.position.set(20, 15, 0);
    this.scene.add(pointLight2);
  }

  onResize() {
    if (!this.container || !this.camera || !this.renderer) return;
    
    const { clientWidth, clientHeight } = this.container;
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(clientWidth, clientHeight);
  }

  getScene() { return this.scene; }
  getCamera() { return this.camera; }
  getRenderer() { return this.renderer; }
  getClock() { return this.clock; }
}

export default new SceneInitializer();
