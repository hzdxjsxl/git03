import Matter from 'matter-js';

export abstract class GameEntity {
  protected id: string;
  protected body: Matter.Body;

  constructor(id: string, body: Matter.Body) {
    this.id = id;
    this.body = body;
  }

  getId(): string {
    return this.id;
  }

  getBody(): Matter.Body {
    return this.body;
  }

  abstract update(): void;
  abstract render(ctx: CanvasRenderingContext2D): void;
}
