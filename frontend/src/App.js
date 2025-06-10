import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_FOOD = { x: 5, y: 5 };
const INITIAL_DIRECTION = { x: 0, y: -1 };

const SnakeGame = () => {
  const canvasRef = useRef(null);
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(INITIAL_FOOD);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [gameRunning, setGameRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const gameLoopRef = useRef();

  // Generate random food position
  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * 20),
      y: Math.floor(Math.random() * 15)
    };
    return newFood;
  }, []);

  // Check collision with walls or self
  const checkCollision = useCallback((head, snakeArray) => {
    // Wall collision
    if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 15) {
      return true;
    }
    // Self collision
    for (let segment of snakeArray) {
      if (head.x === segment.x && head.y === segment.y) {
        return true;
      }
    }
    return false;
  }, []);

  // Game loop
  const gameLoop = useCallback(() => {
    setSnake(currentSnake => {
      if (currentSnake.length === 0) return currentSnake;
      
      const newSnake = [...currentSnake];
      const head = { 
        x: newSnake[0].x + direction.x, 
        y: newSnake[0].y + direction.y 
      };

      // Check collision
      if (checkCollision(head, newSnake)) {
        setGameRunning(false);
        setGameOver(true);
        return currentSnake;
      }

      newSnake.unshift(head);

      // Check if food is eaten
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => {
          const newScore = prev + 10;
          if (newScore > highScore) {
            setHighScore(newScore);
          }
          return newScore;
        });
        setFood(generateFood());
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, checkCollision, generateFood, highScore]);

  // Draw game
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Clear canvas with Nokia green background
    ctx.fillStyle = '#9BBB0F';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines for retro feel
    ctx.strokeStyle = '#8BAD0F';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 20; i++) {
      ctx.beginPath();
      ctx.moveTo(i * GRID_SIZE, 0);
      ctx.lineTo(i * GRID_SIZE, 300);
      ctx.stroke();
    }
    for (let i = 0; i <= 15; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * GRID_SIZE);
      ctx.lineTo(400, i * GRID_SIZE);
      ctx.stroke();
    }

    // Draw snake
    ctx.fillStyle = '#2C5234';
    snake.forEach(segment => {
      ctx.fillRect(
        segment.x * GRID_SIZE + 1, 
        segment.y * GRID_SIZE + 1, 
        GRID_SIZE - 2, 
        GRID_SIZE - 2
      );
    });

    // Draw food
    ctx.fillStyle = '#1A3320';
    ctx.fillRect(
      food.x * GRID_SIZE + 2, 
      food.y * GRID_SIZE + 2, 
      GRID_SIZE - 4, 
      GRID_SIZE - 4
    );
  }, [snake, food]);

  // Handle key presses
  const handleKeyPress = useCallback((e) => {
    if (!gameRunning && !gameOver) return;
    
    switch (e.key) {
      case 'ArrowUp':
        if (direction.y === 0) setDirection({ x: 0, y: -1 });
        break;
      case 'ArrowDown':
        if (direction.y === 0) setDirection({ x: 0, y: 1 });
        break;
      case 'ArrowLeft':
        if (direction.x === 0) setDirection({ x: -1, y: 0 });
        break;
      case 'ArrowRight':
        if (direction.x === 0) setDirection({ x: 1, y: 0 });
        break;
      default:
        break;
    }
  }, [direction, gameRunning, gameOver]);

  // Start game
  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood(generateFood());
    setDirection(INITIAL_DIRECTION);
    setGameRunning(true);
    setGameOver(false);
    setScore(0);
  };

  // Reset game
  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood(INITIAL_FOOD);
    setDirection(INITIAL_DIRECTION);
    setGameRunning(false);
    setGameOver(false);
    setScore(0);
  };

  // Set up game loop
  useEffect(() => {
    if (gameRunning) {
      gameLoopRef.current = setInterval(gameLoop, 150);
    } else {
      clearInterval(gameLoopRef.current);
    }
    
    return () => clearInterval(gameLoopRef.current);
  }, [gameRunning, gameLoop]);

  // Draw on every frame
  useEffect(() => {
    draw();
  }, [draw]);

  // Event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-green-400">
      <div className="nokia-screen bg-gray-800 p-6 rounded-lg border-4 border-gray-600 shadow-2xl">
        {/* Nokia Header */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-green-400 font-mono">NOKIA</h1>
          <div className="flex justify-between text-sm font-mono">
            <span>Score: {score}</span>
            <span>High: {highScore}</span>
          </div>
        </div>

        {/* Game Canvas */}
        <div className="relative border-2 border-gray-700 bg-green-400">
          <canvas
            ref={canvasRef}
            width={400}
            height={300}
            className="block"
            style={{ imageRendering: 'pixelated' }}
          />
          
          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center text-green-400">
              <div className="text-center font-mono">
                <h2 className="text-xl mb-2">GAME OVER</h2>
                <p className="mb-4">Score: {score}</p>
                <button
                  onClick={resetGame}
                  className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-mono"
                >
                  RESTART
                </button>
              </div>
            </div>
          )}

          {/* Start Game Overlay */}
          {!gameRunning && !gameOver && (
            <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center text-green-400">
              <div className="text-center font-mono">
                <h2 className="text-xl mb-4">SNAKE</h2>
                <p className="mb-4 text-sm">Use arrow keys to move</p>
                <button
                  onClick={startGame}
                  className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-mono"
                >
                  START GAME
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Nokia Controls */}
        <div className="mt-4 text-center">
          <div className="grid grid-cols-3 gap-2 max-w-48 mx-auto">
            <div></div>
            <button 
              className="nokia-btn text-xs"
              onClick={() => !gameRunning && !gameOver ? startGame() : null}
            >
              ↑
            </button>
            <div></div>
            <button 
              className="nokia-btn text-xs"
              onClick={() => handleKeyPress({key: 'ArrowLeft'})}
            >
              ←
            </button>
            <button 
              className="nokia-btn text-xs bg-gray-600"
              onClick={resetGame}
            >
              ⊙
            </button>
            <button 
              className="nokia-btn text-xs"
              onClick={() => handleKeyPress({key: 'ArrowRight'})}
            >
              →
            </button>
            <div></div>
            <button 
              className="nokia-btn text-xs"
              onClick={() => handleKeyPress({key: 'ArrowDown'})}
            >
              ↓
            </button>
            <div></div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 text-center text-green-400 font-mono text-sm">
        <p>Use ARROW KEYS or click buttons to control the snake</p>
        <p>Eat the dark squares to grow and score points!</p>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <SnakeGame />
    </div>
  );
}

export default App;