import { useState, useEffect } from 'react';
import { RotateCcw, Home, Trophy, ChevronRight } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { allLevels } from '../game/levels/LevelData';

export function Victory() {
  const { 
    gameState, 
    score, 
    time, 
    currentLevel,
    setGameState, 
    resetGame, 
    setCurrentLevel 
  } = useGameStore();
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (gameState === 'victory') {
      setAnimatedScore(0);
      const duration = 1500;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setAnimatedScore(Math.floor(score * eased));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [gameState, score]);

  const handleSubmitScore = async () => {
    if (!playerName.trim()) return;

    try {
      await fetch('http://localhost:3001/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: playerName.trim(),
          score,
          time,
          level: currentLevel + 1
        })
      });
      setSubmitted(true);
    } catch (e) {
      setSubmitted(true);
    }
  };

  const handleNextLevel = () => {
    if (currentLevel < allLevels.length - 1) {
      setCurrentLevel(currentLevel + 1);
      resetGame();
    }
  };

  const handleRetry = () => {
    setCurrentLevel(currentLevel);
    resetGame();
  };

  const handleMainMenu = () => {
    setGameState('menu');
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/80">
      <div 
        className="p-10 rounded-xl text-center max-w-md w-full mx-4"
        style={{
          background: 'linear-gradient(135deg, #1a2a2a 0%, #0a1a1a 100%)',
          border: '3px solid #00ff88',
          boxShadow: '0 0 60px #00ff8844'
        }}
      >
        <h2 
          className="text-5xl font-bold mb-2"
          style={{
            fontFamily: '"Orbitron", monospace',
            color: '#00ff88',
            textShadow: '0 0 20px #00ff88'
          }}
        >
          通关成功!
        </h2>
        
        <p className="text-gray-400 mb-6">
          用时: {time.toFixed(2)} 秒
        </p>

        <div 
          className="text-6xl font-bold mb-6"
          style={{
            fontFamily: '"Orbitron", monospace',
            color: '#ffaa00',
            textShadow: '0 0 15px #ffaa00'
          }}
        >
          {animatedScore.toLocaleString()}
        </div>

        {!submitted ? (
          <div className="mb-6">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="输入你的名字"
              maxLength={20}
              className="w-full px-4 py-3 rounded-lg text-center text-lg mb-3"
              style={{
                background: '#0a1a1a',
                border: '2px solid #00ff8844',
                color: '#00ff88',
                outline: 'none'
              }}
            />
            <button
              onClick={handleSubmitScore}
              disabled={!playerName.trim()}
              className="w-full px-6 py-3 font-bold rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              style={{
                background: 'linear-gradient(135deg, #ffaa0022 0%, #ffaa0044 100%)',
                border: '2px solid #ffaa00',
                color: '#ffaa00'
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <Trophy size={20} /> 提交分数
              </span>
            </button>
          </div>
        ) : (
          <p className="text-green-400 mb-6">✓ 分数已提交!</p>
        )}

        <div className="flex flex-col gap-3">
          {currentLevel < allLevels.length - 1 && (
            <button
              onClick={handleNextLevel}
              className="group relative px-8 py-3 font-bold rounded-lg overflow-hidden transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #00ff8822 0%, #00ff8844 100%)',
                border: '2px solid #00ff88',
                color: '#00ff88'
              }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                下一关 <ChevronRight size={20} />
              </span>
            </button>
          )}

          <button
            onClick={handleRetry}
            className="group relative px-8 py-3 font-bold rounded-lg overflow-hidden transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #00f5ff22 0%, #00f5ff44 100%)',
              border: '2px solid #00f5ff',
              color: '#00f5ff'
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <RotateCcw size={20} /> 再玩一次
            </span>
          </button>

          <button
            onClick={handleMainMenu}
            className="group relative px-8 py-3 font-bold rounded-lg overflow-hidden transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #66666622 0%, #66666644 100%)',
              border: '2px solid #666666',
              color: '#aaaaaa'
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Home size={20} /> 返回主菜单
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
