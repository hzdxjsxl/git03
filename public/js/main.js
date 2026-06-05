import sceneInitializer from './sceneInitializer.js';
import sceneBuilder from './sceneBuilder.js';
import animationController from './animationController.js';
import dataVisualizer from './dataVisualizer.js';
import cameraController from './cameraController.js';
import apiClient from './apiClient.js';

class DigitalTwinApp {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = null;
    this.devices = [];
    this.pollingInterval = null;
    this.isRunning = true;
  }

  async init() {
    try {
      const { scene, camera, renderer, clock } = sceneInitializer.init('canvas-container');
      this.scene = scene;
      this.camera = camera;
      this.renderer = renderer;
      this.clock = clock;

      sceneBuilder.init(scene);
      const { devices, conveyors, robots, machines } = sceneBuilder.buildFactory();
      this.devices = devices;

      animationController.init(conveyors, robots, machines);

      dataVisualizer.init(scene, camera, renderer, devices);

      cameraController.init(camera, renderer);

      this.setupUI();

      this.pollingInterval = await apiClient.startDataPolling((data) => {
        dataVisualizer.updateDeviceData(data);
      }, 3000);

      this.animate();

      console.log('智慧工厂数字孪生看板初始化成功!');
    } catch (error) {
      console.error('初始化失败:', error);
    }
  }

  setupUI() {
    document.getElementById('view-all').addEventListener('click', () => {
      cameraController.setView('all');
    });

    document.getElementById('view-conveyor').addEventListener('click', () => {
      cameraController.setView('conveyor');
    });

    document.getElementById('view-robots').addEventListener('click', () => {
      cameraController.setView('robots');
    });

    const toggleBtn = document.getElementById('toggle-animation');
    toggleBtn.addEventListener('click', () => {
      const isPlaying = animationController.toggle();
      toggleBtn.textContent = isPlaying ? '暂停动画' : '继续动画';
    });
  }

  animate() {
    if (!this.isRunning) return;

    requestAnimationFrame(() => this.animate());

    const deltaTime = Math.min(this.clock.getDelta(), 0.1);

    cameraController.update();

    animationController.update(deltaTime);

    dataVisualizer.update();

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.isRunning = false;
    if (this.pollingInterval) {
      apiClient.stopDataPolling(this.pollingInterval);
    }
  }
}

const app = new DigitalTwinApp();

window.addEventListener('DOMContentLoaded', () => {
  app.init();
});

window.addEventListener('beforeunload', () => {
  app.destroy();
});

export default app;
