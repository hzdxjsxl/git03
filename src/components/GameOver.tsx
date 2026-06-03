import { RotateCcw, Home } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export function GameOver() {
  const { setGameState, resetGame, currentLevel, setCurrentLevel } = useGameStore();

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
        className="p-10 rounded-xl text-center"
        style={{
          background: 'linear-gradient(135deg, #2a1a2a 0%, #1a0a1a 100%)',
          border: '3px solid #ff3366',
          boxShadow: '0 0 60px #ff336644'
        }}
      >
        <h2 
          className="text-5xl font-bold mb-4"
          style={{
            fontFamily: '"Orbitron", monospace',
            color: '#ff3366',
            textShadow: '0 0 20px #ff3366'
          }}
        >
          游戏结束
        </h2>
        
        <p className="text-gray-400 mb-8 text-lg">
          你被激光击中了...
        </p>

        <div className="flex flex-col gap-4">
          <button
            onClick={handleRetry}
            className="group relative px-10 py-4 text-lg font-bold rounded-lg overflow-hidden transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #ff336622 0%, #ff336644 100%)',
              border: '2px solid #ff3366',
              color: '#ff3366'
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              <RotateCcw size={20} /> 重新挑战
            </span>
          </button>

          <button
            onClick={handleMainMenu}
            className="group relative px-10 py-4 text-lg font-bold rounded-lg overflow-hidden transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #66666622 0%, #66666644 100%)',
              border: '2px solid #666666',
              color: '#aaaaaa'
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              <Home size={20} /> 返回主菜单
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
