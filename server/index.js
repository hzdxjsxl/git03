const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

function loadMockData(filename) {
  const filePath = path.join(__dirname, 'mock', filename);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  }
  return null;
}

app.get('/api/players', (req, res) => {
  const data = loadMockData('players.json');
  if (!data) {
    return res.status(500).json({ error: '数据文件不存在，请先运行 npm run generate-mock' });
  }
  res.json(data);
});

app.get('/api/matches', (req, res) => {
  const data = loadMockData('matches.json');
  if (!data) {
    return res.status(500).json({ error: '数据文件不存在，请先运行 npm run generate-mock' });
  }
  res.json(data);
});

app.get('/api/teams', (req, res) => {
  const data = loadMockData('teams.json');
  if (!data) {
    return res.status(500).json({ error: '数据文件不存在，请先运行 npm run generate-mock' });
  }
  res.json(data);
});

app.get('/api/players/:playerId/matches', (req, res) => {
  const { playerId } = req.params;
  const data = loadMockData('matches.json');
  if (!data) {
    return res.status(500).json({ error: '数据文件不存在' });
  }
  const playerMatches = data.matches.filter(m => m.playerId === playerId);
  res.json({ matches: playerMatches });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '电竞数据分析API服务运行正常' });
});

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🎮 电竞数据分析后端服务已启动                            ║
  ║                                                           ║
  ║   📡 服务地址: http://localhost:${PORT}                      ║
  ║                                                           ║
  ║   📊 API 接口:                                            ║
  ║      GET /api/players       - 获取选手列表                 ║
  ║      GET /api/matches       - 获取比赛记录                 ║
  ║      GET /api/teams         - 获取战队列表                 ║
  ║      GET /api/health        - 健康检查                     ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
});
