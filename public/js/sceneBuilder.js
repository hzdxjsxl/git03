import textureLoader from './textureLoader.js';

class SceneBuilder {
  constructor() {
    this.scene = null;
    this.devices = [];
    this.conveyors = [];
    this.robots = [];
    this.machines = [];
  }

  init(scene) {
    this.scene = scene;
    this.devices = [];
    this.conveyors = [];
    this.robots = [];
    this.machines = [];
  }

  buildFactory() {
    this.createFloor();
    this.createWalls();
    this.createRoof();
    this.createConveyors();
    this.createRobots();
    this.createMachines();
    this.createPillars();
    this.createDecorations();
    
    return {
      devices: this.devices,
      conveyors: this.conveyors,
      robots: this.robots,
      machines: this.machines
    };
  }

  createFloor() {
    const floorGeometry = new THREE.PlaneGeometry(100, 80);
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: textureLoader.getTexture('floor'),
      roughness: 0.8,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.name = 'floor';
    this.scene.add(floor);

    const gridHelper = new THREE.GridHelper(100, 50, 0x006688, 0x004466);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);
  }

  createWalls() {
    const wallMaterial = new THREE.MeshStandardMaterial({
      map: textureLoader.getTexture('wall'),
      roughness: 0.9,
      metalness: 0.1
    });

    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(100, 20, 1),
      wallMaterial
    );
    backWall.position.set(0, 10, -40);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(1, 20, 80),
      wallMaterial
    );
    leftWall.position.set(-50, 10, 0);
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(1, 20, 80),
      wallMaterial
    );
    rightWall.position.set(50, 10, 0);
    rightWall.receiveShadow = true;
    this.scene.add(rightWall);

    this.createWindows(leftWall, rightWall, backWall);
  }

  createWindows(leftWall, rightWall, backWall) {
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x00aaff,
      transparent: true,
      opacity: 0.3,
      emissive: 0x0066aa,
      emissiveIntensity: 0.5
    });

    for (let i = -2; i <= 2; i++) {
      const windowLeft = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 4, 6),
        windowMaterial
      );
      windowLeft.position.set(-49.5, 12, i * 12);
      this.scene.add(windowLeft);

      const windowRight = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 4, 6),
        windowMaterial
      );
      windowRight.position.set(49.5, 12, i * 12);
      this.scene.add(windowRight);
    }
  }

  createRoof() {
    const roofMaterial = new THREE.MeshStandardMaterial({
      map: textureLoader.getTexture('roof'),
      roughness: 0.7,
      metalness: 0.3
    });

    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(100, 1, 80),
      roofMaterial
    );
    roof.position.set(0, 20, 0);
    roof.receiveShadow = true;
    this.scene.add(roof);

    this.createRoofLights();
  }

  createRoofLights() {
    const lightGeometry = new THREE.BoxGeometry(8, 0.3, 2);
    const lightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffee,
      emissive: 0xffffcc,
      emissiveIntensity: 1
    });

    const positions = [
      [-30, 19.7, -25], [0, 19.7, -25], [30, 19.7, -25],
      [-30, 19.7, 0], [0, 19.7, 0], [30, 19.7, 0],
      [-30, 19.7, 25], [0, 19.7, 25], [30, 19.7, 25]
    ];

    positions.forEach(pos => {
      const light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set(...pos);
      this.scene.add(light);

      const pointLight = new THREE.PointLight(0xffffcc, 0.5, 30);
      pointLight.position.set(pos[0], pos[1] - 2, pos[2]);
      this.scene.add(pointLight);
    });
  }

  createConveyors() {
    const conveyorPositions = [
      { id: 'conveyor_0', x: 0, z: -10, length: 40, rotation: 0 },
      { id: 'conveyor_1', x: -15, z: 10, length: 30, rotation: 0 }
    ];

    conveyorPositions.forEach((config, index) => {
      const conveyor = this.createConveyor(config.id, config.length);
      conveyor.position.set(config.x, 1, config.z);
      conveyor.rotation.y = config.rotation;
      this.scene.add(conveyor);
      this.conveyors.push(conveyor);
      this.devices.push({ id: config.id, mesh: conveyor, type: 'conveyor' });
    });
  }

  createConveyor(id, length) {
    const group = new THREE.Group();
    group.name = id;

    const beltMaterial = new THREE.MeshStandardMaterial({
      map: textureLoader.getTexture('conveyor'),
      roughness: 0.6,
      metalness: 0.4
    });

    const belt = new THREE.Mesh(
      new THREE.BoxGeometry(length, 0.3, 3),
      beltMaterial
    );
    belt.position.y = 0.15;
    belt.castShadow = true;
    belt.receiveShadow = true;
    belt.name = 'belt';
    group.add(belt);

    const frameMaterial = new THREE.MeshStandardMaterial({
      map: textureLoader.getTexture('metal'),
      roughness: 0.4,
      metalness: 0.7
    });

    const sideFrameGeometry = new THREE.BoxGeometry(length, 0.5, 0.2);
    const leftFrame = new THREE.Mesh(sideFrameGeometry, frameMaterial);
    leftFrame.position.set(0, -0.1, 1.6);
    leftFrame.castShadow = true;
    group.add(leftFrame);

    const rightFrame = new THREE.Mesh(sideFrameGeometry, frameMaterial);
    rightFrame.position.set(0, -0.1, -1.6);
    rightFrame.castShadow = true;
    group.add(rightFrame);

    const legCount = Math.floor(length / 4);
    for (let i = 0; i <= legCount; i++) {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 1, 0.2),
        frameMaterial
      );
      leg.position.set(-length / 2 + i * (length / legCount), -0.8, 1.4);
      leg.castShadow = true;
      group.add(leg);

      const leg2 = leg.clone();
      leg2.position.z = -1.4;
      group.add(leg2);
    }

    const rollerMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.3,
      metalness: 0.8
    });

    for (let i = 0; i <= legCount; i++) {
      const roller = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 3.2, 16),
        rollerMaterial
      );
      roller.rotation.z = Math.PI / 2;
      roller.position.set(-length / 2 + i * (length / legCount), -0.05, 0);
      roller.castShadow = true;
      roller.name = `roller_${i}`;
      group.add(roller);
    }

    this.addConveyorItems(group, length);
    return group;
  }

  addConveyorItems(group, length) {
    const itemColors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0x95e1d3, 0xf38181];
    
    for (let i = 0; i < 5; i++) {
      const itemGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);
      const itemMaterial = new THREE.MeshStandardMaterial({
        color: itemColors[i % itemColors.length],
        roughness: 0.5,
        metalness: 0.3
      });
      const item = new THREE.Mesh(itemGeometry, itemMaterial);
      item.position.set(-length / 2 + 2 + i * 7, 0.8, 0);
      item.castShadow = true;
      item.name = `item_${i}`;
      item.userData = { baseX: -length / 2 + 2 + i * 7, length };
      group.add(item);
    }
  }

  createRobots() {
    const robotPositions = [
      { id: 'robot_0', x: -8, z: -10 },
      { id: 'robot_1', x: 8, z: -10 },
      { id: 'robot_2', x: 0, z: 10 }
    ];

    robotPositions.forEach(config => {
      const robot = this.createRobotArm(config.id);
      robot.position.set(config.x, 1.2, config.z);
      this.scene.add(robot);
      this.robots.push(robot);
      this.devices.push({ id: config.id, mesh: robot, type: 'robot' });
    });
  }

  createRobotArm(id) {
    const group = new THREE.Group();
    group.name = id;

    const metalMaterial = new THREE.MeshStandardMaterial({
      map: textureLoader.getTexture('metal'),
      roughness: 0.3,
      metalness: 0.8
    });

    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      roughness: 0.5,
      metalness: 0.5
    });

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.5, 0.6, 32),
      metalMaterial
    );
    base.castShadow = true;
    base.name = 'base';
    group.add(base);

    const turret = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 0.8, 32),
      metalMaterial
    );
    turret.position.y = 0.7;
    turret.castShadow = true;
    turret.name = 'turret';
    group.add(turret);

    const arm1Group = new THREE.Group();
    arm1Group.position.y = 1.1;
    arm1Group.name = 'arm1Group';
    group.add(arm1Group);

    const shoulder = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 32, 32),
      accentMaterial
    );
    shoulder.castShadow = true;
    arm1Group.add(shoulder);

    const arm1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 4, 0.5),
      metalMaterial
    );
    arm1.position.y = 2;
    arm1.castShadow = true;
    arm1Group.add(arm1);

    const arm2Group = new THREE.Group();
    arm2Group.position.y = 4;
    arm2Group.name = 'arm2Group';
    arm1Group.add(arm2Group);

    const elbow = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 32, 32),
      accentMaterial
    );
    elbow.castShadow = true;
    arm2Group.add(elbow);

    const arm2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 3.5, 0.4),
      metalMaterial
    );
    arm2.position.y = 1.75;
    arm2.castShadow = true;
    arm2Group.add(arm2);

    const wristGroup = new THREE.Group();
    wristGroup.position.y = 3.5;
    wristGroup.name = 'wristGroup';
    arm2Group.add(wristGroup);

    const wrist = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 32, 32),
      accentMaterial
    );
    wrist.castShadow = true;
    wristGroup.add(wrist);

    const gripperGroup = new THREE.Group();
    gripperGroup.name = 'gripperGroup';
    wristGroup.add(gripperGroup);

    const gripperBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.3, 0.3),
      metalMaterial
    );
    gripperBase.position.y = 0.5;
    gripperBase.castShadow = true;
    gripperGroup.add(gripperBase);

    const fingerMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.4,
      metalness: 0.7
    });

    const leftFinger = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 1, 0.15),
      fingerMaterial
    );
    leftFinger.position.set(-0.35, 1, 0);
    leftFinger.castShadow = true;
    leftFinger.name = 'leftFinger';
    gripperGroup.add(leftFinger);

    const rightFinger = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 1, 0.15),
      fingerMaterial
    );
    rightFinger.position.set(0.35, 1, 0);
    rightFinger.castShadow = true;
    rightFinger.name = 'rightFinger';
    gripperGroup.add(rightFinger);

    return group;
  }

  createMachines() {
    const machinePositions = [
      { id: 'machine_0', x: -30, z: -10 },
      { id: 'machine_1', x: 30, z: 10 }
    ];

    machinePositions.forEach(config => {
      const machine = this.createMachine(config.id);
      machine.position.set(config.x, 0, config.z);
      this.scene.add(machine);
      this.machines.push(machine);
      this.devices.push({ id: config.id, mesh: machine, type: 'machine' });
    });
  }

  createMachine(id) {
    const group = new THREE.Group();
    group.name = id;

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x2c3e50,
      roughness: 0.6,
      metalness: 0.4
    });

    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0x3498db,
      roughness: 0.3,
      metalness: 0.6
    });

    const warningMaterial = new THREE.MeshStandardMaterial({
      map: textureLoader.getTexture('warning'),
      roughness: 0.7,
      metalness: 0.2
    });

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(8, 6, 6),
      bodyMaterial
    );
    body.position.y = 3;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const topPanel = new THREE.Mesh(
      new THREE.BoxGeometry(8.5, 0.5, 6.5),
      accentMaterial
    );
    topPanel.position.y = 6.25;
    topPanel.castShadow = true;
    group.add(topPanel);

    const screenMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 0.5
    });

    const screen = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2, 0.1),
      screenMaterial
    );
    screen.position.set(0, 3.5, 3.1);
    group.add(screen);

    const warningStrip1 = new THREE.Mesh(
      new THREE.BoxGeometry(8.2, 0.3, 0.1),
      warningMaterial
    );
    warningStrip1.position.set(0, 6, 3.1);
    group.add(warningStrip1);

    const warningStrip2 = warningStrip1.clone();
    warningStrip2.position.y = 0.5;
    group.add(warningStrip2);

    const legMaterial = new THREE.MeshStandardMaterial({
      map: textureLoader.getTexture('metal'),
      roughness: 0.4,
      metalness: 0.7
    });

    const legPositions = [
      [-3.5, -0.5, 2.5], [3.5, -0.5, 2.5],
      [-3.5, -0.5, -2.5], [3.5, -0.5, -2.5]
    ];

    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 1, 0.4),
        legMaterial
      );
      leg.position.set(...pos);
      leg.castShadow = true;
      group.add(leg);
    });

    const lightMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 1
    });

    const statusLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 16, 16),
      lightMaterial
    );
    statusLight.position.set(3, 5.5, 3.1);
    statusLight.name = 'statusLight';
    group.add(statusLight);

    return group;
  }

  createPillars() {
    const pillarMaterial = new THREE.MeshStandardMaterial({
      map: textureLoader.getTexture('metal'),
      roughness: 0.5,
      metalness: 0.6
    });

    const pillarPositions = [
      [-40, 0, -30], [40, 0, -30],
      [-40, 0, 0], [40, 0, 0],
      [-40, 0, 30], [40, 0, 30],
      [0, 0, -30], [0, 0, 30]
    ];

    pillarPositions.forEach(pos => {
      const pillar = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 20, 0.8),
        pillarMaterial
      );
      pillar.position.set(pos[0], 10, pos[2]);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.scene.add(pillar);
    });
  }

  createDecorations() {
    const safetyBarrierMaterial = new THREE.MeshStandardMaterial({
      map: textureLoader.getTexture('warning'),
      roughness: 0.8,
      metalness: 0.1
    });

    const barrierPositions = [
      { x: -25, z: -10, rotY: 0 },
      { x: 25, z: -10, rotY: 0 },
      { x: -25, z: 10, rotY: 0 },
      { x: 25, z: 10, rotY: 0 }
    ];

    barrierPositions.forEach(pos => {
      const barrier = new THREE.Mesh(
        new THREE.BoxGeometry(8, 1.2, 0.2),
        safetyBarrierMaterial
      );
      barrier.position.set(pos.x, 0.6, pos.z);
      barrier.rotation.y = pos.rotY;
      this.scene.add(barrier);
    });
  }

  getDeviceById(id) {
    return this.devices.find(d => d.id === id);
  }

  getAllDevices() {
    return this.devices;
  }
}

export default new SceneBuilder();
