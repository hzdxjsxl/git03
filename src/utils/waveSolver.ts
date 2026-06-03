export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface RockLayer {
  id: string;
  name: string;
  depth: [number, number];
  density: number;
  pWaveVelocity: number;
  sWaveVelocity: number;
  color: string;
}

export interface RockModel {
  layers: RockLayer[];
  size: Vector3;
}

export interface WaveField {
  nx: number;
  ny: number;
  nz: number;
  dx: number;
  dy: number;
  dz: number;
  pWave: Float32Array;
  pWavePrev: Float32Array;
  sWaveX: Float32Array;
  sWaveY: Float32Array;
  sWaveZ: Float32Array;
  sWavePrevX: Float32Array;
  sWavePrevY: Float32Array;
  sWavePrevZ: Float32Array;
  lambda: Float32Array;
  mu: Float32Array;
  rho: Float32Array;
  vp: Float32Array;
  vs: Float32Array;
  source: Vector3 | null;
  sourceMagnitude: number;
  sourceTime: number;
  time: number;
}

export interface SimulationParams {
  timeStep: number;
  damping: number;
  boundaryCondition: 'reflective' | 'absorbing';
  sourceFrequency: number;
}

const idx = (i: number, j: number, k: number, nx: number, ny: number): number => {
  return k * nx * ny + j * nx + i;
};

export function createWaveField(
  gridSize: Vector3,
  cellSize: Vector3,
  rockModel: RockModel
): WaveField {
  const nx = Math.floor(gridSize.x);
  const ny = Math.floor(gridSize.y);
  const nz = Math.floor(gridSize.z);
  const size = nx * ny * nz;

  const waveField: WaveField = {
    nx,
    ny,
    nz,
    dx: cellSize.x,
    dy: cellSize.y,
    dz: cellSize.z,
    pWave: new Float32Array(size),
    pWavePrev: new Float32Array(size),
    sWaveX: new Float32Array(size),
    sWaveY: new Float32Array(size),
    sWaveZ: new Float32Array(size),
    sWavePrevX: new Float32Array(size),
    sWavePrevY: new Float32Array(size),
    sWavePrevZ: new Float32Array(size),
    lambda: new Float32Array(size),
    mu: new Float32Array(size),
    rho: new Float32Array(size),
    vp: new Float32Array(size),
    vs: new Float32Array(size),
    source: null,
    sourceMagnitude: 0,
    sourceTime: 0,
    time: 0,
  };

  for (let k = 0; k < nz; k++) {
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const index = idx(i, j, k, nx, ny);
        const depth = (k / nz) * rockModel.size.z;

        let layer = rockModel.layers[0];
        for (const l of rockModel.layers) {
          if (depth >= l.depth[0] && depth < l.depth[1]) {
            layer = l;
            break;
          }
        }

        const rho = layer.density;
        const vp = layer.pWaveVelocity;
        const vs = layer.sWaveVelocity;

        const mu = rho * vs * vs;
        const lambda = rho * vp * vp - 2 * mu;

        waveField.rho[index] = rho;
        waveField.vp[index] = vp;
        waveField.vs[index] = vs;
        waveField.lambda[index] = lambda;
        waveField.mu[index] = mu;
      }
    }
  }

  return waveField;
}

export function setSource(
  waveField: WaveField,
  position: Vector3,
  magnitude: number
): void {
  waveField.source = { ...position };
  waveField.sourceMagnitude = magnitude;
  waveField.sourceTime = 0;
}

function rickerWavelet(t: number, f0: number, t0: number): number {
  const tau = Math.PI * f0 * (t - t0);
  const tau2 = tau * tau;
  return (1 - 2 * tau2) * Math.exp(-tau2);
}

function gaussianSource(t: number, f0: number, t0: number): number {
  const sigma = 1 / (f0 * Math.PI);
  const arg = (t - t0) / sigma;
  return Math.exp(-0.5 * arg * arg) * Math.cos(2 * Math.PI * f0 * (t - t0));
}

