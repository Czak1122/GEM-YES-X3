import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameWrapper from '../components/GameWrapper';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 300;
const PADDLE_WIDTH = 8;
const PADDLE_HEIGHT = 40;
const BALL_SIZE = 8;
const PADDLE_SPEED = 5;
const INITIAL_BALL_SPEED = 3;

const PongGameCore = ({ onScoreUpdate, onGameStateChange }) => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState({
    playerY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    aiY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    ballX: CANVAS_WIDTH / 2,
    ballY: CANVAS_HEIGHT / 2,
    ballSpeedX: INITIAL_BALL_SPEED,
    ballSpeedY: INITIAL_BALL_SPEED,
    playerScore: 0,
    aiScore: 0,
    gameRunning: false,
    gameOver: false,
    ballSpeed: INITIAL_BALL_SPEED
  });

  const [keys, setKeys] = useState({
    up: false,
    down: false
  });

  const gameLoopRef = useRef();

  // Update ball position and handle collisions
  const updateGame = useCallback(() => {
    setGameState(prevState => {
      if (!prevState.gameRunning) return prevState;

      let newState = { ...prevState };

      // Move player paddle
      if (keys.up && newState.playerY > 0) {
        newState.playerY -= PADDLE_SPEED;
      }
      if (keys.down && newState.playerY < CANVAS_HEIGHT - PADDLE_HEIGHT) {
        newState.playerY += PADDLE_SPEED;
      }

      // Simple AI for computer paddle
      const paddleCenter = newState.aiY + PADDLE_HEIGHT / 2;
      const ballCenter = newState.ballY;
      
      if (paddleCenter < ballCenter - 20) {
        newState.aiY = Math.min(newState.aiY + PADDLE_SPEED, CANVAS_HEIGHT - PADDLE_HEIGHT);
      } else if (paddleCenter > ballCenter + 20) {
        newState.aiY = Math.max(newState.aiY - PADDLE_SPEED, 0);
      }

      // Move ball
      newState.ballX += newState.ballSpeedX;
      newState.ballY += newState.ballSpeedY;

      // Ball collision with top and bottom walls
      if (newState.ballY <= 0 || newState.ballY >= CANVAS_HEIGHT - BALL_SIZE) {
        newState.ballSpeedY = -newState.ballSpeedY;
      }

      // Ball collision with player paddle
      if (
        newState.ballX <= PADDLE_WIDTH &&
        newState.ballY + BALL_SIZE >= newState.playerY &&
        newState.ballY <= newState.playerY + PADDLE_HEIGHT &&
        newState.ballSpeedX < 0
      ) {
        newState.ballSpeedX = -newState.ballSpeedX;
        // Add some angle based on where the ball hits the paddle
        const hitPos = (newState.ballY + BALL_SIZE / 2 - newState.playerY - PADDLE_HEIGHT / 2) / (PADDLE_HEIGHT / 2);
        newState.ballSpeedY = hitPos * newState.ballSpeed;
      }

      // Ball collision with AI paddle
      if (
        newState.ballX + BALL_SIZE >= CANVAS_WIDTH - PADDLE_WIDTH &&
        newState.ballY + BALL_SIZE >= newState.aiY &&
        newState.ballY <= newState.aiY + PADDLE_HEIGHT &&
        newState.ballSpeedX > 0
      ) {
        newState.ballSpeedX = -newState.ballSpeedX;
        // Add some angle based on where the ball hits the paddle
        const hitPos = (newState.ballY + BALL_SIZE / 2 - newState.aiY - PADDLE_HEIGHT / 2) / (PADDLE_HEIGHT / 2);
        newState.ballSpeedY = hitPos * newState.ballSpeed;
      }

      // Ball goes off left side (AI scores)
      if (newState.ballX < 0) {
        newState.aiScore++;
        newState = resetBall(newState, 1);
      }

      // Ball goes off right side (Player scores)
      if (newState.ballX > CANVAS_WIDTH) {
        newState.playerScore++;
        newState = resetBall(newState, -1);
        
        // Increase ball speed slightly after player scores
        newState.ballSpeed = Math.min(newState.ballSpeed + 0.2, 8);
      }

      // Check for game over (first to 10 points)
      if (newState.playerScore >= 10 || newState.aiScore >= 10) {
        newState.gameRunning = false;
        newState.gameOver = true;
      }

      return newState;
    });
  }, [keys]);

  // Reset ball to center
  const resetBall = (state, direction) => {
    return {
      ...state,
      ballX: CANVAS_WIDTH / 2,
      ballY: CANVAS_HEIGHT / 2,
      ballSpeedX: state.ballSpeed * direction,
      ballSpeedY: (Math.random() - 0.5) * state.ballSpeed
    };
  };

  // Handle keyboard input
  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        setKeys(prev => ({ ...prev, up: true }));
        e.preventDefault();
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        setKeys(prev => ({ ...prev, down: true }));
        e.preventDefault();
        break;
      default:
        break;
    }
  }, []);

  const handleKeyUp = useCallback((e) => {
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        setKeys(prev => ({ ...prev, up: false }));
        e.preventDefault();
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        setKeys(prev => ({ ...prev, down: false }));
        e.preventDefault();
        break;
      default:
        break;
    }
  }, []);

  // Draw game
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Clear canvas with Nokia green background
    ctx.fillStyle = '#9BBB0F';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw center line
    ctx.strokeStyle = '#8BAD0F';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = '#2C5234';
    // Player paddle (left)
    ctx.fillRect(0, gameState.playerY, PADDLE_WIDTH, PADDLE_HEIGHT);
    // AI paddle (right)
    ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH, gameState.aiY, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Draw ball
    ctx.fillStyle = '#1A3320';
    ctx.fillRect(gameState.ballX, gameState.ballY, BALL_SIZE, BALL_SIZE);

    // Draw scores
    ctx.fillStyle = '#2C5234';
    ctx.font = '20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(gameState.playerScore.toString(), CANVAS_WIDTH / 4, 30);
    ctx.fillText(gameState.aiScore.toString(), (3 * CANVAS_WIDTH) / 4, 30);
  }, [gameState]);

  // Start game
  const startGame = () => {
    setGameState(prev => ({
      ...prev,
      playerY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      aiY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      ballX: CANVAS_WIDTH / 2,
      ballY: CANVAS_HEIGHT / 2,
      ballSpeedX: INITIAL_BALL_SPEED,
      ballSpeedY: (Math.random() - 0.5) * INITIAL_BALL_SPEED,
      playerScore: 0,
      aiScore: 0,
      gameRunning: true,
      gameOver: false,
      ballSpeed: INITIAL_BALL_SPEED
    }));
  };

  // Reset game
  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      playerY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      aiY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      ballX: CANVAS_WIDTH / 2,
      ballY: CANVAS_HEIGHT / 2,
      ballSpeedX: INITIAL_BALL_SPEED,
      ballSpeedY: INITIAL_BALL_SPEED,
      playerScore: 0,
      aiScore: 0,
      gameRunning: false,
      gameOver: false,
      ballSpeed: INITIAL_BALL_SPEED
    }));
  };

  // Game loop
  useEffect(() => {
    if (gameState.gameRunning) {
      gameLoopRef.current = setInterval(updateGame, 16); // ~60 FPS
    } else {
      clearInterval(gameLoopRef.current);
    }
    
    return () => clearInterval(gameLoopRef.current);
  }, [gameState.gameRunning, updateGame]);

  // Event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Draw
  useEffect(() => {
    draw();
  }, [draw]);

  // Notify parent components
  useEffect(() => {
    if (onScoreUpdate) {
      onScoreUpdate(gameState.playerScore * 10); // Convert to points
    }
  }, [gameState.playerScore, onScoreUpdate]);

  useEffect(() => {
    if (onGameStateChange) {
      onGameStateChange(gameState);
    }
  }, [gameState, onGameStateChange]);

  return (
    <div className="flex flex-col items-center">
      <div className="nokia-screen bg-gray-800 p-6 rounded-lg border-4 border-gray-600 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-green-400 font-mono">🏓 PONG</h1>
          <div className="flex justify-between text-sm font-mono">
            <span>Player: {gameState.playerScore}</span>
            <span>Computer: {gameState.aiScore}</span>
          </div>
        </div>

        {/* Game Canvas */}
        <div className="relative border-2 border-gray-700 bg-green-400">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="block"
            style={{ imageRendering: 'pixelated' }}
          />
          
          {/* Game Over Overlay */}
          {gameState.gameOver && (
            <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center text-green-400">
              <div className="text-center font-mono">
                <h2 className="text-xl mb-2">GAME OVER</h2>
                <p className="mb-2">
                  {gameState.playerScore > gameState.aiScore ? 'YOU WIN!' : 'COMPUTER WINS!'}
                </p>
                <p className="mb-4">Final Score: {gameState.playerScore} - {gameState.aiScore}</p>
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
          {!gameState.gameRunning && !gameState.gameOver && (
            <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center text-green-400">
              <div className="text-center font-mono">
                <h2 className="text-xl mb-4">PONG</h2>
                <p className="mb-4 text-sm">First to 10 points wins!</p>
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

        {/* Controls */}
        <div className="mt-4 text-center">
          <div className="grid grid-cols-3 gap-2 max-w-48 mx-auto">
            <div></div>
            <button 
              className="nokia-btn text-xs"
              onMouseDown={() => setKeys(prev => ({ ...prev, up: true }))}
              onMouseUp={() => setKeys(prev => ({ ...prev, up: false }))}
              onMouseLeave={() => setKeys(prev => ({ ...prev, up: false }))}
            >
              ↑
            </button>
            <div></div>
            <div></div>
            <button 
              className="nokia-btn text-xs bg-gray-600"
              onClick={resetGame}
            >
              ⊙
            </button>
            <div></div>
            <div></div>
            <button 
              className="nokia-btn text-xs"
              onMouseDown={() => setKeys(prev => ({ ...prev, down: true }))}
              onMouseUp={() => setKeys(prev => ({ ...prev, down: false }))}
              onMouseLeave={() => setKeys(prev => ({ ...prev, down: false }))}
            >
              ↓
            </button>
            <div></div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 text-center text-green-400 font-mono text-sm max-w-md">
        <p><strong>Controls:</strong> Up/Down arrows or W/S keys</p>
        <p>Move your paddle to hit the ball back to the computer!</p>
        <p>First player to reach 10 points wins!</p>
      </div>
    </div>
  );
};

const PongGame = () => {
  return (
    <GameWrapper 
      gameId="pong-game" 
      gameName="Pong"
      GameComponent={PongGameCore}
    />
  );
};

export default PongGame;