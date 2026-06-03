import Matter from 'matter-js';
import { GameEntity } from './GameEntity';
import { GameEngine } from '../engine/GameEngine';
import { getPhysicsMaterial } from '../physics/PhysicsMaterials';

export interface PlayerConfig {
  x: number;
  y: number;
}

export class Player extends GameEntity {
  private gameEngine: GameEngine;
  private keys: Set<string> = new Set();
  private moveForce = 0.008;
  private jumpForce = 0.015;
  private maxSpeed = 8;
  private isGrounded = false;
  private groundCheckTimer = 0;

  constructor(config: PlayerConfig, gameEngine: GameEngine) {
    const material = getPhysicsMaterial('player');
    
    const body = Matter.Bodies.rectangle(
      config.x,
      config.y,
      30,
      45,
      {
        label: 'player',
        friction: material.friction,
        frictionAir: material.frictionAir,
        restitution: material.restitution,
        density: material.density,
        chamfer: { radius: 5 },
        render: {
          fillStyle: '#00f5ff'
        }
      }
    );

    super('player', body);
    this.gameEngine = gameEngine;
    this.setupGroundCheck();
  }

  private setupGroundCheck(): void {
    Matter.Events.on(this.gameEngine.getEngine(), 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        if (pair.bodyA === this.body || pair.bodyB === this.body) {
          const otherBody = pair.bodyA === this.body ? pair.bodyB : pair.bodyA;
          if (otherBody.label === 'platform' || otherBody.label === 'movingPlatform') {
            this.isGrounded = true;
            this.groundCheckTimer = 10;
          }
        }
      });
    });
  }

  handleKeyDown(key: string): void {
    this.keys.add(key.toLowerCase());
    
    if (key.toLowerCase() === 'w' || key === ' ' || key === 'ArrowUp') {
      this.jump();
    }
  }

  handleKeyUp(key: string): void {
    this.keys.delete(key.toLowerCase());
  }

  private jump(): void {
    if (this.isGrounded) {
      Matter.Body.applyForce(
        this.body,
        this.body.position,
        { x: 0, y: -this.jumpForce * this.body.mass }
      );
      this.isGrounded = false;
    }
  }

  update(): void {
    if (this.groundCheckTimer > 0) {
      this.groundCheckTimer--;
      if (this.groundCheckTimer === 0) {
        this.isGrounded = false;
      }
    }

    const velocity = this.body.velocity;
    
    if (this.keys.has('a') || this.keys.has('arrowleft')) {
      if (velocity.x > -this.maxSpeed) {
        Matter.Body.applyForce(
          this.body,
          this.body.position,
          { x: -this.moveForce * this.body.mass, y: 0 }
        );
      }
    }
    
    if (this.keys.has('d') || this.keys.has('arrowright')) {
      if (velocity.x < this.maxSpeed) {
        Matter.Body.applyForce(
          this.body,
          this.body.position,
          { x: this.moveForce * this.body.mass, y: 0 }
        );
      }
    }

    if (this.body.position.y > 1000) {
      this.gameEngine.handleGameOver();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const pos = this.body.position;
    const angle = this.body.angle;

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(angle);

    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00f5ff';

    ctx.fillStyle = '#00f5ff';
    ctx.beginPath();
    ctx.roundRect(-15, -22.5, 30, 45, 5);
    ctx.fill();

    ctx.fillStyle = '#0a1628';
    ctx.beginPath();
    ctx.arc(-5, -5, 4, 0, Math.PI * 2);
    ctx.arc(5, -5, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-4, -6, 1.5, 0, Math.PI * 2);
    ctx.arc(6, -6, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();

    const grappleSystem = this.gameEngine.getGrappleSystem();
    if (!grappleSystem.isAttached()) {
      this.renderAimLine(ctx);
    }
  }

  private renderAimLine(ctx: CanvasRenderingContext2D): void {
    const grappleSystem = this.gameEngine.getGrappleSystem();
    const aimPos = grappleSystem.getAimPosition();
    
    if (!aimPos) return;

    const startPos = this.body.position;
    const angle = Math.atan2(aimPos.y - startPos.y, aimPos.x - startPos.x);
    const length = Math.min(300, Math.hypot(aimPos.x - startPos.x, aimPos.y - startPos.y));
    
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(startPos.x, startPos.y);
    ctx.lineTo(
      startPos.x + Math.cos(angle) * length,
      startPos.y + Math.sin(angle) * length
    );
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
