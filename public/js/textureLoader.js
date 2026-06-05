class TextureLoader {
  constructor() {
    this.loader = new THREE.TextureLoader();
    this.textures = {};
  }

  createColorTexture(color, width = 256, height = 256) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  createGridTexture(lineColor = '#00d4ff', bgColor = '#1a1a2e', gridSize = 32) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 256, 256);
    
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    
    for (let i = 0; i <= 8; i++) {
      const pos = (i / 8) * 256;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, 256);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(256, pos);
      ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(gridSize, gridSize);
    return texture;
  }

  createMetalTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#4a5568');
    gradient.addColorStop(0.3, '#718096');
    gradient.addColorStop(0.5, '#a0aec0');
    gradient.addColorStop(0.7, '#718096');
    gradient.addColorStop(1, '#4a5568');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.1})`;
      ctx.fillRect(
        Math.random() * 512,
        Math.random() * 512,
        Math.random() * 100 + 50,
        Math.random() * 3 + 1
      );
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  createConveyorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(0, 0, 256, 64);
    
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 2;
    for (let i = 0; i < 16; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 16, 0);
      ctx.lineTo(i * 16, 64);
      ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  createWarningStripes(color1 = '#ffcc00', color2 = '#1a1a1a') {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 === 0 ? color1 : color2;
      ctx.fillRect(i * 16, 0, 16, 128);
    }
    
    ctx.save();
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = color2;
    ctx.fillRect(-64, 0, 256, 128);
    ctx.restore();
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  loadTexture(name, url) {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (texture) => {
          this.textures[name] = texture;
          resolve(texture);
        },
        undefined,
        (error) => {
          console.error(`加载贴图 ${name} 失败:`, error);
          reject(error);
        }
      );
    });
  }

  getTexture(name) {
    return this.textures[name] || null;
  }

  preloadDefaultTextures() {
    this.textures = {
      floor: this.createGridTexture(),
      metal: this.createMetalTexture(),
      conveyor: this.createConveyorTexture(),
      warning: this.createWarningStripes(),
      wall: this.createColorTexture('#1e293b'),
      roof: this.createColorTexture('#334155')
    };
    return this.textures;
  }
}

export default new TextureLoader();
