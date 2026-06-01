import Matter from 'matter-js';

export interface TerrainResult {
  bodies: Matter.Body[];
  points: { x: number; y: number }[];
}

function terrainHeight(x: number, seed: number): number {
  let y = 400;
  y += Math.sin(x * 0.005 + seed) * 60;
  y += Math.sin(x * 0.012 + seed * 2.3) * 35;
  y += Math.sin(x * 0.025 + seed * 4.7) * 20;
  y += Math.sin(x * 0.05 + seed * 7.1) * 10;

  if (x < 200) {
    const t = x / 200;
    y = 400 * (1 - t) + y * t;
  }

  return y;
}

export function generateTerrain(
  worldWidth: number,
  segmentWidth: number = 40,
  seed?: number
): TerrainResult {
  const actualSeed = seed ?? Math.random() * 1000;
  const points: { x: number; y: number }[] = [];

  for (let x = -100; x <= worldWidth + segmentWidth; x += segmentWidth) {
    points.push({
      x,
      y: terrainHeight(x, actualSeed),
    });
  }

  const bodies: Matter.Body[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);
    const length = Math.sqrt(dx * dx + dy * dy);

    const body = Matter.Bodies.rectangle(midX, midY + 200, length + 2, 400, {
      isStatic: true,
      angle,
      friction: 1.0,
      restitution: 0.0,
      label: 'terrain',
      render: { visible: false },
    });

    bodies.push(body);
  }

  return { bodies, points };
}

export function getStartY(points: { x: number; y: number }[]): number {
  if (points.length === 0) return 400;
  const start = points.find((p) => p.x >= 0) ?? points[0];
  return start.y;
}
