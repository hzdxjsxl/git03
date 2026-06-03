export interface PlatformData {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'static' | 'moving';
  moveRange?: { startX: number; endX: number; speed: number };
  hasGrapplePoint?: boolean;
}

export interface LaserData {
  x: number;
  y: number;
  angle: number;
  length: number;
  cycleTime: number;
  offsetTime: number;
}

export interface LevelData {
  name: string;
  playerStart: { x: number; y: number };
  goalX: number;
  goalY: number;
  platforms: PlatformData[];
  lasers: LaserData[];
}

export const Level1: LevelData = {
  name: '第一关 - 初识钩爪',
  playerStart: { x: 100, y: 500 },
  goalX: 2800,
  goalY: 360,
  platforms: [
    { x: 100, y: 600, width: 200, height: 30, type: 'static' },
    { x: 450, y: 500, width: 150, height: 25, type: 'static', hasGrapplePoint: true },
    { x: 750, y: 400, width: 120, height: 25, type: 'static', hasGrapplePoint: true },
    { x: 1000, y: 500, width: 100, height: 25, type: 'moving', moveRange: { startX: 1000, endX: 1200, speed: 2 }, hasGrapplePoint: true },
    { x: 1400, y: 350, width: 150, height: 25, type: 'static', hasGrapplePoint: true },
    { x: 1700, y: 450, width: 120, height: 25, type: 'static', hasGrapplePoint: true },
    { x: 1950, y: 350, width: 100, height: 25, type: 'moving', moveRange: { startX: 1950, endX: 2150, speed: 2.5 }, hasGrapplePoint: true },
    { x: 2350, y: 400, width: 150, height: 25, type: 'static', hasGrapplePoint: true },
    { x: 2650, y: 450, width: 200, height: 30, type: 'static' },
  ],
  lasers: [
    { x: 600, y: 650, angle: -90, length: 300, cycleTime: 3000, offsetTime: 0 },
    { x: 900, y: 200, angle: 90, length: 250, cycleTime: 2500, offsetTime: 500 },
    { x: 1300, y: 600, angle: -90, length: 350, cycleTime: 3500, offsetTime: 1000 },
    { x: 1600, y: 200, angle: 90, length: 300, cycleTime: 2800, offsetTime: 1500 },
    { x: 2100, y: 550, angle: -90, length: 280, cycleTime: 3200, offsetTime: 800 },
    { x: 2500, y: 200, angle: 90, length: 300, cycleTime: 2600, offsetTime: 1200 },
  ]
};

export const Level2: LevelData = {
  name: '第二关 - 激光迷宫',
  playerStart: { x: 100, y: 500 },
  goalX: 3500,
  goalY: 360,
  platforms: [
    { x: 100, y: 600, width: 180, height: 30, type: 'static' },
    { x: 400, y: 480, width: 100, height: 25, type: 'static', hasGrapplePoint: true },
    { x: 650, y: 380, width: 100, height: 25, type: 'moving', moveRange: { startX: 650, endX: 850, speed: 3 }, hasGrapplePoint: true },
    { x: 1000, y: 300, width: 100, height: 25, type: 'static', hasGrapplePoint: true },
    { x: 1250, y: 420, width: 80, height: 25, type: 'static', hasGrapplePoint: true },
    { x: 1450, y: 320, width: 100, height: 25, type: 'moving', moveRange: { startX: 1450, endX: 1650, speed: 2.5 }, hasGrapplePoint: true },
    { x: 1850, y: 400, width: 100, height: 25, type: 'static', hasGrapplePoint: true },
    { x: 2100, y: 280, width: 80, height: 25, type: 'static', hasGrapplePoint: true },
    { x: 2350, y: 380, width: 100, height: 25, type: 'moving', moveRange: { startX: 2350, endX: 2550, speed: 3.5 }, hasGrapplePoint: true },
    { x: 2750, y: 300, width: 100, height: 25, type: 'static', hasGrapplePoint: true },
    { x: 3000, y: 420, width: 120, height: 25, type: 'static', hasGrapplePoint: true },
    { x: 3350, y: 450, width: 200, height: 30, type: 'static' },
  ],
  lasers: [
    { x: 300, y: 650, angle: -90, length: 280, cycleTime: 2000, offsetTime: 0 },
    { x: 550, y: 150, angle: 90, length: 250, cycleTime: 2200, offsetTime: 300 },
    { x: 800, y: 600, angle: -90, length: 350, cycleTime: 1800, offsetTime: 600 },
    { x: 1100, y: 150, angle: 90, length: 300, cycleTime: 2400, offsetTime: 900 },
    { x: 1350, y: 550, angle: -90, length: 280, cycleTime: 2000, offsetTime: 1200 },
    { x: 1600, y: 150, angle: 90, length: 320, cycleTime: 2600, offsetTime: 1500 },
    { x: 1950, y: 600, angle: -90, length: 300, cycleTime: 2200, offsetTime: 1800 },
    { x: 2250, y: 150, angle: 90, length: 280, cycleTime: 2000, offsetTime: 2100 },
    { x: 2600, y: 550, angle: -90, length: 320, cycleTime: 2400, offsetTime: 2400 },
    { x: 2900, y: 150, angle: 90, length: 300, cycleTime: 2200, offsetTime: 2700 },
    { x: 3200, y: 600, angle: -90, length: 280, cycleTime: 2000, offsetTime: 3000 },
  ]
};

export const allLevels: LevelData[] = [Level1, Level2];
