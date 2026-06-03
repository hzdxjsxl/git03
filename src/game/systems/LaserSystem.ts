import Matter from 'matter-js';
import { GameEngine } from '../engine/GameEngine';
import { LaserData, LaserPhase } from '../levels/LevelData';

interface Laser {
  id: string;
  data: LaserData;
  phase: LaserPhase;
  phaseElapsed: number;
  endPoint: { x: number; y: number };
}

export class LaserSystem {
  private gameEngine: GameEngine;
  private lasers: Laser[] = [];
  private lastUpdateTime: number = 0;
  private started: boolean = false;

  constructor(gameEngine: GameEngine) {
    this.gameEngine = gameEngine;
  }

  addLaser(data: LaserData): void {
    const angleRad = (data.angle * Math.PI) / 180;
    const endPoint = {
      x: data.x + Math.cos(angleRad) * data.length,
      y: data.y + Math.sin(angleRad) * data.length
    };

    const cycleTotal = data.inactiveTime + data.warningTime + data.activeTime;
    let initialPhase: LaserPhase = 'inactive';
    let initialElapsed = data.offsetTime % cycleTotal;

    if (initialElapsed < data.inactiveTime) {
      initialPhase = 'inactive';
    } else if (initialElapsed < data.inactiveTime + data.warningTime) {
      initialPhase = 'warning';
      initialElapsed -= data.inactiveTime;
    } else {
      initialPhase = 'active';
      initialElapsed -= data.inactiveTime + data.warningTime;
    }

    this.lasers.push({
      id: `laser_${Date.now()}_${Math.random()}`,
      data,
      phase: initialPhase,
      phaseElapsed: initialElapsed,
      endPoint
    });
  }

  clear(): void {
    this.lasers = [];
    this.started = false;
  }

  update(): void {
    const now = Date.now();
    if (!this.started) {
      this.lastUpdateTime = now;
      this.started = true;
      return;
    }

    const delta = now - this.lastUpdateTime;
    this.lastUpdateTime = now;

    for (const laser of this.lasers) {
      laser.phaseElapsed += delta;

      switch (laser.phase) {
        case 'inactive':
          if (laser.phaseElapsed >= laser.data.inactiveTime) {
            laser.phaseElapsed -= laser.data.inactiveTime;
            laser.phase = 'warning';
          }
          break;

        case 'warning':
          if (laser.phaseElapsed >= laser.data.warningTime) {
            laser.phaseElapsed -= laser.data.warningTime;
            laser.phase = 'active';
          }
          break;

        case 'active':
          if (laser.phaseElapsed >= laser.data.activeTime) {
            laser.phaseElapsed -= laser.data.activeTime;
            laser.phase = 'inactive';
          }
          break;
      }
    }
  }

  private isLethal(laser: Laser): boolean {
    return laser.phase === 'active';
  }

  checkPlayerCollision(): boolean {
    const player = this.gameEngine.getPlayer();
    if (!player) return false;

    const playerBody = player.getBody();
    const playerPos = playerBody.position;
    const playerRadius = 18;

    for (const laser of this.lasers) {
      if (!this.isLethal(laser)) continue;

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

    let xx: number, yy: number;

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
    for (const laser of this.lasers) {
      this.renderLaserEmitter(ctx, laser);
      this.renderLaserBeam(ctx, laser);
    }
  }

  private renderLaserEmitter(ctx: CanvasRenderingContext2D, laser: Laser): void {
    const { x, y } = laser.data;
    const { phase } = laser;

    ctx.save();

    if (phase === 'active') {
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#ff3366';
      ctx.fillStyle = '#ff3366';
    } else if (phase === 'warning') {
      const flashRate = 12;
      const flash = Math.sin(Date.now() / (1000 / flashRate) * Math.PI) > 0;
      ctx.shadowBlur = flash ? 15 : 5;
      ctx.shadowColor = '#ff3366';
      ctx.fillStyle = flash ? '#ff3366' : '#882233';
    } else {
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#4a1a2a';
    }

    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();

    if (phase === 'active') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (phase === 'warning') {
      const flashRate = 12;
      const flash = Math.sin(Date.now() / (1000 / flashRate) * Math.PI) > 0;
      if (flash) {
        ctx.fillStyle = '#ffaaaa';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  private renderLaserBeam(ctx: CanvasRenderingContext2D, laser: Laser): void {
    const { data, endPoint, phase } = laser;
    const now = Date.now();

    ctx.save();

    if (phase === 'active') {
      ctx.shadowBlur = 35;
      ctx.shadowColor = '#ff3366';

      ctx.strokeStyle = '#ff3366';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(data.x, data.y);
      ctx.lineTo(endPoint.x, endPoint.y);
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 150, 180, 0.6)';
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.moveTo(data.x, data.y);
      ctx.lineTo(endPoint.x, endPoint.y);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(data.x, data.y);
      ctx.lineTo(endPoint.x, endPoint.y);
      ctx.stroke();

    } else if (phase === 'warning') {
      const flashRate = 12;
      const intensity = (Math.sin(now / (1000 / flashRate) * Math.PI) + 1) / 2;
      const progress = laser.phaseElapsed / laser.data.warningTime;

      ctx.globalAlpha = 0.15 + intensity * 0.35 * progress;

      ctx.strokeStyle = '#ff3366';
      ctx.lineWidth = 4 + intensity * 4;
      ctx.setLineDash([8 + intensity * 12, 6]);
      ctx.lineDashOffset = -now / 30;
      ctx.shadowBlur = 10 + intensity * 10;
      ctx.shadowColor = '#ff3366';
      ctx.beginPath();
      ctx.moveTo(data.x, data.y);
      ctx.lineTo(endPoint.x, endPoint.y);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;

      const remainingMs = laser.data.warningTime - laser.phaseElapsed;
      if (remainingMs < 500) {
        const urgency = 1 - remainingMs / 500;
        ctx.globalAlpha = urgency * 0.6;
        ctx.strokeStyle = '#ff3366';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(data.x, data.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;

    } else {
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = '#ff3366';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.moveTo(data.x, data.y);
      ctx.lineTo(endPoint.x, endPoint.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }
}
