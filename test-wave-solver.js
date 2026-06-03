import {
  createWaveField,
  setSource,
  stepWaveField,
  getPWaveDisplacement,
  getSWaveMagnitude,
} from './src/utils/waveSolver.js';

const rockModel = {
  layers: [
    {
      id: 'test',
      name: 'Test Layer',
      depth: [0, 100],
      density: 2600,
      pWaveVelocity: 5000,
      sWaveVelocity: 2800,
      color: '#708090',
    },
  ],
  size: { x: 100, y: 100, z: 100 },
};

const gridSize = { x: 20, y: 20, z: 20 };
const cellSize = { x: 5, y: 5, z: 5 };

console.log('=== 波动方程解算器测试 ===\n');
console.log('网格尺寸:', gridSize);
console.log('单元格大小:', cellSize);
console.log('P波速度: 5000 m/s');
console.log('S波速度: 2800 m/s');
console.log('');

const waveField = createWaveField(gridSize, cellSize, rockModel);
console.log('波场创建成功');
console.log('波场大小:', waveField.pWave.length);
console.log('');

setSource(waveField, { x: 10, y: 10, z: 10 }, 5.0);
console.log('震源设置在 (10, 10, 10)');
console.log('');

const params = {
  timeStep: 0.0001,
  damping: 0.05,
  boundaryCondition: 'absorbing',
  sourceFrequency: 1,
};

let maxP = 0;
let maxS = 0;
let firstNonZeroPStep = -1;
let firstNonZeroSStep = -1;

const stepsPerSecond = 1 / params.timeStep;
const testDuration = 0.1;
const totalSteps = Math.floor(testDuration * stepsPerSecond);

console.log(`开始模拟 ${testDuration} 秒，共 ${totalSteps} 步...`);
console.log('');

for (let step = 0; step < totalSteps; step++) {
  stepWaveField(waveField, params, params.timeStep);

  const pWave = getPWaveDisplacement(waveField);
  const sWave = getSWaveMagnitude(waveField);

  let currentMaxP = 0;
  let currentMaxS = 0;
  let pCount = 0;
  let sCount = 0;

  for (let i = 0; i < pWave.length; i++) {
    const pVal = Math.abs(pWave[i]);
    const sVal = sWave[i];
    if (pVal > currentMaxP) currentMaxP = pVal;
    if (sVal > currentMaxS) currentMaxS = sVal;
    if (pVal > 0.00001) pCount++;
    if (sVal > 0.00001) sCount++;
  }

  if (currentMaxP > maxP) maxP = currentMaxP;
  if (currentMaxS > maxS) maxS = currentMaxS;

  if (firstNonZeroPStep < 0 && pCount > 0) {
    firstNonZeroPStep = step;
    const time = step * params.timeStep;
    const dist = Math.sqrt(5 * 5 + 5 * 5 + 5 * 5) * cellSize.x;
    console.log(`✓ P波首次检测到: 第 ${step} 步 (t=${time.toFixed(5)}s), 激活 ${pCount} 个网格点`);
    console.log(`  距震源约 ${dist.toFixed(1)}m, 视速度 ${(dist / time).toFixed(0)} m/s`);
  }

  if (firstNonZeroSStep < 0 && sCount > 0) {
    firstNonZeroSStep = step;
    const time = step * params.timeStep;
    const dist = Math.sqrt(5 * 5 + 5 * 5 + 5 * 5) * cellSize.x;
    console.log(`✓ S波首次检测到: 第 ${step} 步 (t=${time.toFixed(5)}s), 激活 ${sCount} 个网格点`);
    console.log(`  距震源约 ${dist.toFixed(1)}m, 视速度 ${(dist / time).toFixed(0)} m/s`);
  }

  if (step % 200 === 0 && step > 0) {
    const time = step * params.timeStep;
    const expectedPDist = 5000 * time;
    const expectedSDist = 2800 * time;
    console.log(`\n进度 ${((step / totalSteps) * 100).toFixed(0)}% (t=${time.toFixed(4)}s):`);
    console.log(`  P波: 最大振幅=${maxP.toExponential(2)}, 激活网格=${pCount}`);
    console.log(`  S波: 最大振幅=${maxS.toExponential(2)}, 激活网格=${sCount}`);
    console.log(`  理论传播距离: P=${expectedPDist.toFixed(1)}m, S=${expectedSDist.toFixed(1)}m`);
  }
}

console.log('\n=== 测试完成 ===');
console.log('P波最大振幅:', maxP.toExponential(4));
console.log('S波最大振幅:', maxS.toExponential(4));
console.log('P/S振幅比:', (maxP / (maxS || 1)).toFixed(2));

if (firstNonZeroPStep >= 0 && firstNonZeroSStep >= 0) {
  const pTime = firstNonZeroPStep * params.timeStep;
  const sTime = firstNonZeroSStep * params.timeStep;
  console.log('\n波速验证:');
  console.log(`P波首达时间: ${pTime.toExponential(2)}s`);
  console.log(`S波首达时间: ${sTime.toExponential(2)}s`);
  console.log(`S-P时差: ${(sTime - pTime).toExponential(2)}s`);
  console.log(`理论Vp/Vs比: ${(5000 / 2800).toFixed(3)}`);
  console.log(`实测Vp/Vs比: ${(sTime / pTime).toFixed(3)}`);

  const pSpeedOk = (sTime / pTime) > 1.5 && (sTime / pTime) < 2.0;
  console.log(`\n✓ 波速比在合理范围内: ${pSpeedOk ? 'PASS' : 'FAIL'}`);
}

const amplitudeOk = maxP > 0.0001 && maxS > 0.00001;
console.log(`✓ 振幅合理: ${amplitudeOk ? 'PASS' : 'FAIL'}`);

const wavesOk = firstNonZeroPStep >= 0 && firstNonZeroSStep >= 0;
console.log(`✓ 波均已传播: ${wavesOk ? 'PASS' : 'FAIL'}`);

const allPassed = pSpeedOk && amplitudeOk && wavesOk;
console.log(`\n总体测试结果: ${allPassed ? '✅ 通过' : '❌ 失败'}`);
