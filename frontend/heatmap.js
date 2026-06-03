class ChromosomeHeatmap {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.tileCache = new Map();
        this.loadingTiles = new Set();
        
        this.baseSize = 4096;
        this.tileSize = 256;
        this.numLevels = 6;
        this.maxValue = 1.0;
        
        this.viewX = 0;
        this.viewY = 0;
        this.scale = 1.0;
        this.minScale = 0.05;
        this.maxScale = 4.0;
        
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.mouseCanvasX = 0;
        this.mouseCanvasY = 0;
        this.showCrosshair = false;
        
        this.animationFrame = null;
        this.needsRender = true;
        
        this.init();
    }
    
    async init() {
        this.resize();
        this.setupColorbar();
        this.setupEventListeners();
        
        try {
            const response = await fetch('/api/info');
            const info = await response.json();
            this.baseSize = info.baseSize;
            this.tileSize = info.tileSize;
            this.numLevels = info.numLevels;
            this.maxValue = info.maxValue;
            
            this.fitToView();
            
            document.getElementById('loading').style.display = 'none';
            
            this.startRenderLoop();
        } catch (e) {
            console.error('Failed to load server info:', e);
            document.getElementById('loading').innerHTML = '<div style="color:#f66">连接服务器失败</div>';
        }
    }
    
    setupColorbar() {
        const gradientEl = document.getElementById('colorbar-gradient');
        const canvas = document.createElement('canvas');
        canvas.width = 10;
        canvas.height = 260;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 260);
        gradient.addColorStop(0, '#ff4444');
        gradient.addColorStop(0.3, '#ffaa00');
        gradient.addColorStop(0.6, '#44ff44');
        gradient.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 10, 260);
        gradientEl.style.background = `url(${canvas.toDataURL()})`;
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.resize();
            this.needsRender = true;
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        });
        
        window.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
        });
        
        window.addEventListener('mousemove', (e) => {
            const canvasRect = this.canvas.getBoundingClientRect();
            this.mouseCanvasX = e.clientX - canvasRect.left;
            this.mouseCanvasY = e.clientY - canvasRect.top;
            
            if (this.isDragging) {
                const dx = e.clientX - this.lastMouseX;
                const dy = e.clientY - this.lastMouseY;
                this.viewX -= dx / this.scale;
                this.viewY -= dy / this.scale;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
            this.updateTooltip(e);
            this.needsRender = true;
        });
        
        window.addEventListener('keydown', (e) => {
            if (e.shiftKey) {
                this.showCrosshair = true;
                this.needsRender = true;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (!e.shiftKey) {
                this.showCrosshair = false;
                this.needsRender = true;
            }
        });
        
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoomAtPoint(e.clientX, e.clientY, zoomFactor);
        }, { passive: false });
        
        this.canvas.addEventListener('mouseleave', () => {
            document.getElementById('tooltip').style.display = 'none';
        });
    }
    
    zoomAtPoint(clientX, clientY, factor) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = clientX - rect.left;
        const canvasY = clientY - rect.top;
        
        const worldX = canvasX / this.scale + this.viewX;
        const worldY = canvasY / this.scale + this.viewY;
        
        this.scale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * factor));
        
        this.viewX = worldX - canvasX / this.scale;
        this.viewY = worldY - canvasY / this.scale;
        
        this.needsRender = true;
    }
    
    zoomIn() {
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        this.zoomAtPoint(cx + this.canvas.getBoundingClientRect().left, 
                         cy + this.canvas.getBoundingClientRect().top, 1.3);
    }
    
    zoomOut() {
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        this.zoomAtPoint(cx + this.canvas.getBoundingClientRect().left, 
                         cy + this.canvas.getBoundingClientRect().top, 0.7);
    }
    
    resetView() {
        this.fitToView();
        this.needsRender = true;
    }
    
    fitToView() {
        const padding = 50;
        const scaleX = (this.canvas.width - padding * 2) / this.baseSize;
        const scaleY = (this.canvas.height - padding * 2) / this.baseSize;
        this.scale = Math.min(scaleX, scaleY);
        
        this.viewX = this.baseSize / 2 - this.canvas.width / (2 * this.scale);
        this.viewY = this.baseSize / 2 - this.canvas.height / (2 * this.scale);
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    getCurrentLevel() {
        let level = 0;
        for (let i = 0; i < this.numLevels - 1; i++) {
            const worldTileSize = this.tileSize * Math.pow(2, i);
            const screenTileSize = worldTileSize * this.scale;
            if (screenTileSize < 128) {
                level = i + 1;
            } else {
                break;
            }
        }
        return Math.min(level, this.numLevels - 1);
    }
    
    worldToTile(worldX, worldY, level) {
        const levelScale = Math.pow(2, level);
        const levelSize = this.baseSize / levelScale;
        const tilesPerSide = Math.ceil(levelSize / this.tileSize);
        
        return {
            x: Math.floor(worldX / (this.tileSize * levelScale)),
            y: Math.floor(worldY / (this.tileSize * levelScale)),
            tilesPerSide
        };
    }
    
    async fetchTile(level, x, y) {
        const key = `${level}_${x}_${y}`;
        
        if (this.tileCache.has(key)) {
            return this.tileCache.get(key);
        }
        
        if (this.loadingTiles.has(key)) {
            return null;
        }
        
        this.loadingTiles.add(key);
        
        try {
            const response = await fetch(`/api/tile/${level}/${x}/${y}`);
            const tile = await response.json();
            
            if (!tile.isEmpty) {
                this.tileCache.set(key, tile);
            }
            
            this.loadingTiles.delete(key);
            this.needsRender = true;
            
            return tile;
        } catch (e) {
            this.loadingTiles.delete(key);
            return null;
        }
    }
    
    valueToColor(value) {
        const normalized = Math.min(value / this.maxValue, 1.0);
        
        if (normalized < 0.01) {
            return [26, 26, 46, 0];
        }
        
        let r, g, b;
        
        if (normalized < 0.4) {
            const t = normalized / 0.4;
            r = Math.floor(26 + t * 68);
            g = Math.floor(26 + t * 255);
            b = Math.floor(46 + t * 0);
        } else if (normalized < 0.7) {
            const t = (normalized - 0.4) / 0.3;
            r = Math.floor(94 + t * 161);
            g = Math.floor(255 - t * 85);
            b = 46;
        } else {
            const t = (normalized - 0.7) / 0.3;
            r = 255;
            g = Math.floor(170 - t * 102);
            b = Math.floor(46 - t * 46);
        }
        
        const alpha = Math.min(1, normalized * 2 + 0.3);
        return [r, g, b, alpha * 255];
    }
    
    renderTile(tile, level) {
        const levelScale = Math.pow(2, level);
        const tileWorldSize = this.tileSize * levelScale;
        
        const screenX = (tile.x * tileWorldSize - this.viewX) * this.scale;
        const screenY = (tile.y * tileWorldSize - this.viewY) * this.scale;
        const screenSize = tileWorldSize * this.scale;
        
        const imageData = this.ctx.createImageData(this.tileSize, this.tileSize);
        const data = imageData.data;
        
        for (let i = 0; i < this.tileSize; i++) {
            for (let j = 0; j < this.tileSize; j++) {
                const value = tile.values[i][j];
                const [r, g, b, a] = this.valueToColor(value);
                
                const idx = (i * this.tileSize + j) * 4;
                data[idx] = r;
                data[idx + 1] = g;
                data[idx + 2] = b;
                data[idx + 3] = a;
            }
        }
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.tileSize;
        tempCanvas.height = this.tileSize;
        tempCanvas.getContext('2d').putImageData(imageData, 0, 0);
        
        this.ctx.drawImage(tempCanvas, screenX, screenY, screenSize, screenSize);
    }
    
    render() {
        const { width, height } = this.canvas;
        this.ctx.fillStyle = '#0a0a0f';
        this.ctx.fillRect(0, 0, width, height);
        
        const currentLevel = this.getCurrentLevel();
        
        const worldLeft = this.viewX;
        const worldTop = this.viewY;
        const worldRight = this.viewX + width / this.scale;
        const worldBottom = this.viewY + height / this.scale;
        
        const levelScale = Math.pow(2, currentLevel);
        const tileWorldSize = this.tileSize * levelScale;
        
        const startTileX = Math.max(0, Math.floor(worldLeft / tileWorldSize));
        const startTileY = Math.max(0, Math.floor(worldTop / tileWorldSize));
        const endTileX = Math.ceil(worldRight / tileWorldSize);
        const endTileY = Math.ceil(worldBottom / tileWorldSize);
        
        const maxTiles = Math.ceil((this.baseSize / levelScale) / this.tileSize);
        
        let loadedCount = 0;
        let totalCount = 0;
        
        for (let tx = startTileX; tx <= endTileX; tx++) {
            for (let ty = startTileY; ty <= endTileY; ty++) {
                if (tx < 0 || ty < 0 || tx >= maxTiles || ty >= maxTiles) continue;
                
                totalCount++;
                const key = `${currentLevel}_${tx}_${ty}`;
                
                if (this.tileCache.has(key)) {
                    this.renderTile(this.tileCache.get(key), currentLevel);
                    loadedCount++;
                } else {
                    this.fetchTile(currentLevel, tx, ty);
                }
            }
        }
        
        this.updateInfoPanel(currentLevel, loadedCount, totalCount);
        
        if (this.showCrosshair) {
            this.drawCrosshair();
        }
    }
    
    drawCrosshair() {
        const { width, height } = this.canvas;
        const cx = this.mouseCanvasX;
        const cy = this.mouseCanvasY;
        
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 100, 100, 0.9)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([4, 4]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(cx, 0);
        this.ctx.lineTo(cx, height);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, cy);
        this.ctx.lineTo(width, cy);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
        this.ctx.strokeStyle = 'rgba(255, 100, 100, 1)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        this.ctx.stroke();
        
        const worldX = cx / this.scale + this.viewX;
        const worldY = cy / this.scale + this.viewY;
        
        this.ctx.fillStyle = 'rgba(255, 100, 100, 0.95)';
        this.ctx.fillRect(cx + 12, cy - 28, 160, 22);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`(${Math.floor(worldX)}, ${Math.floor(worldY)})`, cx + 18, cy - 12);
        
        this.ctx.restore();
    }
    
    updateInfoPanel(level, loaded, total) {
        document.getElementById('level-display').textContent = level;
        document.getElementById('zoom-display').textContent = (this.scale * 100).toFixed(1) + '%';
        document.getElementById('pos-display').textContent = 
            `${Math.floor(this.viewX)}, ${Math.floor(this.viewY)}`;
        document.getElementById('tile-display').textContent = `${loaded}/${total}`;
    }
    
    updateTooltip(e) {
        const canvasRect = this.canvas.getBoundingClientRect();
        
        const canvasX = e.clientX - canvasRect.left;
        const canvasY = e.clientY - canvasRect.top;
        
        const worldX = canvasX / this.scale + this.viewX;
        const worldY = canvasY / this.scale + this.viewY;
        
        const worldXInt = Math.floor(worldX);
        const worldYInt = Math.floor(worldY);
        
        const tooltip = document.getElementById('tooltip');
        
        if (worldXInt >= 0 && worldXInt < this.baseSize && worldYInt >= 0 && worldYInt < this.baseSize) {
            tooltip.style.display = 'block';
            
            const tooltipOffsetX = 18;
            const tooltipOffsetY = 18;
            
            let tooltipLeft = e.clientX + tooltipOffsetX;
            let tooltipTop = e.clientY + tooltipOffsetY;
            
            if (tooltipLeft + 200 > window.innerWidth) {
                tooltipLeft = e.clientX - tooltipOffsetX - 200;
            }
            if (tooltipTop + 60 > window.innerHeight) {
                tooltipTop = e.clientY - tooltipOffsetY - 60;
            }
            
            tooltip.style.left = tooltipLeft + 'px';
            tooltip.style.top = tooltipTop + 'px';
            
            const interactionValue = this.getInteractionValue(worldXInt, worldYInt);
            
            tooltip.innerHTML = `
                <div style="margin-bottom:4px;"><strong>基因座坐标</strong></div>
                <div style="color:#6af;">Chr1: ${worldXInt.toLocaleString()} - ${(worldXInt + 1).toLocaleString()}</div>
                <div style="color:#6af;">Chr1: ${worldYInt.toLocaleString()} - ${(worldYInt + 1).toLocaleString()}</div>
                <div style="margin-top:6px;padding-top:6px;border-top:1px solid #333;">
                    <div><strong>交互强度:</strong> <span style="color:${interactionValue > 0.7 ? '#f66' : interactionValue > 0.3 ? '#fa6' : '#6f6'}">${interactionValue.toFixed(3)}</span></div>
                    <div style="color:#888;font-size:11px;margin-top:2px;">
                        层级 ${this.getCurrentLevel()} | 缩放 ${(this.scale * 100).toFixed(1)}%
                    </div>
                </div>
            `;
        } else {
            tooltip.style.display = 'none';
        }
    }
    
    getInteractionValue(worldX, worldY) {
        const level = this.getCurrentLevel();
        const levelScale = Math.pow(2, level);
        const tileSize = this.tileSize * levelScale;
        
        const tileX = Math.floor(worldX / tileSize);
        const tileY = Math.floor(worldY / tileSize);
        
        const key = `${level}_${tileX}_${tileY}`;
        const tile = this.tileCache.get(key);
        
        if (!tile) return 0;
        
        const localX = Math.floor((worldX % tileSize) / levelScale);
        const localY = Math.floor((worldY % tileSize) / levelScale);
        
        if (localX >= 0 && localX < this.tileSize && localY >= 0 && localY < this.tileSize) {
            return tile.values[localY][localX] || 0;
        }
        return 0;
    }
    
    startRenderLoop() {
        const loop = () => {
            if (this.needsRender) {
                this.render();
                this.needsRender = false;
            }
            this.animationFrame = requestAnimationFrame(loop);
        };
        loop();
    }
}

const heatmap = new ChromosomeHeatmap();