function laplacian(
  field: Float32Array,
  i: number,
  j: number,
  k: number,
  nx: number,
  ny: number,
  nz: number,
  dx: number,
  dy: number,
  dz: number,
  bc: 'reflective' | 'absorbing'
): number {
  const get = (ii: number, jj: number, kk: number): number => {
    if (bc === 'absorbing') {
      if (ii < 0 || ii >= nx || jj < 0 || jj >= ny || kk < 0 || kk >= nz) {
        return 0;
      }
      return field[idx(ii, jj, kk, nx, ny)];
    } else {
      ii = Math.max(0, Math.min(nx - 1, ii));
      jj = Math.max(0, Math.min(ny - 1, jj));
      kk = Math.max(0, Math.min(nz - 1, kk));
      return field[idx(ii, jj, kk, nx, ny)];
    }
  };

  const d2x =
    (get(i + 1, j, k) - 2 * get(i, j, k) + get(i - 1, j, k)) / (dx * dx);
  const d2y =
    (get(i, j + 1, k) - 2 * get(i, j, k) + get(i, j - 1, k)) / (dy * dy);
  const d2z =
    (get(i, j, k + 1) - 2 * get(i, j, k) + get(i, j, k - 1)) / (dz * dz);

  return d2x + d2y + d2z;
}

function gradientDiv(
  ux: Float32Array,
  uy: Float32Array,
  uz: Float32Array,
  comp: 'x' | 'y' | 'z',
  i: number,
  j: number,
  k: number,
  nx: number,
  ny: number,
  nz: number,
  dx: number,
  dy: number,
  dz: number,
  bc: 'reflective' | 'absorbing'
): number {
  const get = (arr: Float32Array, ii: number, jj: number, kk: number): number => {
    if (bc === 'absorbing') {
      if (ii < 0 || ii >= nx || jj < 0 || jj >= ny || kk < 0 || kk >= nz) {
        return 0;
      }
      return arr[idx(ii, jj, kk, nx, ny)];
    } else {
      ii = Math.max(0, Math.min(nx - 1, ii));
      jj = Math.max(0, Math.min(ny - 1, jj));
      kk = Math.max(0, Math.min(nz - 1, kk));
      return arr[idx(ii, jj, kk, nx, ny)];
    }
  };

  const dudx = (get(ux, i + 1, j, k) - get(ux, i - 1, j, k)) / (2 * dx);
  const dvdy = (get(uy, i, j + 1, k) - get(uy, i, j - 1, k)) / (2 * dy);
  const dwdz = (get(uz, i, j, k + 1) - get(uz, i, j, k - 1)) / (2 * dz);
  const div = dudx + dvdy + dwdz;

  if (comp === 'x') {
    return (div - (get(ux, i, j, k) - get(ux, i - 1, j, k)) / dx) / dx;
  } else if (comp === 'y') {
    return (div - (get(uy, i, j, k) - get(uy, i, j - 1, k)) / dy) / dy;
  } else {
    return (div - (get(uz, i, j, k) - get(uz, i, j, k - 1)) / dz) / dz;
  }
}

function curlCurl(
  ux: Float32Array,
  uy: Float32Array,
  uz: Float32Array,
  comp: 'x' | 'y' | 'z',
  i: number,
  j: number,
  k: number,
  nx: number,
  ny: number,
  nz: number,
  dx: number,
  dy: number,
  dz: number,
  bc: 'reflective' | 'absorbing'
): number {
  const get = (arr: Float32Array, ii: number, jj: number, kk: number): number => {
    if (bc === 'absorbing') {
      if (ii < 0 || ii >= nx || jj < 0 || jj >= ny || kk < 0 || kk >= nz) {
        return 0;
      }
      return arr[idx(ii, jj, kk, nx, ny)];
    } else {
      ii = Math.max(0, Math.min(nx - 1, ii));
      jj = Math.max(0, Math.min(ny - 1, jj));
      kk = Math.max(0, Math.min(nz - 1, kk));
      return arr[idx(ii, jj, kk, nx, ny)];
    }
  };

  const dWdy = (get(uz, i, j + 1, k) - get(uz, i, j - 1, k)) / (2 * dy);
  const dVdz = (get(uy, i, j, k + 1) - get(uy, i, j, k - 1)) / (2 * dz);
  const dUdz = (get(ux, i, j, k + 1) - get(ux, i, j, k - 1)) / (2 * dz);
  const dWdx = (get(uz, i + 1, j, k) - get(uz, i - 1, j, k)) / (2 * dx);
  const dVdx = (get(uy, i + 1, j, k) - get(uy, i - 1, j, k)) / (2 * dx);
  const dUdy = (get(ux, i, j + 1, k) - get(ux, i, j - 1, k)) / (2 * dy);

  const curlX = dWdy - dVdz;
  const curlY = dUdz - dWdx;
  const curlZ = dVdx - dUdy;

  if (comp === 'x') {
    const dCurlZdy = (curlZ - (get(uz, i, j - 1, k) - get(uy, i, j - 1, k) ? 0 : 0)) / dy;
    const dCurlYdz = (curlY - (get(ux, i, j, k - 1) - get(uz, i, j, k - 1) ? 0 : 0)) / dz;
    return dCurlZdy - dCurlYdz;
  } else if (comp === 'y') {
    const dCurlXdz = (curlX - (get(uz, i, j, k - 1) - get(uy, i, j, k - 1) ? 0 : 0)) / dz;
    const dCurlZdx = (curlZ - (get(uy, i - 1, j, k) - get(ux, i - 1, j, k) ? 0 : 0)) / dx;
    return dCurlXdz - dCurlZdx;
  } else {
    const dCurlYdx = (curlY - (get(ux, i - 1, j, k) - get(uz, i - 1, j, k) ? 0 : 0)) / dx;
    const dCurlXdy = (curlX - (get(uz, i, j - 1, k) - get(uy, i, j - 1, k) ? 0 : 0)) / dy;
    return dCurlYdx - dCurlXdy;
  }
}

