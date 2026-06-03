import { useState } from 'react';
import { Play, Trophy, Info, X } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { allLevels } from '../game/levels/LevelData';

export function MainMenu() {
  const { setGameState, setCurrentLevel } = useGameStore();
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const handleStartGame = (level: number) => {
    setCurrentLevel(level);
    setGameState('playing');
  };

  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0a1628 0%, #1a2a4a 50%, #0a1628 100%)'
        }}
      />
      
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 4 + 1 + 'px',
              height: Math.random() * 4 + 1 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              background: '#00f5ff',
              opacity: Math.random() * 0.5 + 0.2,
              animation: `pulse ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: Math.random() * 2 + 's'
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center">
        <h1 
          className="text-7xl font-bold mb-4 tracking-wider"
          style={{
            fontFamily: '"Orbitron", monospace',
            color: '#00f5ff',
            textShadow: '0 0 20px #00f5ff, 0 0 40px #00f5ff, 0 0 60px #00f5ff'
          }}
        >
          GRAPPLE
        </h1>
        <h2 
          className="text-3xl mb-12 tracking-widest"
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            color: '#ff3366',
            textShadow: '0 0 15px #ff3366'
          }}
        >
          平台跳跃
        </h2>

        <div className="flex flex-col gap-4 items-center">
          <button
            onClick={() => setShowLevelSelect(true)}
            className="group relative px-12 py-4 text-xl font-bold rounded-lg overflow-hidden transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #00f5ff22 0%, #00f5ff44 100%)',
              border: '2px solid #00f5ff',
              color: '#00f5ff',
              boxShadow: '0 0 20px #00f5ff44'
            }}
          >
            <span className="relative z-10 flex items-center gap-3">
              <Play size={24} /> 开始游戏
            </span>
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #00f5ff44 0%, #00f5ff66 100%)' }}
            />
          </button>

          <button
            onClick={() => setGameState('leaderboard')}
            className="group relative px-12 py-4 text-xl font-bold rounded-lg overflow-hidden transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #ffaa0022 0%, #ffaa0044 100%)',
              border: '2px solid #ffaa00',
              color: '#ffaa00',
              boxShadow: '0 0 20px #ffaa0044'
            }}
          >
            <span className="relative z-10 flex items-center gap-3">
              <Trophy size={24} /> 排行榜
            </span>
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #ffaa0044 0%, #ffaa0066 100%)' }}
            />
          </button>

          <button
            onClick={() => setShowControls(true)}
            className="group relative px-12 py-4 text-xl font-bold rounded-lg overflow-hidden transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #ff336622 0%, #ff336644 100%)',
              border: '2px solid #ff3366',
              color: '#ff3366',
              boxShadow: '0 0 20px #ff336644'
            }}
          >
            <span className="relative z-10 flex items-center gap-3">
              <Info size={24} /> 操作说明
            </span>
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #ff336644 0%, #ff336666 100%)' }}
            />
          </button>
        </div>

        <p 
          className="mt-12 text-sm opacity-60"
          style={{ fontFamily: '"JetBrains Mono", monospace', color: '#8899aa' }}
        >
          用钩爪穿越霓虹都市，躲避致命激光
        </p>
      </div>

      {showLevelSelect && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/80">
          <div 
            className="p-8 rounded-xl max-w-md w-full mx-4"
            style={{
              background: 'linear-gradient(135deg, #1a2a4a 0%, #0a1628 100%)',
              border: '2px solid #00f5ff',
              boxShadow: '0 0 40px #00f5ff33'
            }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 
                className="text-2xl font-bold"
                style={{ fontFamily: '"Orbitron", monospace', color: '#00f5ff' }}
              >
                选择关卡
              </h3>
              <button
                onClick={() => setShowLevelSelect(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {allLevels.map((level, index) => (
                <button
                  key={index}
                  onClick={() => handleStartGame(index)}
                  className="w-full p-4 rounded-lg text-left transition-all hover:scale-102"
                  style={{
                    background: 'linear-gradient(135deg, #2a3a5a 0%, #1a2a4a 100%)',
                    border: '1px solid #00f5ff44'
                  }}
                >
                  <div className="text-lg font-bold text-cyan-400">{level.name}</div>
                  <div className="text-sm text-gray-400 mt-1">
                    平台数: {level.platforms.length} | 激光数: {level.lasers.length}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showControls && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/80">
          <div 
            className="p-8 rounded-xl max-w-md w-full mx-4"
            style={{
              background: 'linear-gradient(135deg, #1a2a4a 0%, #0a1628 100%)',
              border: '2px solid #ff3366',
              boxShadow: '0 0 40px #ff336633'
            }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 
                className="text-2xl font-bold"
                style={{ fontFamily: '"Orbitron", monospace', color: '#ff3366' }}
              >
                操作说明
              </h3>
              <button
                onClick={() => setShowControls(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <kbd className="px-3 py-2 rounded bg-gray-700 text-white font-mono">W A S D</kbd>
                <span className="text-gray-300">移动角色</span>
              </div>
              <div className="flex items-center gap-4">
                <kbd className="px-3 py-2 rounded bg-gray-700 text-white font-mono">空格 / W</kbd>
                <span className="text-gray-300">跳跃</span>
              </div>
              <div className="flex items-center gap-4">
                <kbd className="px-3 py-2 rounded bg-gray-700 text-white font-mono">鼠标</kbd>
                <span className="text-gray-300">瞄准钩爪</span>
              </div>
              <div className="flex items-center gap-4">
                <kbd className="px-3 py-2 rounded bg-gray-700 text-white font-mono">左键按住</kbd>
                <span className="text-gray-300">发射并保持钩爪</span>
              </div>
              <div className="flex items-center gap-4">
                <kbd className="px-3 py-2 rounded bg-gray-700 text-white font-mono">松开左键</kbd>
                <span className="text-gray-300">释放钩爪</span>
              </div>
              <div className="flex items-center gap-4">
                <kbd className="px-3 py-2 rounded bg-gray-700 text-white font-mono">ESC</kbd>
                <span className="text-gray-300">暂停游戏</span>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-yellow-900/30 border border-yellow-500/30">
              <p className="text-yellow-400 text-sm">
                💡 提示: 观察激光的闪烁警告，把握时机通过！
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
