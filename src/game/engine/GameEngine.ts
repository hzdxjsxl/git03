import Matter from 'matter-js';
import { GameEntity } from '../entities/GameEntity';
import { Player } from '../entities/Player';
import { Platform } from '../entities/Platform';
import { LaserSystem } from '../systems/LaserSystem';
import { GrappleSystem } from '../systems/GrappleSystem';
import { LevelData } from '../levels/LevelData';

export interface GameConfig {
  width: number;
  height: number;
  gravity: number;
}

export class GameEngine {
  private engine: Matter.Engine;
  private runner: Matter.Runner;
  private canvas: HTMLCanvasElement;
  private entities: Map<string, GameEntity> = new Map();
  private player: Player | null = null;
  private laserSystem: LaserSystem;
  private grappleSystem: GrappleSystem;
  private animationFrameId: number | null = null;
  private onGameOver: (() => void) | null = null;
  private onVictory: (() => void) | null = null;
  private isRunning = false;
  private startTime = 0;
  private score = 0;
  private config: GameConfig;
  private camera = { x: 0, y: 0 };
  private goalX = 0;

  constructor(canvas: HTMLCanvasElement, config: GameConfig) {
    this.canvas = canvas;
    this.config = config;
    
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: config.gravity }
    });

    this.runner = Matter.Runner.create();
    this.laserSystem = new LaserSystem(this);
    this.grappleSystem = new GrappleSystem(this);

    this.setupCollisionEvents();
  }

  private setupCollisionEvents(): void {
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;
        
        if (this.player && (bodyA === this.player.getBody() || bodyB === this.player.getBody())) {
          const otherBody = bodyA === this.player.getBody() ? bodyB : bodyA;
          
          if (otherBody.label === 'goal') {
            this.handleVictory();
          }
          
          if (otherBody.label === 'grapplePoint') {
            this.grappleSystem.handleGrapplePointCollision(otherBody);
          }
        }
      });
    });
  }

  loadLevel(levelData: LevelData): void {
    this.clearLevel();
    
    this.goalX = levelData.goalX;
    
    levelData.platforms.forEach((platformData) => {
      const platform = new Platform(platformData);
      this.addEntity(platform);
    });

    levelData.lasers.forEach((laserData) => {
      this.laserSystem.addLaser(laserData);
    });

    this.player = new Player({
      x: levelData.playerStart.x,
      y: levelData.playerStart.y
    }, this);
    this.addEntity(this.player);

    const goal = Matter.Bodies.rectangle(
      levelData.goalX,
      levelData.goalY,
      50,
      100,
      {
        isStatic: true,
        isSensor: true,
        label: 'goal',
        render: {
          fillStyle: '#00ff88'
        }
      }
    );
    Matter.Composite.add(this.engine.world, goal);
  }

  addEntity(entity: GameEntity): void {
    this.entities.set(entity.getId(), entity);
    Matter.Composite.add(this.engine.world, entity.getBody());
  }

  removeEntity(entity: GameEntity): void {
    this.entities.delete(entity.getId());
    Matter.Composite.remove(this.engine.world, entity.getBody());
  }

  getPlayer(): Player | null {
    return this.player;
  }

  getEngine(): Matter.Engine {
    return this.engine;
  }

  getLaserSystem(): LaserSystem {
    return this.laserSystem;
  }

  getGrappleSystem(): GrappleSystem {
    return this.grappleSystem;
  }

  getConfig(): GameConfig {
    return this.config;
  }

  getScore(): number {
    return this.score;
  }

  getTime(): number {
    return this.isRunning ? (Date.now() - this.startTime) / 1000 : 0;
  }

  getCamera(): { x: number; y: number } {
    return this.camera;
  }

  setOnGameOver(callback: () => void): void {
    this.onGameOver = callback;
  }

  setOnVictory(callback: () => void): void {
    this.onVictory = callback;
  }

  handleGameOver(): void {
    this.stop();
    if (this.onGameOver) {
      this.onGameOver();
    }
  }

  private handleVictory(): void {
    this.stop();
    this.score = Math.max(0, 10000 - Math.floor(this.getTime() * 100));
    if (this.onVictory) {
      this.onVictory();
    }
  }

  private clearLevel(): void {
    this.entities.forEach((entity) => {
      Matter.Composite.remove(this.engine.world, entity.getBody());
    });
    this.entities.clear();
    this.laserSystem.clear();
    this.grappleSystem.release();
    this.player = null;
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.startTime = Date.now();
    Matter.Runner.run(this.runner, this.engine);
    this.gameLoop();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    Matter.Runner.stop(this.runner);
  }

  private gameLoop = (): void => {
    if (!this.isRunning) return;

    this.update();
    this.renderScene();

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private update(): void {
    this.entities.forEach((entity) => {
      entity.update();
    });

    this.laserSystem.update();
    this.grappleSystem.update();
    
    if (this.laserSystem.checkPlayerCollision()) {
      this.handleGameOver();
    }

    this.updateCamera();
  }

  private updateCamera(): void {
    if (!this.player) return;
    
    const playerPos = this.player.getBody().position;
    const targetX = playerPos.x - this.config.width / 2;
    const targetY = playerPos.y - this.config.height / 2;
    
    this.camera.x += (targetX - this.camera.x) * 0.1;
    this.camera.y += (targetY - this.camera.y) * 0.1;
  }

  private renderScene(): void {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, this.config.width, this.config.height);

    ctx.save();
    ctx.translate(-this.camera.x, -this.camera.y);

    this.renderGrid(ctx);

    this.entities.forEach((entity) => {
      entity.render(ctx);
    });

    this.laserSystem.render(ctx);
    this.grappleSystem.render(ctx);
    this.renderGoal(ctx);

    ctx.restore();

    this.renderHUD(ctx);
  }

  private renderGrid(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.1)';
    ctx.lineWidth = 1;

    const gridSize = 50;
    const startX = Math.floor(this.camera.x / gridSize) * gridSize;
    const startY = Math.floor(this.camera.y / gridSize) * gridSize;

    for (let x = startX; x < this.camera.x + this.config.width + gridSize; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, this.camera.y);
      ctx.lineTo(x, this.camera.y + this.config.height);
      ctx.stroke();
    }

    for (let y = startY; y < this.camera.y + this.config.height + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(this.camera.x, y);
      ctx.lineTo(this.camera.x + this.config.width, y);
      ctx.stroke();
    }
  }

  private renderGoal(ctx: CanvasRenderingContext2D): void {
    const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
    
    ctx.shadowBlur = 20;
    ctx.shadowColor = `rgba(0, 255, 136, ${pulse})`;
    ctx.fillStyle = `rgba(0, 255, 136, ${pulse * 0.5})`;
    ctx.fillRect(this.goalX - 25, 0, 50, this.config.height);
    
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 3;
    ctx.strokeRect(this.goalX - 25, 0, 50, this.config.height);
    
    ctx.shadowBlur = 0;
  }

  private renderHUD(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#00f5ff';
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    
    const time = this.getTime().toFixed(1);
    ctx.fillText(`时间: ${time}s`, 20, 35);
    
    if (this.player) {
      ctx.fillText(`钩爪: ${this.grappleSystem.isAttached() ? '已连接' : '就绪'}`, 20, 65);
    }

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff3366';
    ctx.fillText('[WASD] 移动  [鼠标] 瞄准  [左键] 发射钩爪', this.config.width - 20, 35);
  }

  handleKeyDown(key: string): void {
    if (this.player) {
      this.player.handleKeyDown(key);
    }
  }

  handleKeyUp(key: string): void {
    if (this.player) {
      this.player.handleKeyUp(key);
    }
  }

  handleMouseMove(x: number, y: number): void {
    const worldX = x + this.camera.x;
    const worldY = y + this.camera.y;
    this.grappleSystem.setAimPosition(worldX, worldY);
  }

  handleMouseDown(x: number, y: number): void {
    const worldX = x + this.camera.x;
    const worldY = y + this.camera.y;
    this.grappleSystem.fire(worldX, worldY);
  }

  handleMouseUp(): void {
    this.grappleSystem.release();
  }

  destroy(): void {
    this.stop();
    Matter.Engine.clear(this.engine);
  }
}
