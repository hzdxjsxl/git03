import { useEffect, useState } from 'react';
import { ArrowLeft, Trophy, Medal } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  time: number;
  level: number;
  createdAt: string;
}

export function Leaderboard() {
  const { setGameState } = useGameStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/leaderboard');
      const data = await response.json();
      if (data.success) {
        setEntries(data.data);
      }
    } catch (e) {
      setEntries([
        { id: '1', playerName: 'SpeedRunner', score: 9850, time: 15.2, level: 1, createdAt: '2024-01-15' },
        { id: '2', playerName: 'GrappleMaster', score: 9500, time: 18.5, level: 1, createdAt: '2024-01-14' },
        { id: '3', playerName: 'CyberNinja', score: 9200, time: 21.0, level: 1, createdAt: '2024-01-13' },
        { id: '4', playerName: 'NeonJumper', score: 8900, time: 24.0, level: 1, createdAt: '2024-01-12' },
        { id: '5', playerName: 'LaserDodger', score: 8500, time: 28.0, level: 1, createdAt: '2024-01-11' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="text-yellow-400" size={24} />;
    if (rank === 2) return <Medal className="text-gray-300" size={24} />;
    if (rank === 3) return <Medal className="text-amber-600" size={24} />;
    return <span className="text-gray-500 font-bold w-6 text-center">{rank}</span>;
  };

  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #1a1a0a 0%, #2a2a1a 50%, #1a1a0a 100%)'
        }}
      />

      <div 
        className="relative z-10 p-8 rounded-xl max-w-2xl w-full mx-4"
        style={{
          background: 'linear-gradient(135deg, #2a2a1a 0%, #1a1a0a 100%)',
          border: '2px solid #ffaa00',
          boxShadow: '0 0 40px #ffaa0033'
        }}
      >
        <div className="flex items-center justify-between mb-8">
          <h2 
            className="text-4xl font-bold"
            style={{
              fontFamily: '"Orbitron", monospace',
              color: '#ffaa00',
              textShadow: '0 0 15px #ffaa00'
            }}
          >
            排行榜
          </h2>
          <button
            onClick={() => setGameState('menu')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #66666622 0%, #66666644 100%)',
              border: '2px solid #666666',
              color: '#aaaaaa'
            }}
          >
            <ArrowLeft size={20} /> 返回
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">
            加载中...
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className="flex items-center gap-4 p-4 rounded-lg transition-all hover:scale-[1.02]"
                style={{
                  background: index < 3 
                    ? `linear-gradient(135deg, ${index === 0 ? '#ffaa0022' : index === 1 ? '#cccccc22' : '#cd7f3222'} 0%, transparent 100%)`
                    : 'transparent',
                  border: `1px solid ${index < 3 ? (index === 0 ? '#ffaa0044' : index === 1 ? '#cccccc44' : '#cd7f3244') : '#ffffff11'}`,
                }}
              >
                <div className="w-10 flex justify-center">
                  {getRankIcon(index + 1)}
                </div>
                
                <div className="flex-1">
                  <div className="font-bold text-white text-lg">{entry.playerName}</div>
                  <div className="text-sm text-gray-400">
                    关卡 {entry.level} | {entry.time.toFixed(2)}s
                  </div>
                </div>

                <div 
                  className="text-2xl font-bold"
                  style={{
                    fontFamily: '"Orbitron", monospace',
                    color: '#ffaa00',
                    textShadow: '0 0 10px #ffaa0066'
                  }}
                >
                  {entry.score.toLocaleString()}
                </div>
              </div>
            ))}

            {entries.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                暂无记录，成为第一个上榜的玩家吧！
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
