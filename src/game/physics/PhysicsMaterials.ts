export const PhysicsMaterials = {
  player: {
    friction: 0.1,
    frictionAir: 0.02,
    restitution: 0.2,
    density: 0.001
  },
  
  platform: {
    friction: 0.8,
    frictionAir: 0,
    restitution: 0,
    density: 1
  },
  
  grapplePoint: {
    friction: 1.0,
    frictionAir: 0,
    restitution: 0,
    density: 1
  },
  
  movingPlatform: {
    friction: 0.6,
    frictionAir: 0,
    restitution: 0.1,
    density: 0.5
  }
};

export type PhysicsMaterialType = keyof typeof PhysicsMaterials;

export function getPhysicsMaterial(type: PhysicsMaterialType) {
  return PhysicsMaterials[type];
}
