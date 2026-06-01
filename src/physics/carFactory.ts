import Matter from 'matter-js';
import type { Genome } from '../genetics';

export interface CarBodies {
  chassis: Matter.Body;
  wheels: Matter.Body[];
  constraints: Matter.Constraint[];
  startX: number;
  startY: number;
}

export function createCar(
  genome: Genome,
  startX: number,
  startY: number
): CarBodies {
  const { bodyVertices, wheels: wheelGenes, density, friction } = genome;

  const chassis = Matter.Bodies.fromVertices(
    startX,
    startY - 50,
    [bodyVertices],
    {
      density,
      friction,
      frictionStatic: friction * 1.5,
      restitution: 0.1,
      label: `car_${genome.id}`,
      render: {
        fillStyle: genome.color,
        strokeStyle: '#ffffff',
        lineWidth: 1,
      },
    }
  );

  if (!chassis) {
    return createFallbackCar(genome, startX, startY);
  }

  return attachWheels(chassis, genome, startX);
}

function createFallbackCar(
  genome: Genome,
  startX: number,
  startY: number
): CarBodies {
  const hw = 25 + Math.random() * 15;
  const hh = 10 + Math.random() * 10;
  const chassis = Matter.Bodies.rectangle(startX, startY - 50, hw * 2, hh * 2, {
    density: genome.density,
    friction: genome.friction,
    restitution: 0.1,
    label: `car_${genome.id}`,
    render: { fillStyle: genome.color, strokeStyle: '#fff', lineWidth: 1 },
  });

  return attachWheels(chassis, genome, startX);
}

function attachWheels(
  chassis: Matter.Body,
  genome: Genome,
  _startX: number
): CarBodies {
  const wheels: Matter.Body[] = [];
  const constraints: Matter.Constraint[] = [];
  const wheelGenes = genome.wheels;

  const bounds = chassis.bounds;
  const chassisW = bounds.max.x - bounds.min.x;
  const bottomY = bounds.max.y;
  const centerX = chassis.position.x;

  for (let i = 0; i < wheelGenes.length; i++) {
    const gene = wheelGenes[i];
    const genePos = gene.position;

    const wheelX = centerX - chassisW * 0.4 + genePos * chassisW * 0.8;
    const wheelY = bottomY + gene.radius + 2;

    const wheel = Matter.Bodies.circle(wheelX, wheelY, gene.radius, {
      density: 0.002,
      friction: 1.0,
      frictionStatic: 2.0,
      restitution: 0.0,
      label: `wheel_${genome.id}_${i}`,
      render: {
        fillStyle: '#1a1a2e',
        strokeStyle: genome.color,
        lineWidth: 2,
      },
      plugin: { motorSpeed: gene.motorSpeed },
    });

    const anchorLocalX = wheelX - chassis.position.x;
    const anchorLocalY = bottomY - chassis.position.y;

    const constraint = Matter.Constraint.create({
      bodyA: chassis,
      pointA: { x: anchorLocalX, y: anchorLocalY },
      bodyB: wheel,
      pointB: { x: 0, y: 0 },
      stiffness: 0.6,
      damping: 0.05,
      length: gene.radius + 2,
      render: {
        strokeStyle: '#ffffff33',
        lineWidth: 1,
      },
    });

    wheels.push(wheel);
    constraints.push(constraint);
  }

  return {
    chassis,
    wheels,
    constraints,
    startX: _startX,
    startY: chassis.position.y,
  };
}
