import Matter from 'matter-js';
import { GameEngine } from '../engine/GameEngine';

export class GrappleSystem {
  private gameEngine: GameEngine;
  private attached: boolean = false;
  private attachPoint: { x: number; y: number } | null = null;
  private aimPosition: { x: number; y: number } | null = null;
  private ropeLength: number = 0;
  private maxRopeLength: number = 400;
  private constraint: Matter.Constraint | null = null;

  constructor(gameEngine: GameEngine) {
    this.gameEngine = gameEngine;
  }

  isAttached(): boolean {
    return this.attached;
  }

  getAttachPoint(): { x: number; y: number } | null {
    return this.attachPoint;
  }

  setAimPosition(x: number, y: number): void {
    this.aimPosition = { x, y };
  }

  getAimPosition(): { x: number; y: number } | null {
    return this.aimPosition;
  }

  getMaxRopeLength(): number {
    return this.maxRopeLength;
  }

  fire(targetX: number, targetY: number): void {
    if (this.attached) return;

    const player = this.gameEngine.getPlayer();
    if (!player) return;

    const playerBody = player.getBody();
    const playerPos = playerBody.position;

    const dx = targetX - playerPos.x;
    const dy = targetY - playerPos.y;
    const distance = Math.hypot(dx, dy);

    if (distance > this.maxRopeLength) return;

    const rayResult = this.raycast(playerPos.x, playerPos.y, targetX, targetY);
    
    if (rayResult) {
      this.attachPoint = { x: rayResult.point.x, y: rayResult.point.y };
      this.ropeLength = Math.hypot(
        rayResult.point.x - playerPos.x,
        rayResult.point.y - playerPos.y
      );
      this.attached = true;
      this.createConstraint();
    }
  }

  private raycast(startX: number, startY: number, endX: number, endY: number): { point: Matter.Vector; body: Matter.Body } | null {
    const world = this.gameEngine.getEngine().world;
    const bodies = Matter.Composite.allBodies(world).filter(body => 
      body.label === 'grapplePoint' || body.label === 'platform' || body.label === 'movingPlatform'
    );

    let closestHit: { point: Matter.Vector; body: Matter.Body; distance: number } | null = null;
    const rayDirection = { x: endX - startX, y: endY - startY };
    const rayLength = Math.hypot(rayDirection.x, rayDirection.y);
    const rayNormalized = { x: rayDirection.x / rayLength, y: rayDirection.y / rayLength };

    for (const body of bodies) {
      const vertices = body.vertices;
      
      for (let i = 0; i < vertices.length; i++) {
        const v1 = vertices[i];
        const v2 = vertices[(i + 1) % vertices.length];
        
        const edge = { x: v2.x - v1.x, y: v2.y - v1.y };
        const toV1 = { x: v1.x - startX, y: v1.y - startY };
        
        const cross = rayNormalized.x * edge.y - rayNormalized.y * edge.x;
        
        if (Math.abs(cross) < 0.0001) continue;
        
        const t = (toV1.x * edge.y - toV1.y * edge.x) / cross;
        const u = (toV1.x * rayNormalized.y - toV1.y * rayNormalized.x) / cross;
        
        if (t >= 0 && t <= rayLength && u >= 0 && u <= 1) {
          const hitPoint = {
            x: startX + rayNormalized.x * t,
            y: startY + rayNormalized.y * t
          };
          
          if (!closestHit || t < closestHit.distance) {
            closestHit = {
              point: hitPoint,
              body: body,
              distance: t
            };
          }
        }
      }
    }

    return closestHit ? { point: closestHit.point, body: closestHit.body } : null;
  }

  private createConstraint(): void {
    const player = this.gameEngine.getPlayer();
    if (!player || !this.attachPoint) return;

    this.constraint = Matter.Constraint.create({
      pointA: this.attachPoint,
      bodyB: player.getBody(),
      length: this.ropeLength,
      stiffness: 0.9,
      damping: 0.1,
      render: {
        visible: false
      }
    });

    Matter.Composite.add(this.gameEngine.getEngine().world, this.constraint);
  }

  release(): void {
    if (this.constraint) {
      Matter.Composite.remove(this.gameEngine.getEngine().world, this.constraint);
      this.constraint = null;
    }
    
    this.attached = false;
    this.attachPoint = null;
    this.ropeLength = 0;
  }

  handleGrapplePointCollision(body: Matter.Body): void {
    // Can be used for auto-attach functionality
  }

  update(): void {
    if (!this.attached) return;

    const player = this.gameEngine.getPlayer();
    if (!player) return;

    const playerBody = player.getBody();
    
    if (this.constraint && this.attachPoint) {
      const dx = playerBody.position.x - this.attachPoint.x;
      const dy = playerBody.position.y - this.attachPoint.y;
      const currentLength = Math.hypot(dx, dy);

      if (currentLength > this.ropeLength * 1.1) {
        this.constraint.length = this.ropeLength;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const player = this.gameEngine.getPlayer();
    if (!player) return;

    const playerPos = player.getBody().position;

    if (this.attached && this.attachPoint) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ffaa00';
      
      ctx.strokeStyle = '#ffaa00';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(playerPos.x, playerPos.y);
      ctx.lineTo(this.attachPoint.x, this.attachPoint.y);
      ctx.stroke();

      ctx.fillStyle = '#ffdd00';
      ctx.beginPath();
      ctx.arc(this.attachPoint.x, this.attachPoint.y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
    }
  }
}
