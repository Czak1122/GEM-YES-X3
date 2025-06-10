import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AdminPanel = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [leaderboards, setLeaderboards] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const games = [
    { id: 'snake-game', name: 'Snake', icon: '🐍' },
    { id: 'tetris-game', name: 'Tetris', icon: '🧱' },
    { id: 'pong-game', name: 'Pong', icon: '🏓' }
  ];

  useEffect(() => {
    if (user?.is_admin) {
      fetchAdminData();
    }
  }, [user]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPlatformStats(),
        fetchAllUsers(),
        fetchAllLeaderboards()
      ]);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformStats = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch platform stats:', error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchAllLeaderboards = async () => {
    const leaderboardData = {};
    
    for (const game of games) {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/scores/leaderboard/${game.id}?limit=10`);
        if (response.ok) {
          const data = await response.json();
          leaderboardData[game.id] = data.leaderboard;
        }
      } catch (error) {
        console.error(`Failed to fetch leaderboard for ${game.id}:`, error);
      }
    }
    
    setLeaderboards(leaderboardData);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalHighScores = () => {
    return users.reduce((total, user) => {
      return total + Object.values(user.high_scores || {}).reduce((sum, score) => sum + score, 0);
    }, 0);
  };

  const getTopPlayers = () => {
    return users
      .map(user => ({
        ...user,
        totalScore: Object.values(user.high_scores || {}).reduce((sum, score) => sum + score, 0)
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 10);
  };

  const getMostActiveGame = () => {
    const gameTotals = {};
    games.forEach(game => {
      gameTotals[game.id] = (leaderboards[game.id] || []).length;
    });
    
    const mostActive = Object.entries(gameTotals).reduce((a, b) => 
      gameTotals[a[0]] > gameTotals[b[0]] ? a : b
    );
    
    const game = games.find(g => g.id === mostActive[0]);
    return game ? `${game.icon} ${game.name}` : 'N/A';
  };

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="nokia-screen p-8 text-center">
          <h1 className="text-2xl font-bold text-red-400 font-mono mb-4">ACCESS DENIED</h1>
          <p className="font-mono text-green-400">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="nokia-screen p-8">
          <div className="text-green-400 font-mono text-center">
            <div className="text-xl mb-4">NOKIA ADMIN</div>
            <div className="text-sm">Loading admin data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-green-400 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Admin Header */}
        <div className="nokia-screen p-6 mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold font-mono mb-2">👑 ADMIN PANEL</h1>
            <p className="font-mono opacity-80">Nokia Games Platform Administration</p>
            <p className="font-mono text-sm mt-2">Welcome, {user.username}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="nokia-screen p-4 mb-8">
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { id: 'overview', label: 'OVERVIEW', icon: '📊' },
              { id: 'users', label: 'USERS', icon: '👥' },
              { id: 'leaderboards', label: 'LEADERBOARDS', icon: '🏆' },
              { id: 'analytics', label: 'ANALYTICS', icon: '📈' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nokia-btn text-sm px-4 py-2 ${
                  activeTab === tab.id ? 'bg-green-600' : ''
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Platform Stats */}
            <div className="nokia-screen p-6">
              <h2 className="text-xl font-bold font-mono mb-4">PLATFORM OVERVIEW</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-700 rounded p-4 text-center">
                  <div className="text-2xl font-bold font-mono">{stats?.total_users || 0}</div>
                  <div className="font-mono text-xs opacity-80">TOTAL USERS</div>
                </div>
                <div className="bg-gray-700 rounded p-4 text-center">
                  <div className="text-2xl font-bold font-mono">{stats?.total_games || 0}</div>
                  <div className="font-mono text-xs opacity-80">ACTIVE GAMES</div>
                </div>
                <div className="bg-gray-700 rounded p-4 text-center">
                  <div className="text-2xl font-bold font-mono">{stats?.total_saves || 0}</div>
                  <div className="font-mono text-xs opacity-80">SAVED GAMES</div>
                </div>
                <div className="bg-gray-700 rounded p-4 text-center">
                  <div className="text-2xl font-bold font-mono">{getTotalHighScores()}</div>
                  <div className="font-mono text-xs opacity-80">TOTAL SCORE</div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="nokia-screen p-6">
                <h3 className="text-lg font-bold font-mono mb-4">TOP PLAYERS</h3>
                <div className="space-y-2">
                  {getTopPlayers().slice(0, 5).map((player, index) => (
                    <div key={player.id} className="flex justify-between items-center bg-gray-700 rounded p-2">
                      <div className="flex items-center">
                        <span className="w-6 text-xs font-mono">#{index + 1}</span>
                        <span className="font-mono">{player.username}</span>
                        {player.is_admin && <span className="ml-2 text-yellow-400">👑</span>}
                      </div>
                      <span className="font-mono font-bold">{player.totalScore}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="nokia-screen p-6">
                <h3 className="text-lg font-bold font-mono mb-4">GAME STATISTICS</h3>
                <div className="space-y-3">
                  {games.map(game => (
                    <div key={game.id} className="bg-gray-700 rounded p-3">
                      <div className="flex justify-between items-center">
                        <span className="font-mono">{game.icon} {game.name}</span>
                        <span className="font-mono font-bold">
                          {(leaderboards[game.id] || []).length} players
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 pt-3 border-t border-gray-600">
                    <div className="font-mono text-sm opacity-80">
                      Most Popular: {getMostActiveGame()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="nokia-screen p-6">
            <h2 className="text-xl font-bold font-mono mb-4">USER MANAGEMENT</h2>
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-sm">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-2">USERNAME</th>
                    <th className="text-left py-2">EMAIL</th>
                    <th className="text-left py-2">ROLE</th>
                    <th className="text-left py-2">JOINED</th>
                    <th className="text-left py-2">HIGH SCORES</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(userItem => (
                    <tr key={userItem.id} className="border-b border-gray-700">
                      <td className="py-2">
                        {userItem.username}
                        {userItem.is_admin && <span className="ml-2 text-yellow-400">👑</span>}
                      </td>
                      <td className="py-2 text-xs opacity-80">{userItem.email}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          userItem.is_admin ? 'bg-yellow-600' : 'bg-gray-600'
                        }`}>
                          {userItem.is_admin ? 'ADMIN' : 'USER'}
                        </span>
                      </td>
                      <td className="py-2 text-xs">{formatDate(userItem.created_at)}</td>
                      <td className="py-2">
                        <div className="flex gap-2 text-xs">
                          {games.map(game => (
                            <span key={game.id} title={game.name}>
                              {game.icon}: {userItem.high_scores?.[game.id] || 0}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'leaderboards' && (
          <div className="space-y-8">
            {games.map(game => (
              <div key={game.id} className="nokia-screen p-6">
                <h2 className="text-xl font-bold font-mono mb-4">
                  {game.icon} {game.name} LEADERBOARD
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full font-mono text-sm">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th className="text-left py-2">RANK</th>
                        <th className="text-left py-2">PLAYER</th>
                        <th className="text-left py-2">SCORE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(leaderboards[game.id] || []).map((entry, index) => (
                        <tr key={index} className="border-b border-gray-700">
                          <td className="py-2">
                            <span className={`${index < 3 ? 'text-yellow-400' : ''}`}>
                              #{index + 1}
                            </span>
                          </td>
                          <td className="py-2">{entry.username}</td>
                          <td className="py-2 font-bold">{entry.score}</td>
                        </tr>
                      ))}
                      {(leaderboards[game.id] || []).length === 0 && (
                        <tr>
                          <td colSpan="3" className="py-4 text-center opacity-60">
                            No scores recorded yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="nokia-screen p-6">
              <h2 className="text-xl font-bold font-mono mb-4">PLATFORM ANALYTICS</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-700 rounded p-4">
                  <h3 className="font-mono font-bold mb-3">USER ACTIVITY</h3>
                  <div className="space-y-2 text-sm font-mono">
                    <div className="flex justify-between">
                      <span>Total Registrations:</span>
                      <span>{users.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Admin Users:</span>
                      <span>{users.filter(u => u.is_admin).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Players with Scores:</span>
                      <span>{users.filter(u => Object.keys(u.high_scores || {}).length > 0).length}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700 rounded p-4">
                  <h3 className="font-mono font-bold mb-3">GAME POPULARITY</h3>
                  <div className="space-y-2 text-sm font-mono">
                    {games.map(game => (
                      <div key={game.id} className="flex justify-between">
                        <span>{game.icon} {game.name}:</span>
                        <span>{(leaderboards[game.id] || []).length} players</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-700 rounded p-4">
                  <h3 className="font-mono font-bold mb-3">SCORE DISTRIBUTION</h3>
                  <div className="space-y-2 text-sm font-mono">
                    {games.map(game => {
                      const scores = (leaderboards[game.id] || []).map(entry => entry.score);
                      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
                      const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
                      
                      return (
                        <div key={game.id}>
                          <div className="font-bold">{game.icon} {game.name}</div>
                          <div className="ml-4 space-y-1 opacity-80">
                            <div className="flex justify-between">
                              <span>Average:</span>
                              <span>{avgScore}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Highest:</span>
                              <span>{maxScore}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-gray-700 rounded p-4">
                  <h3 className="font-mono font-bold mb-3">SYSTEM STATUS</h3>
                  <div className="space-y-2 text-sm font-mono">
                    <div className="flex justify-between">
                      <span>Platform Status:</span>
                      <span className="text-green-400">🟢 ONLINE</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Database:</span>
                      <span className="text-green-400">🟢 CONNECTED</span>
                    </div>
                    <div className="flex justify-between">
                      <span>API Status:</span>
                      <span className="text-green-400">🟢 HEALTHY</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;