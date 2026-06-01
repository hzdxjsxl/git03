import Matter from 'matter-js';
import decomp from 'poly-decomp';
import type { Genome } from '../genetics';
import type { FitnessInput } from '../genetics';
import { generateTerrain, getStartY } from './terrain';
import { createCar, type CarBodies } from './carFactory';

Matter.Common.setDecomp(decomp);

export interface CarState {
  genomeId: string;
  x: number;
  y: number;
  isStuck: boolean;
  lastMoveTime: number;
  startX: number;
  startY: number;
  lastX: number;
  prevX: number;
}

export interface SimulationConfig {
  worldWidth: number;
  simDuration: number;
  wheelMotorSpeed: number;
  terrainSeed?: number;
}

export const DEFAULT_SIM_CONFIG: SimulationConfig = {
  worldWidth: 8000,
  simDuration: 15000,
  wheelMotorSpeed: 0.6,
};

export class Simulation {
  private engine: Matter.Engine;
  private runner: Matter.Runner | null = null;
  private cars: Map<string, CarBodies> = new Map();
  private carStates: Map<string, CarState> = new Map();
  private terrainPoints: { x: number; y: number }[] = [];
  private config: SimulationConfig;
  private startTime: number = 0;
  private isRunning: boolean = false;
  private onTick: ((elapsed: number) => void) | null = null;
  private onComplete: ((inputs: FitnessInput[]) => void) | null = null;
  private animFrameId: number = 0;
  private lastTickTime: number = 0;
  private tickCounter: number = 0;

  constructor(config: SimulationConfig = DEFAULT_SIM_CONFIG) {
    this.config = config;
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 1.5, scale: 0.001 },
    });
  }

  init(genomes: Genome[]): void {
    this.cleanup();

    const terrainResult = generateTerrain(this.config.worldWidth, 40, this.config.terrainSeed);
    this.terrainPoints = terrainResult.points;
    Matter.Composite.add(this.engine.world, terrainResult.bodies);

    const startY = getStartY(terrainResult.points);
    const spacing = 60;

    for (let i = 0; i < genomes.length; i++) {
      const genome = genomes[i];
      const carX = 100 + i * spacing;
      try {
        const car = createCar(genome, carX, startY);
        Matter.Composite.add(this.engine.world, [
          car.chassis,
          ...car.wheels,
          ...car.constraints,
        ]);
        this.cars.set(genome.id, car);

        this.carStates.set(genome.id, {
          genomeId: genome.id,
          x: car.chassis.position.x,
          y: car.chassis.position.y,
          isStuck: false,
          lastMoveTime: 0,
          startX: car.startX,
          startY: car.chassis.position.y,
          lastX: car.chassis.position.x,
          prevX: car.chassis.position.x,
        });
      } catch {
        this.carStates.set(genome.id, {
          genomeId: genome.id,
          x: 0,
          y: 0,
          isStuck: true,
          lastMoveTime: 0,
          startX: 0,
          startY: 0,
          lastX: 0,
          prevX: 0,
        });
      }
    }
  }

  run(
    onTick: (elapsed: number) => void,
    onComplete: (inputs: FitnessInput[]) => void
  ): void {
    this.onTick = onTick;
    this.onComplete = onComplete;
    this.startTime = performance.now();
    this.isRunning = true;
    this.lastTickTime = this.startTime;
    this.tickCounter = 0;

    for (const [, car] of this.cars) {
      for (const wheel of car.wheels) {
        Matter.Body.setAngularVelocity(wheel, this.config.wheelMotorSpeed * 5);
      }
    }

    this.loop();
  }

  private loop = (): void => {
    if (!this.isRunning) return;

    const now = performance.now();
    const elapsed = now - this.startTime;
    const delta = now - this.lastTickTime;
    this.lastTickTime = now;

    Matter.Engine.update(this.engine, 16.667);

    this.tickCounter++;
    if (this.tickCounter % 3 === 0) {
      this.applyWheelTorque();
    }

    this.updateCarStates(elapsed);

    if (this.onTick) {
      this.onTick(elapsed);
    }

    if (elapsed >= this.config.simDuration) {
      this.isRunning = false;
      this.complete();
      return;
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private applyWheelTorque(): void {
    for (const [, car] of this.cars) {
      const state = this.carStates.get(car.chassis.label?.replace('car_', '') ?? '');
      if (state?.isStuck) continue;

      for (const wheel of car.wheels) {
        const targetSpeed = this.config.wheelMotorSpeed * 5;
        const currentSpeed = wheel.angularVelocity;
        const diff = targetSpeed - currentSpeed;
        if (Math.abs(diff) > 0.01) {
          const force = wheel.mass * diff * 0.1;
          Matter.Body.setAngularVelocity(wheel, currentSpeed + force);
        }
      }

      let avgMotorSpeed = 0;
      for (const w of car.wheels) {
        avgMotorSpeed += (w.plugin as any)?.motorSpeed ?? this.config.wheelMotorSpeed;
      }
      avgMotorSpeed /= car.wheels.length || 1;

      const force = car.chassis.mass * avgMotorSpeed * 0.0003;
      Matter.Body.applyForce(car.chassis, car.chassis.position, { x: force, y: 0 });
    }
  }

  private updateCarStates(elapsed: number): void {
    for (const [id, car] of this.cars) {
      const state = this.carStates.get(id);
      if (!state || state.isStuck) continue;

      const currentX = car.chassis.position.x;
      const currentY = car.chassis.position.y;

      const dx = Math.abs(currentX - state.lastX);
      if (dx < 0.5) {
        if (state.lastMoveTime === 0) {
          state.lastMoveTime = elapsed;
        } else if (elapsed - state.lastMoveTime > 3000) {
          state.isStuck = true;
        }
      } else {
        state.lastMoveTime = 0;
      }

      state.prevX = state.lastX;
      state.lastX = currentX;
      state.x = currentX;
      state.y = currentY;
    }
  }

  private complete(): void {
    if (!this.onComplete) return;

    const inputs: FitnessInput[] = [];
    for (const [id, state] of this.carStates) {
      const car = this.cars.get(id);
      inputs.push({
        genomeId: id,
        startX: state.startX,
        finalX: car?.chassis.position.x ?? state.startX,
        startY: state.startY,
        finalY: car?.chassis.position.y ?? state.startY,
        survivalTime: this.config.simDuration,
        isStuck: state.isStuck,
      });
    }

    this.onComplete(inputs);
  }

  getCarStates(): Map<string, CarState> {
    return new Map(this.carStates);
  }

  getTerrainPoints(): { x: number; y: number }[] {
    return this.terrainPoints;
  }

  getEngine(): Matter.Engine {
    return this.engine;
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  pause(): void {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
  }

  resume(): void {
    if (!this.isRunning && this.onTick && this.onComplete) {
      this.isRunning = true;
      this.lastTickTime = performance.now();
      this.loop();
    }
  }

  cleanup(): void {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.cars.clear();
    this.carStates.clear();
    this.terrainPoints = [];
    Matter.Engine.clear(this.engine);
    Matter.Composite.clear(this.engine.world, false);
  }
}