function curlCurlSimplified(
  ux: Float32Array,
  uy: Float32Array,
  uz: Float32Array,
  comp: 'x' | 'y' | 'z',
  i: number,
  j: number,
  k: number,
  nx: number,
  ny: number,
  nz: number,
  dx: number,
  dy: number,
  dz: number,
  bc: 'reflective' | 'absorbing'
): number {
  const get = (arr: Float32Array, ii: number, jj: number, kk: number): number => {
    if (bc === 'absorbing') {
      if (ii < 0 || ii >= nx || jj < 0 || jj >= ny || kk < 0 || kk >= nz) {
        return 0;
      }
      return arr[idx(ii, jj, kk, nx, ny)];
    } else {
      ii = Math.max(0, Math.min(nx - 1, ii));
      jj = Math.max(0, Math.min(ny - 1, jj));
      kk = Math.max(0, Math.min(nz - 1, kk));
      return arr[idx(ii, jj, kk, nx, ny)];
    }
  };

  const lap = laplacian(comp === 'x' ? ux : comp === 'y' ? uy : uz, i, j, k, nx, ny, nz, dx, dy, dz, bc);
  const gradDiv = gradientDiv(ux, uy, uz, comp, i, j, k, nx, ny, nz, dx, dy, dz, bc);

  return gradDiv - lap;
}

