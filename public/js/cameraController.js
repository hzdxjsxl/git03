class CameraController {
  constructor() {
    this.camera = null;
    this.target = new THREE.Vector3(0, 5, 0);
    this.isDragging = false;
    this.isPanning = false;
    this.previousMouse = { x: 0, y: 0 };
    this.spherical = { theta: Math.PI / 4, phi: Math.PI / 3, radius: 50 };
    this.minRadius = 15;
    this.maxRadius = 100;
    this.minPhi = 0.1;
    this.maxPhi = Math.PI / 2 - 0.1;
    this.damping = 0.95;
    this.velocity = { theta: 0, phi: 0, radius: 0 };
    this.autoRotate = false;
    this.autoRotateSpeed = 0.001;
  }

  init(camera, renderer) {
    this.camera = camera;
    this.renderer = renderer;
    this.updateCameraPosition();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    canvas.addEventListener('mouseup', () => this.onMouseUp());
    canvas.addEventListener('mouseleave', () => this.onMouseUp());
    canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  onMouseDown(e) {
    if (e.button === 0) {
      this.isDragging = true;
    } else if (e.button === 2) {
      this.isPanning = true;
    }
    this.previousMouse = { x: e.clientX, y: e.clientY };
  }

  onMouseMove(e) {
    if (this.isDragging) {
      const deltaX = e.clientX - this.previousMouse.x;
      const deltaY = e.clientY - this.previousMouse.y;

      this.velocity.theta -= deltaX * 0.005;
      this.velocity.phi -= deltaY * 0.005;
    }

    if (this.isPanning) {
      const deltaX = e.clientX - this.previousMouse.x;
      const deltaY = e.clientY - this.previousMouse.y;

      const panSpeed = this.spherical.radius * 0.002;
      const right = new THREE.Vector3();
      const up = new THREE.Vector3(0, 1, 0);
      
      this.camera.getWorldDirection(right);
      right.cross(up).normalize();

      this.target.addScaledVector(right, -deltaX * panSpeed);
      this.target.y += deltaY * panSpeed;
    }

    this.previousMouse = { x: e.clientX, y: e.clientY };
  }

  onMouseUp() {
    this.isDragging = false;
    this.isPanning = false;
  }

  onWheel(e) {
    e.preventDefault();
    this.velocity.radius += e.deltaY * 0.05;
  }

  update() {
    if (this.autoRotate && !this.isDragging) {
      this.velocity.theta += this.autoRotateSpeed;
    }

    this.spherical.theta += this.velocity.theta;
    this.spherical.phi += this.velocity.phi;
    this.spherical.radius += this.velocity.radius;

    this.velocity.theta *= this.damping;
    this.velocity.phi *= this.damping;
    this.velocity.radius *= this.damping;

    this.spherical.phi = Math.max(this.minPhi, Math.min(this.maxPhi, this.spherical.phi));
    this.spherical.radius = Math.max(this.minRadius, Math.min(this.maxRadius, this.spherical.radius));

    this.updateCameraPosition();
  }

  updateCameraPosition() {
    const x = this.spherical.radius * Math.sin(this.spherical.phi) * Math.sin(this.spherical.theta);
    const y = this.spherical.radius * Math.cos(this.spherical.phi);
    const z = this.spherical.radius * Math.sin(this.spherical.phi) * Math.cos(this.spherical.theta);

    this.camera.position.set(
      this.target.x + x,
      this.target.y + y,
      this.target.z + z
    );
    this.camera.lookAt(this.target);
  }

  setView(viewName) {
    const views = {
      all: { theta: Math.PI / 4, phi: Math.PI / 3, radius: 50, target: { x: 0, y: 5, z: 0 } },
      conveyor: { theta: 0, phi: Math.PI / 4, radius: 30, target: { x: 0, y: 2, z: -10 } },
      robots: { theta: Math.PI / 2, phi: Math.PI / 4, radius: 35, target: { x: 0, y: 5, z: 0 } }
    };

    const view = views[viewName];
    if (view) {
      this.spherical.theta = view.theta;
      this.spherical.phi = view.phi;
      this.spherical.radius = view.radius;
      this.target.set(view.target.x, view.target.y, view.target.z);
      this.velocity = { theta: 0, phi: 0, radius: 0 };
    }
  }

  setAutoRotate(enabled) {
    this.autoRotate = enabled;
  }

  getSpherical() {
    return { ...this.spherical };
  }

  getTarget() {
    return this.target.clone();
  }
}

export default new CameraController();
