import Matter from 'matter-js';
import { GameEngine } from '../engine/GameEngine';
import { LaserData } from '../levels/LevelData';

interface Laser {
  id: string;
  data: LaserData;
  isActive: boolean;
  lastToggleTime: number;
  endPoint: { x: number; y: number };
}

export class LaserSystem {
  private gameEngine: GameEngine;
  private lasers: Laser[] = [];
  private startTime: number = Date.now();

  constructor(gameEngine: GameEngine) {
    this.gameEngine = gameEngine;
  }

  addLaser(data: LaserData): void {
    const angleRad = (data.angle * Math.PI) / 180;
    const endPoint = {
      x: data.x + Math.cos(angleRad) * data.length,
      y: data.y + Math.sin(angleRad) * data.length
    };

    this.lasers.push({
      id: `laser_${Date.now()}_${Math.random()}`,
      data,
      isActive: false,
      lastToggleTime: data.offsetTime,
      endPoint
    });
  }

  clear(): void {
    this.lasers = [];
    this.startTime = Date.now();
  }

  update(): void {
    const currentTime = Date.now() - this.startTime;

    this.lasers.forEach((laser) => {
      const cycleTime = laser.data.cycleTime;
      const halfCycle = cycleTime / 2;
      const timeInCycle = (currentTime + laser.data.offsetTime) % cycleTime;
      
      laser.isActive = timeInCycle < halfCycle;
    });
  }

  checkPlayerCollision(): boolean {
    const player = this.gameEngine.getPlayer();
    if (!player) return false;

    const playerBody = player.getBody();
    const playerPos = playerBody.position;
    const playerRadius = 20;

    for (const laser of this.lasers) {
      if (!laser.isActive) continue;

      const distance = this.pointToLineDistance(
        playerPos.x,
        playerPos.y,
        laser.data.x,
        laser.data.y,
        laser.endPoint.x,
        laser.endPoint.y
      );

      if (distance < playerRadius) {
        return true;
      }
    }

    return false;
  }

  private pointToLineDistance(
    px: number, py: number,
    x1: number, y1: number,
    x2: number, y2: number
  ): number {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    return Math.hypot(px - xx, py - yy);
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.lasers.forEach((laser) => {
      const currentTime = Date.now() - this.startTime;
      const cycleTime = laser.data.cycleTime;
      const halfCycle = cycleTime / 2;
      const timeInCycle = (currentTime + laser.data.offsetTime) % cycleTime;
      
      const isActive = timeInCycle < halfCycle;
      const warningTime = 500;
      const timeUntilActive = isActive 
        ? 0 
        : Math.max(0, halfCycle - timeInCycle);
      const isWarning = !isActive && timeUntilActive < warningTime;

      if (isWarning) {
        const flashIntensity = Math.sin((Date.now() / 100) * Math.PI) * 0.5 + 0.5;
        
        ctx.strokeStyle = `rgba(255, 51, 102, ${flashIntensity * 0.5})`;
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(laser.data.x, laser.data.y);
        ctx.lineTo(laser.endPoint.x, laser.endPoint.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (isActive) {
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#ff3366';
        
        ctx.strokeStyle = '#ff3366';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(laser.data.x, laser.data.y);
        ctx.lineTo(laser.endPoint.x, laser.endPoint.y);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(laser.data.x, laser.data.y);
        ctx.lineTo(laser.endPoint.x, laser.endPoint.y);
        ctx.stroke();

        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = isActive ? '#ff3366' : '#4a1a2a';
      ctx.beginPath();
      ctx.arc(laser.data.x, laser.data.y, 15, 0, Math.PI * 2);
      ctx.fill();

      if (isActive) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(laser.data.x, laser.data.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }
}
