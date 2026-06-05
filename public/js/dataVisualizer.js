class DataVisualizer {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.devices = [];
    this.deviceData = {};
    this.labels = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredDevice = null;
    this.tooltip = null;
    this.deviceListContainer = null;
  }

  init(scene, camera, renderer, devices) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.devices = devices;
    this.tooltip = document.getElementById('tooltip');
    this.deviceListContainer = document.getElementById('device-list');

    this.createDataLabels();
    this.setupEventListeners();
  }

  createDataLabels() {
    this.devices.forEach(device => {
      const label = this.createLabelSprite(device);
      this.labels.push({ device, sprite: label });
      this.scene.add(label);
    });
  }

  createLabelSprite(device) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    this.drawLabel(ctx, device.id, '--', '--');

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(8, 4, 1);

    const box = new THREE.Box3().setFromObject(device.mesh);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    sprite.position.set(center.x, center.y + size.y / 2 + 3, center.z);

    sprite.userData = { deviceId: device.id, canvas, ctx };
    return sprite;
  }

  drawLabel(ctx, deviceId, temperature, capacity) {
    const width = 256;
    const height = 128;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(10, 20, 40, 0.9)';
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 12);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 200, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#00d4ff';
    ctx.font = 'bold 18px Microsoft YaHei';
    ctx.textAlign = 'center';
    ctx.fillText(this.getDeviceName(deviceId), width / 2, 30);

    ctx.fillStyle = '#aaa';
    ctx.font = '14px Microsoft YaHei';
    ctx.textAlign = 'left';
    ctx.fillText('温度', 20, 60);
    ctx.fillText('产能', 20, 95);

    const tempColor = temperature === '--' ? '#666' : 
                      temperature > 60 ? '#ff4444' :
                      temperature > 50 ? '#ffaa00' : '#4ecdc4';
    ctx.fillStyle = tempColor;
    ctx.font = 'bold 20px Microsoft YaHei';
    ctx.textAlign = 'right';
    ctx.fillText(temperature === '--' ? '-- °C' : `${temperature} °C`, width - 20, 60);

    ctx.fillStyle = '#4ecdc4';
    ctx.fillText(capacity === '--' ? '-- %' : `${capacity} %`, width - 20, 95);
  }

  getDeviceName(deviceId) {
    const names = {
      'conveyor_0': '主传送带A',
      'conveyor_1': '主传送带B',
      'robot_0': '机械臂A1',
      'robot_1': '机械臂A2',
      'robot_2': '机械臂B1',
      'machine_0': '加工中心A',
      'machine_1': '加工中心B'
    };
    return names[deviceId] || deviceId;
  }

  updateDeviceData(deviceData) {
    this.deviceData = deviceData;

    this.labels.forEach(({ sprite }) => {
      const { deviceId, canvas, ctx } = sprite.userData;
      const data = deviceData[deviceId];
      if (data) {
        this.drawLabel(ctx, deviceId, data.temperature, data.capacity);
        sprite.material.map.needsUpdate = true;
      }
    });

    this.updateDeviceList(deviceData);
  }

  updateDeviceList(deviceData) {
    if (!this.deviceListContainer) return;

    this.deviceListContainer.innerHTML = '';

    Object.entries(deviceData).forEach(([id, data]) => {
      const item = document.createElement('div');
      item.className = 'device-item';
      
      if (data.temperature > 60) {
        item.classList.add('danger');
      } else if (data.temperature > 50) {
        item.classList.add('warning');
      }

      item.innerHTML = `
        <div class="device-name">${this.getDeviceName(id)}</div>
        <div class="device-stats">
          <span>🌡️ <span class="temp-value">${data.temperature}°C</span></span>
          <span>⚡ <span class="capacity-value">${data.capacity}%</span></span>
        </div>
      `;

      this.deviceListContainer.appendChild(item);
    });
  }

  setupEventListeners() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.updateHover(event.clientX, event.clientY);
    });

    canvas.addEventListener('mouseleave', () => {
      this.hideTooltip();
    });
  }

  updateHover(clientX, clientY) {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const meshes = this.devices.map(d => d.mesh);
    const intersects = this.raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      let object = intersects[0].object;
      while (object.parent && !this.devices.find(d => d.mesh === object)) {
        object = object.parent;
      }

      const device = this.devices.find(d => d.mesh === object);
      if (device && device !== this.hoveredDevice) {
        this.hoveredDevice = device;
        this.showTooltip(device, clientX, clientY);
      } else if (device) {
        this.updateTooltipPosition(clientX, clientY);
      }
    } else {
      this.hoveredDevice = null;
      this.hideTooltip();
    }
  }

  showTooltip(device, clientX, clientY) {
    if (!this.tooltip) return;

    const data = this.deviceData[device.id] || { temperature: '--', capacity: '--', status: 'unknown' };
    
    this.tooltip.innerHTML = `
      <div class="tooltip-title">${this.getDeviceName(device.id)}</div>
      <div class="tooltip-content">
        <div class="row"><span class="label">设备ID:</span><span>${device.id}</span></div>
        <div class="row"><span class="label">温度:</span><span class="temp-value">${data.temperature}°C</span></div>
        <div class="row"><span class="label">产能:</span><span class="capacity-value">${data.capacity}%</span></div>
        <div class="row"><span class="label">状态:</span><span>${data.status}</span></div>
      </div>
    `;

    this.tooltip.classList.add('visible');
    this.updateTooltipPosition(clientX, clientY);
  }

  updateTooltipPosition(clientX, clientY) {
    if (!this.tooltip) return;

    const x = clientX + 15;
    const y = clientY + 15;

    this.tooltip.style.left = `${x}px`;
    this.tooltip.style.top = `${y}px`;
  }

  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.classList.remove('visible');
    }
    this.hoveredDevice = null;
  }

  update() {
    this.labels.forEach(({ sprite }) => {
      sprite.quaternion.copy(this.camera.quaternion);
    });
  }

  getDeviceData() {
    return this.deviceData;
  }
}

export default new DataVisualizer();
