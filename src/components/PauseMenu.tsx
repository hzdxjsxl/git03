import { Play, Home } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export function PauseMenu() {
  const { setGameState } = useGameStore();

  const handleResume = () => {
    setGameState('playing');
  };

  const handleMainMenu = () => {
    setGameState('menu');
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/70">
      <div 
        className="p-10 rounded-xl text-center"
        style={{
          background: 'linear-gradient(135deg, #1a2a4a 0%, #0a1628 100%)',
          border: '3px solid #00f5ff',
          boxShadow: '0 0 60px #00f5ff44'
        }}
      >
        <h2 
          className="text-4xl font-bold mb-8"
          style={{
            fontFamily: '"Orbitron", monospace',
            color: '#00f5ff',
            textShadow: '0 0 20px #00f5ff'
          }}
        >
          游戏暂停
        </h2>

        <div className="flex flex-col gap-4">
          <button
            onClick={handleResume}
            className="group relative px-12 py-4 text-lg font-bold rounded-lg overflow-hidden transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #00f5ff22 0%, #00f5ff44 100%)',
              border: '2px solid #00f5ff',
              color: '#00f5ff'
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              <Play size={20} /> 继续游戏
            </span>
          </button>

          <button
            onClick={handleMainMenu}
            className="group relative px-12 py-4 text-lg font-bold rounded-lg overflow-hidden transition-all duration-300 hover:scale-105"
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

        <p className="mt-6 text-sm text-gray-500">
          按 ESC 键继续游戏
        </p>
      </div>
    </div>
  );
}
