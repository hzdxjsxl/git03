import { useRef, useEffect } from 'react';
import Matter from 'matter-js';
import { useSimStore } from '../store/simStore';
import type { SimulationConfig } from '../physics';
import { Simulation } from '../physics';
import { calculateFitness } from '../genetics';

const SIM_CONFIG: SimulationConfig = {
  worldWidth: 8000,
  simDuration: 15000,
  wheelMotorSpeed: 0.6,
};

export default function SimCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<Simulation | null>(null);
  const cameraRef = useRef({ x: 200, y: 300, zoom: 1.0 });
  const animIdRef = useRef(0);
  const phaseRef = useRef<string>('idle');
  const genomesRef = useRef<any[]>([]);
  const terrainSeedRef = useRef(0);

  const store = useSimStore;

  useEffect(() => {
    const unsub = store.subscribe((state, prev) => {
      if (state.genomes !== prev.genomes) {
        genomesRef.current = state.genomes;
      }
      if (state.terrainSeed !== prev.terrainSeed) {
        terrainSeedRef.current = state.terrainSeed;
      }
      if (state.phase !== prev.phase) {
        phaseRef.current = state.phase;
        onPhaseChange(state.phase);
      }
    });
    return unsub;
  }, []);

  function onPhaseChange(phase: string) {
    const sim = simRef.current;
    if (!sim) return;

    if (phase === 'running') {
      if (!sim.getIsRunning() && genomesRef.current.length > 0) {
        if (sim.getCarStates().size === 0) {
          sim.cleanup();
          const newSim = new Simulation({ ...SIM_CONFIG, terrainSeed: terrainSeedRef.current });
          simRef.current = newSim;
          newSim.init(genomesRef.current);
          newSim.run(
            (elapsed) => {
              store.getState().setElapsed(elapsed);
              store.getState().setCarStates(newSim.getCarStates());
            },
            (inputs) => {
              const results = inputs.map((input) => calculateFitness(input));
              store.getState().setFitnessResults(results);
              store.getState().setPhase('evaluating');
            }
          );
        } else {
          sim.resume();
        }
      }
      startRenderLoop();
    } else if (phase === 'paused') {
      sim.pause();
    } else if (phase === 'evaluating') {
      setTimeout(() => {
        store.getState().runEvolution();
        store.getState().setPhase('idle');
        setTimeout(() => {
          store.getState().setPhase('running');
        }, 100);
      }, 500);
      startRenderLoop();
    } else if (phase === 'idle') {
      if (genomesRef.current.length > 0 && (sim.getCarStates().size === 0 || !sim.getIsRunning())) {
        sim.cleanup();
        const newSim = new Simulation({ ...SIM_CONFIG, terrainSeed: terrainSeedRef.current });
        simRef.current = newSim;
        newSim.init(genomesRef.current);
      }
      startRenderLoop();
    }
  }

  function startRenderLoop() {
    if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    function loop() {
      renderFrame();
      animIdRef.current = requestAnimationFrame(loop);
    }
    animIdRef.current = requestAnimationFrame(loop);
  }

  function renderFrame() {
    const canvas = canvasRef.current;
    const sim = simRef.current;
    if (!canvas || !sim) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const cam = cameraRef.current;

    const states = sim.getCarStates();
    let leadingX = 0;
    let leadingY = 350;
    for (const [, state] of states) {
      if (state.x > leadingX) {
        leadingX = state.x;
        leadingY = state.y;
      }
    }

    if (sim.getIsRunning()) {
      cam.x += (leadingX - cam.x) * 0.05;
      cam.y += (leadingY - cam.y) * 0.03;
    }

    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x, -cam.y);

    drawGrid(ctx, cam, w, h);

    const terrainPoints = sim.getTerrainPoints();
    drawTerrain(ctx, terrainPoints);

    const engine = sim.getEngine();
    drawBodies(ctx, engine);

    drawDistanceMarkers(ctx, states);

    ctx.restore();

    drawHUD(ctx, w, h, states);
  }

  function drawGrid(ctx: CanvasRenderingContext2D, cam: { x: number; y: number; zoom: number }, w: number, h: number) {
    const gridSize = 100;
    const startX = Math.floor((cam.x - w / 2 / cam.zoom) / gridSize) * gridSize;
    const endX = Math.ceil((cam.x + w / 2 / cam.zoom) / gridSize) * gridSize;
    const startY = Math.floor((cam.y - h / 2 / cam.zoom) / gridSize) * gridSize;
    const endY = Math.ceil((cam.y + h / 2 / cam.zoom) / gridSize) * gridSize;

    ctx.strokeStyle = '#1a223544';
    ctx.lineWidth = 0.5;
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
  }

  function drawTerrain(ctx: CanvasRenderingContext2D, points: { x: number; y: number }[]) {
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = '#00e5a0';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.lineTo(points[points.length - 1].x, 2000);
    ctx.lineTo(points[0].x, 2000);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 300, 0, 800);
    gradient.addColorStop(0, 'rgba(0, 229, 160, 0.12)');
    gradient.addColorStop(1, 'rgba(0, 229, 160, 0.01)');
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  function drawBodies(ctx: CanvasRenderingContext2D, engine: Matter.Engine) {
    const bodies = Matter.Composite.allBodies(engine.world);
    for (const body of bodies) {
      if (body.label === 'terrain') continue;

      const verts = body.vertices;
      if (verts.length < 3) continue;

      ctx.beginPath();
      ctx.moveTo(verts[0].x, verts[0].y);
      for (let i = 1; i < verts.length; i++) {
        ctx.lineTo(verts[i].x, verts[i].y);
      }
      ctx.closePath();

      if (body.label?.startsWith('wheel_')) {
        ctx.fillStyle = '#1a1a2e';
        ctx.fill();
        ctx.strokeStyle = (body.render.strokeStyle as string) || '#00e5a0';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(body.position.x, body.position.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        const angle = body.angle;
        ctx.beginPath();
        ctx.moveTo(body.position.x, body.position.y);
        ctx.lineTo(
          body.position.x + Math.cos(angle) * 5,
          body.position.y + Math.sin(angle) * 5
        );
        ctx.strokeStyle = '#ffffff55';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (body.label?.startsWith('car_')) {
        const fillStyle = (body.render.fillStyle as string) || '#ff6b35';
        ctx.fillStyle = fillStyle + 'aa';
        ctx.fill();
        ctx.strokeStyle = '#ffffff44';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    const constraints = Matter.Composite.allConstraints(engine.world);
    for (const constraint of constraints) {
      if (!constraint.bodyA || !constraint.bodyB) continue;
      const pointA = constraint.pointA;
      const pointB = constraint.pointB;
      const bodyA = constraint.bodyA;
      const bodyB = constraint.bodyB;

      const x1 = bodyA.position.x + pointA.x;
      const y1 = bodyA.position.y + pointA.y;
      const x2 = bodyB.position.x + pointB.x;
      const y2 = bodyB.position.y + pointB.y;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = '#ffffff22';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function drawDistanceMarkers(ctx: CanvasRenderingContext2D, states: Map<string, { startX: number; x: number }>) {
    let minX = Infinity;
    let maxX = -Infinity;
    for (const [, s] of states) {
      if (s.startX < minX) minX = s.startX;
      if (s.x > maxX) maxX = s.x;
    }
    if (minX === Infinity) return;

    for (let d = 100; d <= 3000; d += 100) {
      const x = minX + d;
      if (x > maxX + 200) break;

      ctx.beginPath();
      ctx.moveTo(x, 200);
      ctx.lineTo(x, 600);
      ctx.strokeStyle = d % 500 === 0 ? '#ff6b3544' : '#ff6b3518';
      ctx.lineWidth = d % 500 === 0 ? 1.5 : 0.5;
      ctx.stroke();

      if (d % 500 === 0) {
        ctx.font = '10px "JetBrains Mono"';
        ctx.fillStyle = '#ff6b3588';
        ctx.fillText(`${d}px`, x + 3, 210);
      }
    }
  }

  function drawHUD(ctx: CanvasRenderingContext2D, w: number, h: number, states: Map<string, { x: number; isStuck: boolean }>) {
    let maxDist = 0;
    let aliveCount = 0;
    for (const [, s] of states) {
      if (!s.isStuck) aliveCount++;
      if (s.x > maxDist) maxDist = s.x;
    }

    ctx.font = '11px "JetBrains Mono"';
    ctx.fillStyle = '#00e5a088';
    ctx.fillText(`LEAD: ${maxDist.toFixed(0)}px`, 12, 20);
    ctx.fillStyle = '#38bdf888';
    ctx.fillText(`ALIVE: ${aliveCount}/${states.size}`, 12, 36);
  }

  useEffect(() => {
    simRef.current = new Simulation({ ...SIM_CONFIG, terrainSeed: 0 });

    startRenderLoop();

    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
      simRef.current?.cleanup();
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="block w-full h-full"
      style={{ background: '#0a0e17' }}
    />
  );
}
