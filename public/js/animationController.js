class AnimationController {
  constructor() {
    this.conveyors = [];
    this.robots = [];
    this.machines = [];
    this.animationId = null;
    this.isPlaying = true;
    this.time = 0;
  }

  init(conveyors, robots, machines) {
    this.conveyors = conveyors;
    this.robots = robots;
    this.machines = machines;
    this.time = 0;
  }

  start() {
    this.isPlaying = true;
  }

  stop() {
    this.isPlaying = false;
  }

  toggle() {
    this.isPlaying = !this.isPlaying;
    return this.isPlaying;
  }

  update(deltaTime) {
    if (!this.isPlaying) return;
    
    this.time += deltaTime;
    
    this.updateConveyors(deltaTime);
    this.updateRobots();
    this.updateMachines();
  }

  updateConveyors(deltaTime) {
    this.conveyors.forEach(conveyor => {
      const belt = conveyor.getObjectByName('belt');
      if (belt && belt.material.map) {
        belt.material.map.offset.x += deltaTime * 0.5;
      }

      conveyor.children.forEach(child => {
        if (child.name.startsWith('roller_')) {
          child.rotation.x -= deltaTime * 3;
        }
      });

      conveyor.children.forEach(child => {
        if (child.name.startsWith('item_')) {
          const { baseX, length } = child.userData;
          child.position.x += deltaTime * 3;
          if (child.position.x > length / 2 + 1) {
            child.position.x = -length / 2 + 1;
          }
          child.rotation.y += deltaTime * 0.5;
        }
      });
    });
  }

  updateRobots() {
    this.robots.forEach((robot, index) => {
      const phaseOffset = index * Math.PI * 0.7;
      const t = this.time * 0.8 + phaseOffset;

      const turret = robot.getObjectByName('turret');
      const arm1Group = robot.getObjectByName('arm1Group');
      const arm2Group = robot.getObjectByName('arm2Group');
      const wristGroup = robot.getObjectByName('wristGroup');
      const gripperGroup = robot.getObjectByName('gripperGroup');
      const leftFinger = robot.getObjectByName('leftFinger');
      const rightFinger = robot.getObjectByName('rightFinger');

      if (turret) {
        turret.rotation.y = Math.sin(t * 0.5) * 0.8;
      }

      if (arm1Group) {
        arm1Group.rotation.z = Math.sin(t * 0.7) * 0.4 + 0.2;
      }

      if (arm2Group) {
        arm2Group.rotation.z = Math.sin(t * 1.1 + 0.5) * 0.5 - 0.3;
      }

      if (wristGroup) {
        wristGroup.rotation.z = Math.sin(t * 1.5) * 0.3;
        wristGroup.rotation.x = Math.sin(t * 0.9) * 0.5;
      }

      if (gripperGroup) {
        gripperGroup.rotation.z = Math.sin(t * 1.3) * 0.2;
      }

      if (leftFinger && rightFinger) {
        const gripAmount = (Math.sin(t * 2) + 1) * 0.5;
        leftFinger.position.x = -0.15 - gripAmount * 0.25;
        rightFinger.position.x = 0.15 + gripAmount * 0.25;
      }
    });
  }

  updateMachines() {
    this.machines.forEach((machine, index) => {
      const t = this.time * 2 + index * Math.PI * 0.5;
      
      const statusLight = machine.getObjectByName('statusLight');
      if (statusLight) {
        const intensity = (Math.sin(t) + 1) * 0.5 + 0.5;
        statusLight.material.emissiveIntensity = intensity;
      }

      machine.children.forEach(child => {
        if (child.name === 'screen') {
          const hue = (this.time * 0.1) % 1;
          child.material.emissive.setHSL(hue, 1, 0.5);
          child.material.color.setHSL(hue, 1, 0.5);
        }
      });
    });
  }

  getAnimationState() {
    return {
      isPlaying: this.isPlaying,
      time: this.time
    };
  }
}

export default new AnimationController();
