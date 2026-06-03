export type LaserPhase = 'active' | 'inactive' | 'warning';

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
  activeTime: number;
  inactiveTime: number;
  warningTime: number;
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
    { x: 1050, y: 500, width: 100, height: 25, type: 'moving', moveRange: { startX: 1000, endX: 1200, speed: 1.5 }, hasGrapplePoint: true },
    { x: 1400, y: 350, width: 150, height: 25, type: 'static', hasGrapplePoint: true },
    { x: 1700, y: 450, width: 120, height: 25, type: 'static', hasGrapplePoint: true },
    { x: 1950, y: 350, width: 100, height: 25, type: 'moving', moveRange: { startX: 1950, endX: 2150, speed: 1.5 }, hasGrapplePoint: true },
    { x: 2350, y: 400, width: 150, height: 25, type: 'static', hasGrapplePoint: true },
    { x: 2650, y: 450, width: 200, height: 30, type: 'static' },
  ],
  lasers: [
    { x: 580, y: 680, angle: -90, length: 250, activeTime: 2000, inactiveTime: 3000, warningTime: 1000, offsetTime: 3000 },
    { x: 900, y: 150, angle: 90, length: 200, activeTime: 2000, inactiveTime: 3000, warningTime: 1000, offsetTime: 0 },
    { x: 1280, y: 680, angle: -90, length: 280, activeTime: 2500, inactiveTime: 3000, warningTime: 1000, offsetTime: 2000 },
    { x: 1580, y: 150, angle: 90, length: 220, activeTime: 2000, inactiveTime: 3500, warningTime: 1000, offsetTime: 1000 },
    { x: 2080, y: 680, angle: -90, length: 250, activeTime: 2000, inactiveTime: 3000, warningTime: 1000, offsetTime: 2500 },
    { x: 2480, y: 150, angle: 90, length: 200, activeTime: 2500, inactiveTime: 3000, warningTime: 1000, offsetTime: 1500 },
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
    { x: 650, y: 380, width: 100, height: 25, type: 'moving', moveRange: { startX: 650, endX: 850, speed: 2 }, hasGrapplePoint: true },
    { x: 1000, y: 300, width: 100, height: 25, type: 'static', hasGrapplePoint: true },
    { x: 1250, y: 420, width: 80, height: 25, type: 'static', hasGrapplePoint: true },
    { x: 1450, y: 320, width: 100, height: 25, type: 'moving', moveRange: { startX: 1450, endX: 1650, speed: 1.5 }, hasGrapplePoint: true },
    { x: 1850, y: 400, width: 100, height: 25, type: 'static', hasGrapplePoint: true },
    { x: 2100, y: 280, width: 80, height: 25, type: 'static', hasGrapplePoint: true },
    { x: 2350, y: 380, width: 100, height: 25, type: 'moving', moveRange: { startX: 2350, endX: 2550, speed: 2 }, hasGrapplePoint: true },
    { x: 2750, y: 300, width: 100, height: 25, type: 'static', hasGrapplePoint: true },
    { x: 3000, y: 420, width: 120, height: 25, type: 'static', hasGrapplePoint: true },
    { x: 3350, y: 450, width: 200, height: 30, type: 'static' },
  ],
  lasers: [
    { x: 280, y: 680, angle: -90, length: 230, activeTime: 2000, inactiveTime: 3000, warningTime: 1000, offsetTime: 3000 },
    { x: 530, y: 120, angle: 90, length: 200, activeTime: 2000, inactiveTime: 3500, warningTime: 1000, offsetTime: 0 },
    { x: 780, y: 680, angle: -90, length: 260, activeTime: 2500, inactiveTime: 2500, warningTime: 1000, offsetTime: 2000 },
    { x: 1080, y: 120, angle: 90, length: 220, activeTime: 2000, inactiveTime: 3000, warningTime: 1000, offsetTime: 1000 },
    { x: 1330, y: 680, angle: -90, length: 230, activeTime: 2000, inactiveTime: 3500, warningTime: 1000, offsetTime: 2500 },
    { x: 1580, y: 120, angle: 90, length: 250, activeTime: 2500, inactiveTime: 3000, warningTime: 1000, offsetTime: 1500 },
    { x: 1930, y: 680, angle: -90, length: 230, activeTime: 2000, inactiveTime: 3000, warningTime: 1000, offsetTime: 3500 },
    { x: 2230, y: 120, angle: 90, length: 220, activeTime: 2000, inactiveTime: 3500, warningTime: 1000, offsetTime: 500 },
    { x: 2580, y: 680, angle: -90, length: 260, activeTime: 2500, inactiveTime: 2500, warningTime: 1000, offsetTime: 3000 },
    { x: 2880, y: 120, angle: 90, length: 230, activeTime: 2000, inactiveTime: 3000, warningTime: 1000, offsetTime: 2000 },
    { x: 3180, y: 680, angle: -90, length: 230, activeTime: 2000, inactiveTime: 3500, warningTime: 1000, offsetTime: 1000 },
  ]
};

export const allLevels: LevelData[] = [Level1, Level2];
