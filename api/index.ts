import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  time: number;
  level: number;
  createdAt: string;
}

let leaderboardData: LeaderboardEntry[] = [
  { id: '1', playerName: 'SpeedRunner', score: 9850, time: 15.2, level: 1, createdAt: '2024-01-15T10:30:00Z' },
  { id: '2', playerName: 'GrappleMaster', score: 9500, time: 18.5, level: 1, createdAt: '2024-01-14T14:20:00Z' },
  { id: '3', playerName: 'CyberNinja', score: 9200, time: 21.0, level: 1, createdAt: '2024-01-13T09:15:00Z' },
  { id: '4', playerName: 'NeonJumper', score: 8900, time: 24.0, level: 1, createdAt: '2024-01-12T16:45:00Z' },
  { id: '5', playerName: 'LaserDodger', score: 8500, time: 28.0, level: 1, createdAt: '2024-01-11T11:00:00Z' },
];

app.get('/api/leaderboard', (req, res) => {
  const sortedData = [...leaderboardData].sort((a, b) => b.score - a.score);
  res.json({
    success: true,
    data: sortedData.slice(0, 10)
  });
});

app.post('/api/leaderboard', (req, res) => {
  const { playerName, score, time, level } = req.body;

  if (!playerName || score === undefined || time === undefined || level === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields'
    });
  }

  const newEntry: LeaderboardEntry = {
    id: Date.now().toString(),
    playerName: playerName.substring(0, 20),
    score: Math.max(0, Math.floor(score)),
    time: parseFloat(time.toFixed(2)),
    level: level,
    createdAt: new Date().toISOString()
  };

  leaderboardData.push(newEntry);
  leaderboardData.sort((a, b) => b.score - a.score);
  leaderboardData = leaderboardData.slice(0, 100);

  res.json({
    success: true,
    data: newEntry
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Grapple Platformer API is running'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
