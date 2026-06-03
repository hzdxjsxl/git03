import Matter from 'matter-js';
import { GameEntity } from './GameEntity';
import { PlatformData } from '../levels/LevelData';
import { getPhysicsMaterial } from '../physics/PhysicsMaterials';

export class Platform extends GameEntity {
  private data: PlatformData;
  private grapplePointBody: Matter.Body | null = null;
  private moveDirection = 1;
  private originalX: number;

  constructor(data: PlatformData) {
    const materialType = data.type === 'moving' ? 'movingPlatform' : 'platform';
    const material = getPhysicsMaterial(materialType);

    const body = Matter.Bodies.rectangle(
      data.x,
      data.y,
      data.width,
      data.height,
      {
        label: data.type === 'moving' ? 'movingPlatform' : 'platform',
        isStatic: data.type === 'static',
        friction: material.friction,
        restitution: material.restitution,
        density: material.density,
        chamfer: { radius: 3 }
      }
    );

    super(`platform_${Date.now()}_${Math.random()}`, body);
    this.data = data;
    this.originalX = data.x;

    if (data.hasGrapplePoint) {
      this.createGrapplePoint();
    }
  }

  private createGrapplePoint(): void {
    this.grapplePointBody = Matter.Bodies.circle(
      this.data.x,
      this.data.y - this.data.height / 2 - 20,
      15,
      {
        label: 'grapplePoint',
        isStatic: true,
        isSensor: true,
        render: {
          fillStyle: '#ffaa00'
        }
      }
    );
  }

  getGrapplePointBody(): Matter.Body | null {
    return this.grapplePointBody;
  }

  update(): void {
    if (this.data.type === 'moving' && this.data.moveRange) {
      const { startX, endX, speed } = this.data.moveRange;
      
      const currentX = this.body.position.x;
      const newX = currentX + speed * this.moveDirection;

      if (newX >= endX) {
        this.moveDirection = -1;
      } else if (newX <= startX) {
        this.moveDirection = 1;
      }

      Matter.Body.setPosition(this.body, {
        x: newX,
        y: this.data.y
      });

      if (this.grapplePointBody) {
        Matter.Body.setPosition(this.grapplePointBody, {
          x: newX,
          y: this.data.y - this.data.height / 2 - 20
        });
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const pos = this.body.position;

    ctx.save();
    ctx.translate(pos.x, pos.y);

    const gradient = ctx.createLinearGradient(
      -this.data.width / 2, 0,
      this.data.width / 2, 0
    );
    gradient.addColorStop(0, '#1a2a4a');
    gradient.addColorStop(0.5, '#2a3a5a');
    gradient.addColorStop(1, '#1a2a4a');

    ctx.shadowBlur = 10;
    ctx.shadowColor = this.data.type === 'moving' ? '#ff3366' : '#00f5ff';

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(
      -this.data.width / 2,
      -this.data.height / 2,
      this.data.width,
      this.data.height,
      3
    );
    ctx.fill();

    ctx.strokeStyle = this.data.type === 'moving' ? '#ff3366' : '#00f5ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (this.data.hasGrapplePoint && this.grapplePointBody) {
      const gpPos = this.grapplePointBody.position;
      const relX = gpPos.x - pos.x;
      const relY = gpPos.y - pos.y;

      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ffaa00';
      
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.arc(relX, relY, 15, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffdd00';
      ctx.beginPath();
      ctx.arc(relX, relY, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(relX, relY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}
