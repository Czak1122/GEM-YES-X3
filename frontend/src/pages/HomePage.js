import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchPlatformStats();
  }, []);

  const fetchPlatformStats = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const games = [
    {
      id: 'snake',
      name: 'Snake',
      description: 'Classic Nokia Snake game. Eat food and grow!',
      icon: '🐍',
      difficulty: 'Easy',
      path: '/games/snake'
    },
    {
      id: 'tetris',
      name: 'Tetris',
      description: 'Stack falling blocks to clear lines!',
      icon: '🧱',
      difficulty: 'Medium',
      path: '/games/tetris'
    },
    {
      id: 'pong',
      name: 'Pong',
      description: 'Classic paddle ball game!',
      icon: '🏓',
      difficulty: 'Easy',
      path: '/games/pong'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-green-400">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="nokia-screen mx-auto mb-8 p-8 max-w-2xl">
              <h1 className="text-4xl md:text-6xl font-bold font-mono mb-4">
                📱 NOKIA
              </h1>
              <h2 className="text-xl md:text-2xl font-mono mb-4">
                GAMES PLATFORM
              </h2>
              <p className="text-sm md:text-base font-mono opacity-80 mb-6">
                Experience classic retro games with authentic Nokia styling
              </p>
              
              {user ? (
                <div className="space-y-4">
                  <p className="font-mono text-sm">
                    Welcome back, {user.username}!
                  </p>
                  <Link
                    to="/games"
                    className="nokia-btn inline-block px-6 py-3 text-base"
                  >
                    PLAY GAMES
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="font-mono text-sm mb-4">
                    Join the retro gaming revolution
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      to="/register"
                      className="nokia-btn px-6 py-3 text-base"
                    >
                      REGISTER
                    </Link>
                    <Link
                      to="/login"
                      className="nokia-btn px-6 py-3 text-base"
                    >
                      LOGIN
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Featured Games */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold font-mono mb-4">FEATURED GAMES</h2>
          <p className="font-mono opacity-80">Classic retro games reimagined</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {games.map((game) => (
            <div key={game.id} className="nokia-screen p-6">
              <div className="text-center">
                <div className="text-4xl mb-4">{game.icon}</div>
                <h3 className="text-xl font-bold font-mono mb-2">{game.name}</h3>
                <p className="font-mono text-sm opacity-80 mb-4">{game.description}</p>
                <div className="mb-4">
                  <span className="font-mono text-xs bg-gray-700 px-2 py-1 rounded">
                    {game.difficulty}
                  </span>
                </div>
                <Link
                  to={game.path}
                  className="nokia-btn inline-block px-4 py-2 text-sm"
                >
                  PLAY NOW
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Stats */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-mono mb-4">PLATFORM STATS</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="nokia-screen p-6 text-center">
              <div className="text-2xl font-bold font-mono mb-2">
                {stats.total_users}
              </div>
              <div className="font-mono text-sm opacity-80">PLAYERS</div>
            </div>
            <div className="nokia-screen p-6 text-center">
              <div className="text-2xl font-bold font-mono mb-2">
                {stats.total_games}
              </div>
              <div className="font-mono text-sm opacity-80">GAMES</div>
            </div>
            <div className="nokia-screen p-6 text-center">
              <div className="text-2xl font-bold font-mono mb-2">
                {stats.total_saves}
              </div>
              <div className="font-mono text-sm opacity-80">SAVED GAMES</div>
            </div>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold font-mono mb-4">FEATURES</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="nokia-screen p-4 text-center">
            <div className="text-2xl mb-2">💾</div>
            <div className="font-mono text-sm font-bold mb-1">SAVE STATES</div>
            <div className="font-mono text-xs opacity-80">10 save slots per game</div>
          </div>
          <div className="nokia-screen p-4 text-center">
            <div className="text-2xl mb-2">🏆</div>
            <div className="font-mono text-sm font-bold mb-1">LEADERBOARDS</div>
            <div className="font-mono text-xs opacity-80">Compete for high scores</div>
          </div>
          <div className="nokia-screen p-4 text-center">
            <div className="text-2xl mb-2">📱</div>
            <div className="font-mono text-sm font-bold mb-1">RETRO STYLE</div>
            <div className="font-mono text-xs opacity-80">Authentic Nokia look</div>
          </div>
          <div className="nokia-screen p-4 text-center">
            <div className="text-2xl mb-2">🎮</div>
            <div className="font-mono text-sm font-bold mb-1">MULTIPLE GAMES</div>
            <div className="font-mono text-xs opacity-80">Growing game library</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;