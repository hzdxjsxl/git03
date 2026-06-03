import { GameCanvas } from '../components/GameCanvas';
import { PauseMenu } from '../components/PauseMenu';
import { GameOver } from '../components/GameOver';
import { Victory } from '../components/Victory';
import { useGameStore } from '../store/gameStore';

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

export function GamePage() {
  const { gameState } = useGameStore();

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0a1628 0%, #1a2a4a 50%, #0a1628 100%)'
        }}
      />

      <div className="relative z-10">
        <GameCanvas width={GAME_WIDTH} height={GAME_HEIGHT} />
        
        {gameState === 'paused' && <PauseMenu />}
        {gameState === 'gameover' && <GameOver />}
        {gameState === 'victory' && <Victory />}
      </div>
    </div>
  );
}
