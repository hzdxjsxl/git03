const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const deviceData = {
  'conveyor_0': { name: '主传送带A', temperature: 42, capacity: 120, status: 'running' },
  'conveyor_1': { name: '主传送带B', temperature: 38, capacity: 95, status: 'running' },
  'robot_0': { name: '机械臂A1', temperature: 55, capacity: 80, status: 'working' },
  'robot_1': { name: '机械臂A2', temperature: 62, capacity: 75, status: 'working' },
  'robot_2': { name: '机械臂B1', temperature: 48, capacity: 90, status: 'working' },
  'machine_0': { name: '加工中心A', temperature: 72, capacity: 60, status: 'running' },
  'machine_1': { name: '加工中心B', temperature: 68, capacity: 85, status: 'running' },
};

app.get('/api/device/:id', (req, res) => {
  const deviceId = req.params.id;
  const device = deviceData[deviceId];
  
  if (device) {
    const variation = () => (Math.random() - 0.5) * 10;
    res.json({
      ...device,
      temperature: Math.round(device.temperature + variation()),
      capacity: Math.max(0, Math.min(100, Math.round(device.capacity + variation())))
    });
  } else {
    res.status(404).json({ error: 'Device not found' });
  }
});

app.get('/api/devices', (req, res) => {
  const result = {};
  Object.keys(deviceData).forEach(id => {
    const device = deviceData[id];
    const variation = () => (Math.random() - 0.5) * 10;
    result[id] = {
      ...device,
      temperature: Math.round(device.temperature + variation()),
      capacity: Math.max(0, Math.min(100, Math.round(device.capacity + variation())))
    };
  });
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`智慧工厂数字孪生看板服务器运行在 http://localhost:${PORT}`);
});
