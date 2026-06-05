class DataVisualizer {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.devices = [];
    this.deviceData = {};
    this.labels = [];
    this.clusterGroups = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredDevice = null;
    this.tooltip = null;
    this.deviceListContainer = null;
    this.time = 0;
    this.clusterThreshold = 60;
    this.detailThreshold = 35;
  }

  init(scene, camera, renderer, devices) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.devices = devices;
    this.tooltip = document.getElementById('tooltip');
    this.deviceListContainer = document.getElementById('device-list');

    this.createDataLabels();
    this.createClusterGroups();
    this.setupEventListeners();
  }

  createDataLabels() {
    this.devices.forEach(device => {
      const label = this.createLabelSprite(device);
      this.labels.push({ device, sprite: label, visible: true });
      this.scene.add(label);
    });
  }

  createClusterGroups() {
    const groups = [
      { id: 'cluster_robots', deviceIds: ['robot_0', 'robot_1', 'robot_2'], center: new THREE.Vector3(0, 6, 0) },
      { id: 'cluster_conveyors', deviceIds: ['conveyor_0', 'conveyor_1'], center: new THREE.Vector3(-8, 4, 0) },
      { id: 'cluster_machines', deviceIds: ['machine_0', 'machine_1'], center: new THREE.Vector3(0, 6, 0) }
    ];

    groups.forEach(group => {
      const sprite = this.createClusterSprite(group);
      sprite.visible = false;
      this.clusterGroups.push({ ...group, sprite, visible: false });
      this.scene.add(sprite);
    });
  }

  createClusterSprite(group) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    this.drawCluster(ctx, group.id, group.deviceIds.length, 0);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(6, 6, 1);
    sprite.position.copy(group.center);

    sprite.userData = { groupId: group.id, canvas, ctx, deviceCount: group.deviceIds.length };
    return sprite;
  }

  drawCluster(ctx, groupId, deviceCount, alertCount) {
    const width = 128;
    const height = 128;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 50;

    ctx.clearRect(0, 0, width, height);

    const hasAlert = alertCount > 0;
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    
    if (hasAlert) {
      gradient.addColorStop(0, 'rgba(255, 68, 68, 0.9)');
      gradient.addColorStop(0.7, 'rgba(200, 40, 40, 0.8)');
      gradient.addColorStop(1, 'rgba(150, 20, 20, 0)');
    } else {
      gradient.addColorStop(0, 'rgba(0, 200, 255, 0.8)');
      gradient.addColorStop(0.7, 'rgba(0, 150, 200, 0.6)');
      gradient.addColorStop(1, 'rgba(0, 100, 150, 0)');
    }

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 8, 0, Math.PI * 2);
    ctx.fillStyle = hasAlert ? 'rgba(255, 100, 100, 0.95)' : 'rgba(0, 180, 230, 0.95)';
    ctx.fill();

    ctx.strokeStyle = hasAlert ? '#ff8888' : '#88eeff';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Microsoft YaHei';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(deviceCount.toString(), centerX, centerY - 8);

    ctx.font = '12px Microsoft YaHei';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText('台设备', centerX, centerY + 20);

    if (hasAlert) {
      ctx.fillStyle = '#ffff00';
      ctx.font = 'bold 14px Microsoft YaHei';
      ctx.fillText(`⚠ ${alertCount}异常`, centerX, centerY + 42);
    }
  }

  createLabelSprite(device) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');

    this.drawLabel(ctx, device.id, '--', '--', false, false);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(8, 4.4, 1);

    const box = new THREE.Box3().setFromObject(device.mesh);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    sprite.position.set(center.x, center.y + size.y / 2 + 3, center.z);

    sprite.userData = { deviceId: device.id, canvas, ctx, isAlert: false, isWarning: false };
    return sprite;
  }

  drawLabel(ctx, deviceId, temperature, capacity, isAlert, isWarning) {
    const width = 256;
    const height = 140;

    ctx.clearRect(0, 0, width, height);

    let bgColor = 'rgba(10, 20, 40, 0.9)';
    let borderColor = 'rgba(0, 200, 255, 0.5)';
    let titleColor = '#00d4ff';
    let glowIntensity = 0;

    if (isAlert) {
      bgColor = 'rgba(60, 10, 10, 0.95)';
      borderColor = '#ff3333';
      titleColor = '#ff6666';
      glowIntensity = 0.6 + Math.sin(this.time * 15) * 0.4;
    } else if (isWarning) {
      bgColor = 'rgba(60, 40, 10, 0.9)';
      borderColor = '#ffaa00';
      titleColor = '#ffcc00';
    }

    if (isAlert) {
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 20 * glowIntensity;
    }

    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 12);
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.strokeStyle = isAlert ? `rgba(255, 50, 50, ${0.5 + glowIntensity * 0.5})` : borderColor;
    ctx.lineWidth = isAlert ? 3 : 2;
    ctx.stroke();

    if (isAlert) {
      ctx.fillStyle = '#ff3333';
      ctx.font = 'bold 14px Microsoft YaHei';
      ctx.textAlign = 'left';
      ctx.fillText('⚠ 异常警告', 15, 22);
    }

    ctx.fillStyle = titleColor;
    ctx.font = 'bold 18px Microsoft YaHei';
    ctx.textAlign = 'center';
    ctx.fillText(this.getDeviceName(deviceId), width / 2, isAlert ? 50 : 35);

    ctx.fillStyle = '#888';
    ctx.font = '14px Microsoft YaHei';
    ctx.textAlign = 'left';
    ctx.fillText('温度', 25, isAlert ? 85 : 70);
    ctx.fillText('产能', 25, isAlert ? 115 : 100);

    const tempColor = temperature === '--' ? '#666' : 
                      temperature > 60 ? '#ff3333' :
                      temperature > 50 ? '#ffaa00' : '#4ecdc4';
    ctx.fillStyle = tempColor;
    ctx.font = 'bold 20px Microsoft YaHei';
    ctx.textAlign = 'right';
    ctx.fillText(temperature === '--' ? '-- °C' : `${temperature} °C`, width - 25, isAlert ? 85 : 70);

    const capacityColor = capacity === '--' ? '#666' :
                          capacity < 30 ? '#ff3333' :
                          capacity < 50 ? '#ffaa00' : '#4ecdc4';
    ctx.fillStyle = capacityColor;
    ctx.fillText(capacity === '--' ? '-- %' : `${capacity} %`, width - 25, isAlert ? 115 : 100);
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

  checkDeviceAlert(temperature, capacity) {
    if (temperature === '--' || capacity === '--') return { isAlert: false, isWarning: false };
    
    const isTempCritical = temperature > 65;
    const isTempWarning = temperature > 55;
    const isCapacityCritical = capacity < 25;
    const isCapacityWarning = capacity < 40;

    return {
      isAlert: isTempCritical || isCapacityCritical,
      isWarning: (isTempWarning || isCapacityWarning) && !(isTempCritical || isCapacityCritical)
    };
  }

  updateDeviceData(deviceData) {
    this.deviceData = deviceData;

    this.labels.forEach(({ sprite }) => {
      const { deviceId, canvas, ctx } = sprite.userData;
      const data = deviceData[deviceId];
      if (data) {
        const { isAlert, isWarning } = this.checkDeviceAlert(data.temperature, data.capacity);
        sprite.userData.isAlert = isAlert;
        sprite.userData.isWarning = isWarning;
        this.drawLabel(ctx, deviceId, data.temperature, data.capacity, isAlert, isWarning);
        sprite.material.map.needsUpdate = true;
      }
    });

    this.updateClusterData(deviceData);
    this.updateDeviceList(deviceData);
  }

  updateClusterData(deviceData) {
    this.clusterGroups.forEach(group => {
      let alertCount = 0;
      group.deviceIds.forEach(id => {
        const data = deviceData[id];
        if (data) {
          const { isAlert } = this.checkDeviceAlert(data.temperature, data.capacity);
          if (isAlert) alertCount++;
        }
      });

      const { canvas, ctx, deviceCount } = group.sprite.userData;
      this.drawCluster(ctx, group.id, deviceCount, alertCount);
      group.sprite.material.map.needsUpdate = true;
      group.alertCount = alertCount;
    });
  }

  updateDeviceList(deviceData) {
    if (!this.deviceListContainer) return;

    this.deviceListContainer.innerHTML = '';

    Object.entries(deviceData).forEach(([id, data]) => {
      const item = document.createElement('div');
      const { isAlert, isWarning } = this.checkDeviceAlert(data.temperature, data.capacity);
      
      item.className = 'device-item';
      if (isAlert) {
        item.classList.add('danger');
      } else if (isWarning) {
        item.classList.add('warning');
      }

      const alertBadge = isAlert ? '<span style="color:#ff3333;animation:pulse 0.5s infinite;"> ⚠</span>' : '';

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

    const allSprites = [...this.labels.filter(l => l.visible).map(l => l.sprite), 
                       ...this.clusterGroups.filter(g => g.visible).map(g => g.sprite)];
    
    const intersects = this.raycaster.intersectObjects(allSprites);

    if (intersects.length > 0) {
      const clickedSprite = intersects[0].object;
      
      if (clickedSprite.userData.groupId) {
        const group = this.clusterGroups.find(g => g.id === clickedSprite.userData.groupId);
        if (group) {
          this.showClusterTooltip(group, clientX, clientY);
        }
      } else if (clickedSprite.userData.deviceId) {
        const device = this.devices.find(d => d.id === clickedSprite.userData.deviceId);
        if (device) {
          this.hoveredDevice = device;
          this.showTooltip(device, clientX, clientY);
        }
      }
    } else {
      this.hoveredDevice = null;
      this.hideTooltip();
    }
  }

  showClusterTooltip(group, clientX, clientY) {
    if (!this.tooltip) return;

    const deviceNames = group.deviceIds.map(id => this.getDeviceName(id)).join(', ');

    this.tooltip.innerHTML = `
      <div class="tooltip-title">设备组</div>
      <div class="tooltip-content">
        <div class="row"><span class="label">设备数量:</span><span>${group.deviceIds.length} 台</span></div>
        <div class="row"><span class="label">异常数量:</span><span style="color:${group.alertCount > 0 ? '#ff3333' : '#4ecdc4'}">${group.alertCount || 0} 台</span></div>
        <div class="row"><span class="label">包含设备:</span><span style="font-size:10px;">${deviceNames}</span></div>
      </div>
    `;

    this.tooltip.classList.add('visible');
    this.updateTooltipPosition(clientX, clientY);
  }

  showTooltip(device, clientX, clientY) {
    if (!this.tooltip) return;

    const data = this.deviceData[device.id] || { temperature: '--', capacity: '--', status: 'unknown' };
    const { isAlert, isWarning } = this.checkDeviceAlert(data.temperature, data.capacity);
    
    const alertText = isAlert ? '<span style="color:#ff3333;"> ⚠ 异常状态</span>' : 
                      isWarning ? '<span style="color:#ffaa00;"> ⚠ 警告状态</span>' : '';

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

  update(deltaTime) {
    this.time += deltaTime;

    const cameraDistance = this.camera.position.length();

    const showDetails = cameraDistance < this.detailThreshold;
    const showClusters = cameraDistance > this.clusterThreshold;

    this.labels.forEach(({ sprite }) => {
      sprite.visible = showDetails;
      sprite.quaternion.copy(this.camera.quaternion);

      if (sprite.userData.isAlert) {
        const flash = (Math.sin(this.time * 12) + 1) / 2;
        sprite.material.opacity = 0.7 + flash * 0.3;
        sprite.scale.setScalar(8 + flash * 0.5);
        sprite.scale.y = 4.4 + flash * 0.3;
      }
    });

    this.clusterGroups.forEach(group => {
      group.sprite.visible = showClusters;
      group.sprite.quaternion.copy(this.camera.quaternion);

      if (group.alertCount > 0) {
        const pulse = 1 + Math.sin(this.time * 8) * 0.15;
        group.sprite.scale.setScalar(6 * pulse);
      }
    });
  }

  getDeviceData() {
    return this.deviceData;
  }
}

export default new DataVisualizer();
