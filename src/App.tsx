import { MainMenu } from './components/MainMenu';
import { Leaderboard } from './components/Leaderboard';
import { GamePage } from './pages/GamePage';
import { useGameStore } from './store/gameStore';

export default function App() {
  const { gameState } = useGameStore();

  if (gameState === 'menu') {
    return <MainMenu />;
  }

  if (gameState === 'leaderboard') {
    return <Leaderboard />;
  }

  return <GamePage />;
}
