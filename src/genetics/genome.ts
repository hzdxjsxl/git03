export interface WheelGene {
  radius: number;
  position: number;
  motorSpeed: number;
}

export interface Genome {
  id: string;
  bodyVertices: { x: number; y: number }[];
  wheels: WheelGene[];
  density: number;
  friction: number;
  color: string;
}

let genomeCounter = 0;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomColor(): string {
  const hue = Math.floor(Math.random() * 360);
  const sat = Math.floor(randomBetween(60, 100));
  const light = Math.floor(randomBetween(50, 70));
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

function generateConvexBody(vertexCount: number): { x: number; y: number }[] {
  const vertices: { angle: number; radius: number }[] = [];
  for (let i = 0; i < vertexCount; i++) {
    const angle = (2 * Math.PI * i) / vertexCount + randomBetween(-0.2, 0.2);
    const radius = randomBetween(20, 55);
    vertices.push({ angle, radius });
  }
  vertices.sort((a, b) => a.angle - b.angle);

  return vertices.map((v) => ({
    x: Math.cos(v.angle) * v.radius,
    y: Math.sin(v.angle) * v.radius,
  }));
}

export function createRandomGenome(): Genome {
  const vertexCount = Math.floor(randomBetween(6, 11));
  const wheelCount = Math.floor(randomBetween(2, 4));
  const bodyVertices = generateConvexBody(vertexCount);

  const wheels: WheelGene[] = [];
  for (let i = 0; i < wheelCount; i++) {
    wheels.push({
      radius: randomBetween(8, 30),
      position: i / (wheelCount - 1),
      motorSpeed: randomBetween(0.1, 0.8),
    });
  }

  return {
    id: `g_${++genomeCounter}`,
    bodyVertices,
    wheels,
    density: randomBetween(0.001, 0.005),
    friction: randomBetween(0.3, 1.0),
    color: randomColor(),
  };
}

export function cloneGenome(genome: Genome): Genome {
  return {
    id: `g_${++genomeCounter}`,
    bodyVertices: genome.bodyVertices.map((v) => ({ x: v.x, y: v.y })),
    wheels: genome.wheels.map((w) => ({ ...w })),
    density: genome.density,
    friction: genome.friction,
    color: genome.color,
  };
}

export function createInitialPopulation(size: number): Genome[] {
  return Array.from({ length: size }, () => createRandomGenome());
}

export function resetGenomeCounter(): void {
  genomeCounter = 0;
}
