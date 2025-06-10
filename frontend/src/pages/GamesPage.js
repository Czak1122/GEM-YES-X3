import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';

const GamesPage = () => {
  const { user } = useAuth();
  const { getLeaderboard } = useGame();
  const [leaderboards, setLeaderboards] = useState({});
  const [loading, setLoading] = useState(true);

  const games = [
    {
      id: 'snake-game',
      name: 'Snake',
      description: 'Classic Nokia Snake game. Navigate the snake to eat food and grow longer without hitting walls or yourself.',
      icon: '🐍',
      difficulty: 'Easy',
      path: '/games/snake',
      controls: 'Arrow Keys / On-screen buttons',
      tips: 'Start slow, plan your moves ahead!'
    },
    {
      id: 'tetris-game',
      name: 'Tetris',
      description: 'Stack falling tetromino pieces to clear horizontal lines. Classic puzzle gameplay!',
      icon: '🧱',
      difficulty: 'Medium',
      path: '/games/tetris',
      controls: 'Arrow Keys / WASD',
      tips: 'Keep the stack low, clear multiple lines!'
    },
    {
      id: 'pong-game',
      name: 'Pong',
      description: 'Classic paddle ball game. Control your paddle to hit the ball past your opponent.',
      icon: '🏓',
      difficulty: 'Easy',
      path: '/games/pong',
      controls: 'Up/Down arrows or W/S',
      tips: 'Predict ball movement, control the angle!'
    }
  ];

  useEffect(() => {
    fetchAllLeaderboards();
  }, []);

  const fetchAllLeaderboards = async () => {
    const leaderboardData = {};
    
    for (const game of games) {
      try {
        const result = await getLeaderboard(game.id);
        if (result.success) {
          leaderboardData[game.id] = result.leaderboard.slice(0, 5); // Top 5
        }
      } catch (error) {
        console.error(`Failed to fetch leaderboard for ${game.id}:`, error);
      }
    }
    
    setLeaderboards(leaderboardData);
    setLoading(false);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-400';
      case 'Medium': return 'text-yellow-400';
      case 'Hard': return 'text-red-400';
      default: return 'text-green-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-green-400 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-mono mb-4">GAME LIBRARY</h1>
          <p className="font-mono opacity-80">Choose your retro adventure</p>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-16">
          {games.map((game) => (
            <div key={game.id} className="nokia-screen p-6">
              <div className="flex flex-col h-full">
                {/* Game Header */}
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">{game.icon}</div>
                  <h2 className="text-xl font-bold font-mono mb-2">{game.name}</h2>
                  <span className={`font-mono text-xs px-2 py-1 rounded bg-gray-700 ${getDifficultyColor(game.difficulty)}`}>
                    {game.difficulty}
                  </span>
                </div>

                {/* Game Info */}
                <div className="flex-grow mb-4">
                  <p className="font-mono text-sm opacity-80 mb-4">{game.description}</p>
                  
                  <div className="space-y-2 text-xs font-mono">
                    <div>
                      <span className="opacity-60">Controls: </span>
                      <span>{game.controls}</span>
                    </div>
                    <div>
                      <span className="opacity-60">Tip: </span>
                      <span>{game.tips}</span>
                    </div>
                  </div>
                </div>

                {/* Leaderboard Preview */}
                <div className="mb-4">
                  <h3 className="font-mono text-sm font-bold mb-2">TOP SCORES</h3>
                  <div className="bg-gray-700 rounded p-2">
                    {loading ? (
                      <div className="text-xs font-mono opacity-60">Loading...</div>
                    ) : leaderboards[game.id] && leaderboards[game.id].length > 0 ? (
                      <div className="space-y-1">
                        {leaderboards[game.id].slice(0, 3).map((entry, index) => (
                          <div key={index} className="flex justify-between text-xs font-mono">
                            <span>{index + 1}. {entry.username}</span>
                            <span>{entry.score}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs font-mono opacity-60">No scores yet</div>
                    )}
                  </div>
                </div>

                {/* Play Button */}
                <Link
                  to={game.path}
                  className="nokia-btn text-center py-3 text-base font-bold"
                >
                  PLAY {game.name.toUpperCase()}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* User Stats */}
        {user && (
          <div className="nokia-screen p-6 mb-8">
            <h2 className="text-xl font-bold font-mono mb-4 text-center">YOUR STATS</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {games.map((game) => (
                <div key={game.id} className="bg-gray-700 rounded p-4 text-center">
                  <div className="text-lg mb-1">{game.icon}</div>
                  <div className="font-mono text-sm font-bold">{game.name}</div>
                  <div className="font-mono text-xs opacity-80">
                    High Score: {user.high_scores?.[game.id] || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Global Leaderboards */}
        <div className="nokia-screen p-6">
          <h2 className="text-xl font-bold font-mono mb-6 text-center">GLOBAL LEADERBOARDS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {games.map((game) => (
              <div key={game.id}>
                <h3 className="font-mono font-bold mb-3 text-center">
                  {game.icon} {game.name}
                </h3>
                <div className="bg-gray-700 rounded p-4">
                  {loading ? (
                    <div className="text-center font-mono text-sm opacity-60">Loading...</div>
                  ) : leaderboards[game.id] && leaderboards[game.id].length > 0 ? (
                    <div className="space-y-2">
                      {leaderboards[game.id].map((entry, index) => (
                        <div key={index} className="flex justify-between items-center font-mono text-sm">
                          <div className="flex items-center">
                            <span className="w-6 text-xs opacity-60">#{index + 1}</span>
                            <span className={index < 3 ? 'text-yellow-400' : ''}>{entry.username}</span>
                          </div>
                          <span className="font-bold">{entry.score}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center font-mono text-sm opacity-60">
                      No scores yet.<br />Be the first to play!
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {!user && (
          <div className="mt-8 text-center">
            <div className="nokia-screen p-6 max-w-md mx-auto">
              <h3 className="font-mono font-bold mb-4">JOIN THE COMPETITION!</h3>
              <p className="font-mono text-sm opacity-80 mb-4">
                Register to save your progress and compete on leaderboards
              </p>
              <div className="flex gap-4 justify-center">
                <Link to="/register" className="nokia-btn px-4 py-2 text-sm">
                  REGISTER
                </Link>
                <Link to="/login" className="nokia-btn px-4 py-2 text-sm">
                  LOGIN
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GamesPage;