export function stepWaveField(
  waveField: WaveField,
  params: SimulationParams,
  dt: number
): void {
  const {
    nx,
    ny,
    nz,
    dx,
    dy,
    dz,
    pWave,
    pWavePrev,
    sWaveX,
    sWaveY,
    sWaveZ,
    sWavePrevX,
    sWavePrevY,
    sWavePrevZ,
    lambda,
    mu,
    rho,
    vp,
    vs,
    source,
    sourceMagnitude,
    sourceTime,
  } = waveField;

  const { damping, boundaryCondition, sourceFrequency } = params;

  const pWaveNext = new Float32Array(pWave.length);
  const sWaveNextX = new Float32Array(sWaveX.length);
  const sWaveNextY = new Float32Array(sWaveY.length);
  const sWaveNextZ = new Float32Array(sWaveZ.length);

  const newTime = waveField.time + dt;

  for (let k = 1; k < nz - 1; k++) {
    for (let j = 1; j < ny - 1; j++) {
      for (let i = 1; i < nx - 1; i++) {
        const index = idx(i, j, k, nx, ny);
        const rhoVal = rho[index];
        const lambdaVal = lambda[index];
        const muVal = mu[index];
        const vpVal = vp[index];

        const lapP = laplacian(pWave, i, j, k, nx, ny, nz, dx, dy, dz, boundaryCondition);

        let sourceTerm = 0;
        if (source) {
          const dist = Math.sqrt(
            Math.pow(i - source.x, 2) +
            Math.pow(j - source.y, 2) +
            Math.pow(k - source.z, 2)
          );
          if (dist < 3) {
            const wavelet = gaussianSource(newTime, sourceFrequency, 0.5);
            const spatialDecay = Math.exp(-dist * dist / 4);
            sourceTerm = sourceMagnitude * 500000 * wavelet * spatialDecay;
          }
        }

        const pAccel = vpVal * vpVal * lapP + sourceTerm / rhoVal;
        pWaveNext[index] =
          2 * pWave[index] -
          pWavePrev[index] +
          dt * dt * pAccel -
          damping * dt * (pWave[index] - pWavePrev[index]);

        const lapSX = laplacian(sWaveX, i, j, k, nx, ny, nz, dx, dy, dz, boundaryCondition);
        const lapSY = laplacian(sWaveY, i, j, k, nx, ny, nz, dx, dy, dz, boundaryCondition);
        const lapSZ = laplacian(sWaveZ, i, j, k, nx, ny, nz, dx, dy, dz, boundaryCondition);

        const vsVal = vs[index];
        const sAccelX = vsVal * vsVal * lapSX + sourceTerm * 0.3 / rhoVal;
        const sAccelY = vsVal * vsVal * lapSY;
        const sAccelZ = vsVal * vsVal * lapSZ;

        sWaveNextX[index] =
          2 * sWaveX[index] -
          sWavePrevX[index] +
          dt * dt * sAccelX -
          damping * dt * (sWaveX[index] - sWavePrevX[index]);
        sWaveNextY[index] =
          2 * sWaveY[index] -
          sWavePrevY[index] +
          dt * dt * sAccelY -
          damping * dt * (sWaveY[index] - sWavePrevY[index]);
        sWaveNextZ[index] =
          2 * sWaveZ[index] -
          sWavePrevZ[index] +
          dt * dt * sAccelZ -
          damping * dt * (sWaveZ[index] - sWavePrevZ[index]);
      }
    }
  }

  if (boundaryCondition === 'absorbing') {
    const boundaryWidth = 4;
    for (let k = 0; k < nz; k++) {
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          const index = idx(i, j, k, nx, ny);
          let dist = Math.min(
            i,
            nx - 1 - i,
            j,
            ny - 1 - j,
            k,
            nz - 1 - k
          );
          if (dist < boundaryWidth) {
            const factor = dist / boundaryWidth;
            pWaveNext[index] *= factor * factor;
            sWaveNextX[index] *= factor * factor;
            sWaveNextY[index] *= factor * factor;
            sWaveNextZ[index] *= factor * factor;
          }
        }
      }
    }
  }

  waveField.pWavePrev.set(pWave);
  waveField.pWave.set(pWaveNext);
  waveField.sWavePrevX.set(sWaveX);
  waveField.sWavePrevY.set(sWaveY);
  waveField.sWavePrevZ.set(sWaveZ);
  waveField.sWaveX.set(sWaveNextX);
  waveField.sWaveY.set(sWaveNextY);
  waveField.sWaveZ.set(sWaveNextZ);
  waveField.time = newTime;
  waveField.sourceTime = sourceTime + dt;
}

export function getPWaveDisplacement(waveField: WaveField): Float32Array {
  return waveField.pWave;
}

export function getSWaveDisplacement(waveField: WaveField): Float32Array {
  const result = new Float32Array(waveField.pWave.length * 3);
  for (let i = 0; i < waveField.pWave.length; i++) {
    result[i * 3] = waveField.sWaveX[i];
    result[i * 3 + 1] = waveField.sWaveY[i];
    result[i * 3 + 2] = waveField.sWaveZ[i];
  }
  return result;
}

export function getSWaveMagnitude(waveField: WaveField): Float32Array {
  const result = new Float32Array(waveField.pWave.length);
  for (let i = 0; i < waveField.pWave.length; i++) {
    const sx = waveField.sWaveX[i];
    const sy = waveField.sWaveY[i];
    const sz = waveField.sWaveZ[i];
    result[i] = Math.sqrt(sx * sx + sy * sy + sz * sz);
  }
  return result;
}

export function resetWaveField(waveField: WaveField): void {
  waveField.pWave.fill(0);
  waveField.pWavePrev.fill(0);
  waveField.sWaveX.fill(0);
  waveField.sWaveY.fill(0);
  waveField.sWaveZ.fill(0);
  waveField.sWavePrevX.fill(0);
  waveField.sWavePrevY.fill(0);
  waveField.sWavePrevZ.fill(0);
  waveField.time = 0;
  waveField.sourceTime = 0;
}

export function getWaveSpeedAtPosition(
  waveField: WaveField,
  i: number,
  j: number,
  k: number
): { vp: number; vs: number } {
  const index = idx(i, j, k, waveField.nx, waveField.ny);
  return {
    vp: waveField.vp[index],
    vs: waveField.vs[index],
  };
}
