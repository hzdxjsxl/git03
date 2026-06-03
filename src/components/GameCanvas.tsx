import { useEffect, useRef, useCallback } from 'react';
import { GameEngine } from '../game/engine/GameEngine';
import { allLevels } from '../game/levels/LevelData';
import { useGameStore } from '../store/gameStore';

interface GameCanvasProps {
  width: number;
  height: number;
}

export function GameCanvas({ width, height }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const { gameState, currentLevel, setGameState, setScore, setTime } = useGameStore();

  const handleGameOver = useCallback(() => {
    setGameState('gameover');
  }, [setGameState]);

  const handleVictory = useCallback(() => {
    if (gameEngineRef.current) {
      setScore(gameEngineRef.current.getScore());
      setTime(gameEngineRef.current.getTime());
    }
    setGameState('victory');
  }, [setGameState, setScore, setTime]);

  useEffect(() => {
    if (!canvasRef.current || gameState !== 'playing') return;

    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;

    const gameEngine = new GameEngine(canvas, {
      width,
      height,
      gravity: 1
    });

    gameEngineRef.current = gameEngine;

    gameEngine.loadLevel(allLevels[currentLevel] || allLevels[0]);
    gameEngine.setOnGameOver(handleGameOver);
    gameEngine.setOnVictory(handleVictory);
    gameEngine.start();

    const handleKeyDown = (e: KeyboardEvent) => {
      gameEngine.handleKeyDown(e.key);
      
      if (e.key === 'Escape') {
        setGameState('paused');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameEngine.handleKeyUp(e.key);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      gameEngine.handleMouseMove(x, y);
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      gameEngine.handleMouseDown(x, y);
    };

    const handleMouseUp = () => {
      gameEngine.handleMouseUp();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      gameEngine.destroy();
      gameEngineRef.current = null;
    };
  }, [width, height, gameState, currentLevel, handleGameOver, handleVictory, setGameState]);

  useEffect(() => {
    if (gameState === 'playing' && gameEngineRef.current) {
      gameEngineRef.current.start();
    } else if (gameState === 'paused' && gameEngineRef.current) {
      gameEngineRef.current.stop();
    }
  }, [gameState]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded-lg shadow-2xl"
      style={{
        boxShadow: '0 0 50px rgba(0, 245, 255, 0.3)'
      }}
    />
  );
}
