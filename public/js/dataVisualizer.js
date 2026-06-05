class DataVisualizer {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.devices = [];
    this.deviceData = {};
    this.labels = [];
    this.clusterSprites = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredDevice = null;
    this.tooltip = null;
    this.deviceListContainer = null;
    this.time = 0;
    this.clusterDistance = 50;
    this.detailDistance = 30;
  }

  init(scene, camera, renderer, devices) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.devices = devices;
    this.tooltip = document.getElementById('tooltip');
    this.deviceListContainer = document.getElementById('device-list');

    this.createDetailLabels();
    this.createClusterLabels();
    this.setupEventListeners();
  }

  createDetailLabels() {
    this.devices.forEach(device => {
      const sprite = this.createSingleLabel(device);
      this.labels.push({
        deviceId: device.id,
        device: device,
        sprite: sprite
      });
      this.scene.add(sprite);
    });
  }

  createSingleLabel(device) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

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

    sprite.userData = {
      deviceId: device.id,
      canvas: canvas,
      ctx: ctx,
      texture: texture,
      isAlert: false,
      basePosition: sprite.position.clone()
    };

    return sprite;
  }

  createClusterLabels() {
    const clusterConfigs = [
      {
        id: 'cluster_robots',
        deviceIds: ['robot_0', 'robot_1', 'robot_2'],
        center: new THREE.Vector3(0, 8, -5)
      },
      {
        id: 'cluster_conveyors',
        deviceIds: ['conveyor_0', 'conveyor_1'],
        center: new THREE.Vector3(-8, 5, 0)
      },
      {
        id: 'cluster_machines',
        deviceIds: ['machine_0', 'machine_1'],
        center: new THREE.Vector3(0, 7, 0)
      }
    ];

    clusterConfigs.forEach(config => {
      const sprite = this.createClusterSprite(config);
      this.clusterSprites.push({
        ...config,
        sprite: sprite,
        alertCount: 0
      });
      this.scene.add(sprite);
    });
  }

  createClusterSprite(config) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(5, 5, 1);
    sprite.position.copy(config.center);
    sprite.visible = false;

    sprite.userData = {
      clusterId: config.id,
      canvas: canvas,
      ctx: ctx,
      texture: texture,
      deviceCount: config.deviceIds.length
    };

    return sprite;
  }

  drawLabel(ctx, deviceId, temperature, capacity, isAlert, isWarning, flashIntensity) {
    const width = 256;
    const height = 128;

    ctx.clearRect(0, 0, width, height);

    let bgColor = 'rgba(10, 20, 40, 0.9)';
    let borderColor = 'rgba(0, 200, 255, 0.6)';
    let titleColor = '#00d4ff';

    if (isAlert) {
      const intensity = 0.5 + flashIntensity * 0.5;
      bgColor = `rgba(80, 10, 10, ${0.85 + flashIntensity * 0.15})`;
      borderColor = `rgba(255, 50, 50, ${0.6 + flashIntensity * 0.4})`;
      titleColor = '#ff4444';
    } else if (isWarning) {
      bgColor = 'rgba(60, 40, 10, 0.9)';
      borderColor = 'rgba(255, 170, 0, 0.6)';
      titleColor = '#ffcc00';
    }

    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 12);
    ctx.fill();

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = isAlert ? 3 : 2;
    ctx.stroke();

    if (isAlert) {
      ctx.fillStyle = '#ff3333';
      ctx.font = 'bold 12px Microsoft YaHei';
      ctx.textAlign = 'left';
      ctx.fillText('⚠ 异常', 15, 20);
    }

    ctx.fillStyle = titleColor;
    ctx.font = 'bold 16px Microsoft YaHei';
    ctx.textAlign = 'center';
    ctx.fillText(this.getDeviceName(deviceId), width / 2, isAlert ? 42 : 32);

    ctx.fillStyle = '#999';
    ctx.font = '13px Microsoft YaHei';
    ctx.textAlign = 'left';
    ctx.fillText('温度', 20, isAlert ? 72 : 62);
    ctx.fillText('产能', 20, isAlert ? 100 : 90);

    const tempColor = temperature === '--' ? '#666' : 
                      temperature > 65 ? '#ff3333' :
                      temperature > 55 ? '#ffaa00' : '#4ecdc4';
    ctx.fillStyle = tempColor;
    ctx.font = 'bold 18px Microsoft YaHei';
    ctx.textAlign = 'right';
    ctx.fillText(temperature === '--' ? '-- °C' : `${temperature} °C`, width - 20, isAlert ? 72 : 62);

    const capacityColor = capacity === '--' ? '#666' :
                          capacity < 25 ? '#ff3333' :
                          capacity < 40 ? '#ffaa00' : '#4ecdc4';
    ctx.fillStyle = capacityColor;
    ctx.fillText(capacity === '--' ? '-- %' : `${capacity} %`, width - 20, isAlert ? 100 : 90);
  }

  drawCluster(ctx, deviceCount, hasAlert, alertCount, pulseIntensity) {
    const width = 128;
    const height = 128;
    const cx = width / 2;
    const cy = height / 2;

    ctx.clearRect(0, 0, width, height);

    const radius = 48 + pulseIntensity * 6;
    const mainColor = hasAlert ? '255, 80, 80' : '0, 180, 230';

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, `rgba(${mainColor}, 0.9)`);
    gradient.addColorStop(0.6, `rgba(${mainColor}, 0.6)`);
    gradient.addColorStop(1, `rgba(${mainColor}, 0)`);

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, radius - 10, 0, Math.PI * 2);
    ctx.fillStyle = hasAlert ? 'rgba(200, 40, 40, 0.95)' : 'rgba(0, 150, 200, 0.95)';
    ctx.fill();

    ctx.strokeStyle = hasAlert ? '#ff8888' : '#88eeff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Microsoft YaHei';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(deviceCount.toString(), cx, cy - 5);

    ctx.font = '11px Microsoft YaHei';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText('台设备', cx, cy + 18);

    if (hasAlert) {
      ctx.fillStyle = '#ffff00';
      ctx.font = 'bold 12px Microsoft YaHei';
      ctx.fillText(`⚠ ${alertCount}异常`, cx, cy + 38);
    }
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

  checkAlertStatus(temperature, capacity) {
    if (temperature === '--' || capacity === '--') {
      return { isAlert: false, isWarning: false };
    }
    const isAlert = temperature > 65 || capacity < 25;
    const isWarning = (temperature > 55 || capacity < 40) && !isAlert;
    return { isAlert, isWarning };
  }

  updateDeviceData(deviceData) {
    this.deviceData = deviceData;

    this.labels.forEach(label => {
      const data = deviceData[label.deviceId];
      if (data) {
        const { isAlert, isWarning } = this.checkAlertStatus(data.temperature, data.capacity);
        label.sprite.userData.isAlert = isAlert;
        label.sprite.userData.isWarning = isWarning;
      }
    });

    this.clusterSprites.forEach(cluster => {
      let alertCount = 0;
      cluster.deviceIds.forEach(id => {
        const data = deviceData[id];
        if (data) {
          const { isAlert } = this.checkAlertStatus(data.temperature, data.capacity);
          if (isAlert) alertCount++;
        }
      });
      cluster.alertCount = alertCount;
    });

    this.updateDeviceList(deviceData);
  }

  updateDeviceList(deviceData) {
    if (!this.deviceListContainer) return;

    this.deviceListContainer.innerHTML = '';

    Object.entries(deviceData).forEach(([id, data]) => {
      const { isAlert, isWarning } = this.checkAlertStatus(data.temperature, data.capacity);
      
      const item = document.createElement('div');
      item.className = 'device-item';
      if (isAlert) item.classList.add('danger');
      else if (isWarning) item.classList.add('warning');

      const alertBadge = isAlert ? '<span style="color:#ff3333;"> ⚠</span>' : '';

      item.innerHTML = `
        <div class="device-name">${this.getDeviceName(id)}${alertBadge}</div>
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

    const visibleLabels = this.labels.filter(l => l.sprite.visible).map(l => l.sprite);
    const visibleClusters = this.clusterSprites.filter(c => c.sprite.visible).map(c => c.sprite);
    const allSprites = [...visibleLabels, ...visibleClusters];
    
    const intersects = this.raycaster.intersectObjects(allSprites);

    if (intersects.length > 0) {
      const sprite = intersects[0].object;
      
      if (sprite.userData.clusterId) {
        const cluster = this.clusterSprites.find(c => c.id === sprite.userData.clusterId);
        if (cluster) this.showClusterTooltip(cluster, clientX, clientY);
      } else if (sprite.userData.deviceId) {
        const device = this.devices.find(d => d.id === sprite.userData.deviceId);
        if (device) {
          this.hoveredDevice = device;
          this.showDeviceTooltip(device, clientX, clientY);
        }
      }
    } else {
      this.hoveredDevice = null;
      this.hideTooltip();
    }
  }

  showClusterTooltip(cluster, clientX, clientY) {
    if (!this.tooltip) return;

    const deviceNames = cluster.deviceIds.map(id => this.getDeviceName(id)).join(', ');

    this.tooltip.innerHTML = `
      <div class="tooltip-title">设备组</div>
      <div class="tooltip-content">
        <div class="row"><span class="label">设备数:</span><span>${cluster.deviceIds.length} 台</span></div>
        <div class="row"><span class="label">异常数:</span><span style="color:${cluster.alertCount > 0 ? '#ff3333' : '#4ecdc4'}">${cluster.alertCount} 台</span></div>
        <div class="row"><span class="label">包含:</span><span style="font-size:10px;">${deviceNames}</span></div>
      </div>
    `;

    this.tooltip.classList.add('visible');
    this.updateTooltipPosition(clientX, clientY);
  }

  showDeviceTooltip(device, clientX, clientY) {
    if (!this.tooltip) return;

    const data = this.deviceData[device.id] || { temperature: '--', capacity: '--', status: 'unknown' };
    const { isAlert, isWarning } = this.checkAlertStatus(data.temperature, data.capacity);
    
    const alertText = isAlert ? ' <span style="color:#ff3333;">⚠异常</span>' : 
                      isWarning ? ' <span style="color:#ffaa00;">⚠警告</span>' : '';

    this.tooltip.innerHTML = `
      <div class="tooltip-title">${this.getDeviceName(device.id)}${alertText}</div>
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
    this.tooltip.style.left = `${clientX + 15}px`;
    this.tooltip.style.top = `${clientY + 15}px`;
  }

  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.classList.remove('visible');
    }
    this.hoveredDevice = null;
  }

  update(deltaTime) {
    this.time += deltaTime;

    const targetPosition = new THREE.Vector3(0, 5, 0);
    const distance = this.camera.position.distanceTo(targetPosition);

    const showDetails = distance < this.detailDistance;
    const showClusters = distance > this.clusterDistance;

    const flashIntensity = (Math.sin(this.time * 10) + 1) / 2;
    const pulseIntensity = (Math.sin(this.time * 6) + 1) / 2;

    this.labels.forEach(label => {
      label.sprite.visible = showDetails;
      label.sprite.quaternion.copy(this.camera.quaternion);

      if (showDetails) {
        const data = this.deviceData[label.deviceId];
        const temp = data ? data.temperature : '--';
        const cap = data ? data.capacity : '--';
        const { isAlert, isWarning } = this.checkAlertStatus(temp, cap);

        const alertFlash = isAlert ? flashIntensity : 0;
        
        const { canvas, ctx, texture } = label.sprite.userData;
        this.drawLabel(ctx, label.deviceId, temp, cap, isAlert, isWarning, alertFlash);
        texture.needsUpdate = true;

        if (isAlert) {
          const scale = 1 + flashIntensity * 0.1;
          label.sprite.scale.set(8 * scale, 4 * scale, 1);
        }
      }
    });

    this.clusterSprites.forEach(cluster => {
      cluster.sprite.visible = showClusters;
      cluster.sprite.quaternion.copy(this.camera.quaternion);

      if (showClusters) {
        const hasAlert = cluster.alertCount > 0;
        const pulse = hasAlert ? pulseIntensity : 0;
        
        const { canvas, ctx, texture, deviceCount } = cluster.sprite.userData;
        this.drawCluster(ctx, deviceCount, hasAlert, cluster.alertCount, pulse);
        texture.needsUpdate = true;

        if (hasAlert) {
          const scale = 5 + pulseIntensity * 0.8;
          cluster.sprite.scale.set(scale, scale, 1);
        }
      }
    });
  }

  getDeviceData() {
    return this.deviceData;
  }
}

export default new DataVisualizer();
