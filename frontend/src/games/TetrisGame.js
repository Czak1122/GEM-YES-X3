import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameWrapper from '../components/GameWrapper';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 20;

// Tetris pieces
const TETRIS_PIECES = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  O: [
    [1, 1],
    [1, 1]
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0]
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0]
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
  ]
};

const PIECE_NAMES = Object.keys(TETRIS_PIECES);

const TetrisGameCore = ({ onScoreUpdate, onGameStateChange }) => {
  const canvasRef = useRef(null);
  const [board, setBoard] = useState(() => 
    Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0))
  );
  const [currentPiece, setCurrentPiece] = useState(null);
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });
  const [nextPiece, setNextPiece] = useState(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameRunning, setGameRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [dropTime, setDropTime] = useState(1000);

  const gameLoopRef = useRef();

  // Generate random piece
  const generateRandomPiece = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * PIECE_NAMES.length);
    const pieceName = PIECE_NAMES[randomIndex];
    return {
      shape: TETRIS_PIECES[pieceName],
      type: pieceName
    };
  }, []);

  // Initialize game
  const initializeGame = useCallback(() => {
    const newPiece = generateRandomPiece();
    const next = generateRandomPiece();
    setCurrentPiece(newPiece);
    setNextPiece(next);
    setCurrentPosition({ x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 });
  }, [generateRandomPiece]);

  // Check if position is valid
  const isValidPosition = useCallback((piece, pos, board) => {
    if (!piece) return false;
    
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = pos.x + x;
          const newY = pos.y + y;
          
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return false;
          }
          
          if (newY >= 0 && board[newY][newX]) {
            return false;
          }
        }
      }
    }
    return true;
  }, []);

  // Rotate piece
  const rotatePiece = useCallback((piece) => {
    const rotated = piece.shape[0].map((_, index) =>
      piece.shape.map(row => row[index]).reverse()
    );
    return { ...piece, shape: rotated };
  }, []);

  // Place piece on board
  const placePiece = useCallback((piece, pos, board) => {
    const newBoard = board.map(row => [...row]);
    
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardY = pos.y + y;
          const boardX = pos.x + x;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = 1;
          }
        }
      }
    }
    return newBoard;
  }, []);

  // Clear completed lines
  const clearLines = useCallback((board) => {
    const newBoard = board.filter(row => row.some(cell => cell === 0));
    const linesCleared = BOARD_HEIGHT - newBoard.length;
    
    // Add empty rows at the top
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(0));
    }
    
    return { newBoard, linesCleared };
  }, []);

  // Move piece
  const movePiece = useCallback((dx, dy) => {
    if (!currentPiece || !gameRunning) return;
    
    const newPosition = { x: currentPosition.x + dx, y: currentPosition.y + dy };
    
    if (isValidPosition(currentPiece, newPosition, board)) {
      setCurrentPosition(newPosition);
    } else if (dy > 0) {
      // Piece can't move down, place it
      const newBoard = placePiece(currentPiece, currentPosition, board);
      const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);
      
      setBoard(clearedBoard);
      setLines(prev => prev + linesCleared);
      setScore(prev => prev + linesCleared * 100 * level + 10);
      
      // Check game over
      if (currentPosition.y <= 0) {
        setGameRunning(false);
        setGameOver(true);
        return;
      }
      
      // Get next piece
      setCurrentPiece(nextPiece);
      setNextPiece(generateRandomPiece());
      setCurrentPosition({ x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 });
    }
  }, [currentPiece, currentPosition, board, gameRunning, placePiece, clearLines, level, nextPiece, generateRandomPiece, isValidPosition]);

  // Rotate current piece
  const rotatePieceHandler = useCallback(() => {
    if (!currentPiece || !gameRunning) return;
    
    const rotated = rotatePiece(currentPiece);
    if (isValidPosition(rotated, currentPosition, board)) {
      setCurrentPiece(rotated);
    }
  }, [currentPiece, currentPosition, board, gameRunning, rotatePiece, isValidPosition]);

  // Drop piece instantly
  const dropPiece = useCallback(() => {
    if (!currentPiece || !gameRunning) return;
    
    let newY = currentPosition.y;
    while (isValidPosition(currentPiece, { x: currentPosition.x, y: newY + 1 }, board)) {
      newY++;
    }
    setCurrentPosition(prev => ({ ...prev, y: newY }));
    movePiece(0, 1); // This will place the piece
  }, [currentPiece, currentPosition, board, gameRunning, movePiece, isValidPosition]);

  // Handle keyboard input
  const handleKeyPress = useCallback((e) => {
    if (!gameRunning) return;
    
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        movePiece(-1, 0);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        movePiece(1, 0);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        movePiece(0, 1);
        break;
      case 'ArrowUp':
      case 'w':
      case 'W':
      case ' ':
        rotatePieceHandler();
        break;
      case 'Enter':
        dropPiece();
        break;
      default:
        break;
    }
  }, [gameRunning, movePiece, rotatePieceHandler, dropPiece]);

  // Game loop
  useEffect(() => {
    if (gameRunning) {
      gameLoopRef.current = setInterval(() => {
        movePiece(0, 1);
      }, dropTime);
    } else {
      clearInterval(gameLoopRef.current);
    }
    
    return () => clearInterval(gameLoopRef.current);
  }, [gameRunning, movePiece, dropTime]);

  // Update level and speed based on lines cleared
  useEffect(() => {
    const newLevel = Math.floor(lines / 10) + 1;
    if (newLevel !== level) {
      setLevel(newLevel);
      setDropTime(Math.max(100, 1000 - (newLevel - 1) * 100));
    }
  }, [lines, level]);

  // Draw game
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#9BBB0F';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = '#8BAD0F';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, BOARD_HEIGHT * CELL_SIZE);
      ctx.stroke();
    }
    
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(BOARD_WIDTH * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }

    // Draw placed pieces
    ctx.fillStyle = '#2C5234';
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (board[y][x]) {
          ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
        }
      }
    }

    // Draw current piece
    if (currentPiece) {
      ctx.fillStyle = '#1A3320';
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const drawX = (currentPosition.x + x) * CELL_SIZE;
            const drawY = (currentPosition.y + y) * CELL_SIZE;
            if (drawY >= 0) {
              ctx.fillRect(drawX + 1, drawY + 1, CELL_SIZE - 2, CELL_SIZE - 2);
            }
          }
        }
      }
    }
  }, [board, currentPiece, currentPosition]);

  // Start game
  const startGame = () => {
    setBoard(Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0)));
    setScore(0);
    setLines(0);
    setLevel(1);
    setDropTime(1000);
    setGameRunning(true);
    setGameOver(false);
    initializeGame();
  };

  // Reset game
  const resetGame = () => {
    setBoard(Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0)));
    setCurrentPiece(null);
    setNextPiece(null);
    setCurrentPosition({ x: 0, y: 0 });
    setScore(0);
    setLines(0);
    setLevel(1);
    setDropTime(1000);
    setGameRunning(false);
    setGameOver(false);
  };

  // Get game state for saving
  const getGameState = useCallback(() => {
    return {
      board,
      currentPiece,
      currentPosition,
      nextPiece,
      score,
      lines,
      level,
      gameRunning,
      gameOver
    };
  }, [board, currentPiece, currentPosition, nextPiece, score, lines, level, gameRunning, gameOver]);

  // Notify parent components
  useEffect(() => {
    if (onScoreUpdate) {
      onScoreUpdate(score);
    }
  }, [score, onScoreUpdate]);

  useEffect(() => {
    if (onGameStateChange) {
      onGameStateChange(getGameState());
    }
  }, [getGameState, onGameStateChange]);

  // Event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Draw
  useEffect(() => {
    draw();
  }, [draw]);

  // Initialize on mount
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  return (
    <div className="flex flex-col items-center">
      <div className="nokia-screen bg-gray-800 p-6 rounded-lg border-4 border-gray-600 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-green-400 font-mono">🧱 TETRIS</h1>
          <div className="grid grid-cols-3 gap-4 text-sm font-mono mt-2">
            <div>Score: {score}</div>
            <div>Lines: {lines}</div>
            <div>Level: {level}</div>
          </div>
        </div>

        {/* Game Area */}
        <div className="flex gap-4">
          {/* Main Game Board */}
          <div className="relative border-2 border-gray-700 bg-green-400">
            <canvas
              ref={canvasRef}
              width={BOARD_WIDTH * CELL_SIZE}
              height={BOARD_HEIGHT * CELL_SIZE}
              className="block"
              style={{ imageRendering: 'pixelated' }}
            />
            
            {/* Game Over Overlay */}
            {gameOver && (
              <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center text-green-400">
                <div className="text-center font-mono">
                  <h2 className="text-xl mb-2">GAME OVER</h2>
                  <p className="mb-2">Score: {score}</p>
                  <p className="mb-4">Lines: {lines}</p>
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
                  <h2 className="text-xl mb-4">TETRIS</h2>
                  <p className="mb-4 text-sm">Stack blocks to clear lines!</p>
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

          {/* Next Piece Preview */}
          <div className="nokia-screen bg-gray-700 p-4 w-24">
            <div className="text-center font-mono text-xs mb-2">NEXT</div>
            <div className="w-16 h-16 border border-gray-600 bg-green-400 relative">
              {nextPiece && (
                <canvas
                  width={64}
                  height={64}
                  ref={(canvas) => {
                    if (canvas && nextPiece) {
                      const ctx = canvas.getContext('2d');
                      ctx.fillStyle = '#9BBB0F';
                      ctx.fillRect(0, 0, 64, 64);
                      
                      ctx.fillStyle = '#2C5234';
                      const offsetX = (4 - nextPiece.shape[0].length) * 4;
                      const offsetY = (4 - nextPiece.shape.length) * 4;
                      
                      for (let y = 0; y < nextPiece.shape.length; y++) {
                        for (let x = 0; x < nextPiece.shape[y].length; x++) {
                          if (nextPiece.shape[y][x]) {
                            ctx.fillRect(
                              offsetX + x * 8 + 1, 
                              offsetY + y * 8 + 1, 
                              6, 
                              6
                            );
                          }
                        }
                      }
                    }
                  }}
                  style={{ imageRendering: 'pixelated' }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 text-center">
          <div className="grid grid-cols-4 gap-2 max-w-64 mx-auto">
            <button className="nokia-btn text-xs" onClick={() => rotatePieceHandler()}>
              ↻
            </button>
            <button className="nokia-btn text-xs" onClick={() => movePiece(-1, 0)}>
              ←
            </button>
            <button className="nokia-btn text-xs" onClick={() => movePiece(1, 0)}>
              →
            </button>
            <button className="nokia-btn text-xs" onClick={() => movePiece(0, 1)}>
              ↓
            </button>
            <button 
              className="nokia-btn text-xs col-span-2" 
              onClick={dropPiece}
            >
              DROP
            </button>
            <button 
              className="nokia-btn text-xs col-span-2 bg-gray-600" 
              onClick={resetGame}
            >
              RESET
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 text-center text-green-400 font-mono text-sm max-w-md">
        <p><strong>Controls:</strong> Arrow keys or WASD to move, Space/W to rotate, Enter to drop</p>
        <p>Clear horizontal lines to score points!</p>
      </div>
    </div>
  );
};

const TetrisGame = () => {
  return (
    <GameWrapper 
      gameId="tetris-game" 
      gameName="Tetris"
      GameComponent={TetrisGameCore}
    />
  );
};

export default TetrisGame;