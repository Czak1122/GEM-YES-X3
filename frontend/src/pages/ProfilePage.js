import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';

const ProfilePage = () => {
  const { user } = useAuth();
  const { getUserGameStates, deleteGameState } = useGame();
  const [savedGames, setSavedGames] = useState({});
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState({});

  const games = [
    { id: 'snake-game', name: 'Snake', icon: '🐍' },
    { id: 'tetris-game', name: 'Tetris', icon: '🧱' },
    { id: 'pong-game', name: 'Pong', icon: '🏓' }
  ];

  useEffect(() => {
    if (user) {
      fetchAllSavedGames();
    }
  }, [user]);

  const fetchAllSavedGames = async () => {
    const allSaves = {};
    
    for (const game of games) {
      try {
        const result = await getUserGameStates(game.id);
        if (result.success) {
          allSaves[game.id] = result.saves;
        }
      } catch (error) {
        console.error(`Failed to fetch saves for ${game.id}:`, error);
      }
    }
    
    setSavedGames(allSaves);
    setLoading(false);
  };

  const handleDeleteSave = async (gameId, slotNumber) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this save?');
    if (!confirmDelete) return;

    setDeleteLoading({ ...deleteLoading, [`${gameId}-${slotNumber}`]: true });

    try {
      const result = await deleteGameState(gameId, slotNumber);
      if (result.success) {
        // Refresh the saved games
        fetchAllSavedGames();
      } else {
        alert('Failed to delete save: ' + result.error);
      }
    } catch (error) {
      alert('Failed to delete save: ' + error.message);
    } finally {
      setDeleteLoading({ ...deleteLoading, [`${gameId}-${slotNumber}`]: false });
    }
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

  const getTotalHighScore = () => {
    return Object.values(user?.high_scores || {}).reduce((sum, score) => sum + score, 0);
  };

  const getTotalSaves = () => {
    return Object.values(savedGames).reduce((sum, saves) => sum + saves.length, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="nokia-screen p-8">
          <div className="text-green-400 font-mono text-center">
            <div className="text-xl mb-4">NOKIA</div>
            <div className="text-sm">Loading profile...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-green-400 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="nokia-screen p-6 mb-8">
          <div className="text-center">
            <div className="text-4xl mb-4">👤</div>
            <h1 className="text-2xl font-bold font-mono mb-2">{user?.username}</h1>
            <p className="font-mono text-sm opacity-80 mb-4">{user?.email}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-gray-700 rounded p-4">
                <div className="text-lg font-bold font-mono">{getTotalHighScore()}</div>
                <div className="font-mono text-xs opacity-80">TOTAL SCORE</div>
              </div>
              <div className="bg-gray-700 rounded p-4">
                <div className="text-lg font-bold font-mono">{getTotalSaves()}</div>
                <div className="font-mono text-xs opacity-80">SAVED GAMES</div>
              </div>
              <div className="bg-gray-700 rounded p-4">
                <div className="text-lg font-bold font-mono">
                  {user?.is_admin ? 'ADMIN' : 'PLAYER'}
                </div>
                <div className="font-mono text-xs opacity-80">ROLE</div>
              </div>
            </div>
          </div>
        </div>

        {/* High Scores */}
        <div className="nokia-screen p-6 mb-8">
          <h2 className="text-xl font-bold font-mono mb-4">HIGH SCORES</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {games.map((game) => (
              <div key={game.id} className="bg-gray-700 rounded p-4 text-center">
                <div className="text-2xl mb-2">{game.icon}</div>
                <div className="font-mono font-bold">{game.name}</div>
                <div className="text-xl font-bold font-mono mt-2">
                  {user?.high_scores?.[game.id] || 0}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Saved Games */}
        <div className="nokia-screen p-6">
          <h2 className="text-xl font-bold font-mono mb-4">SAVED GAMES</h2>
          
          {Object.keys(savedGames).length === 0 || Object.values(savedGames).every(saves => saves.length === 0) ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">💾</div>
              <p className="font-mono opacity-80">No saved games yet</p>
              <p className="font-mono text-sm opacity-60 mt-2">
                Start playing games and save your progress!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {games.map((game) => {
                const gameSaves = savedGames[game.id] || [];
                if (gameSaves.length === 0) return null;

                return (
                  <div key={game.id}>
                    <h3 className="font-mono font-bold mb-3 flex items-center">
                      <span className="mr-2">{game.icon}</span>
                      {game.name}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {gameSaves.map((save) => (
                        <div key={save.id} className="bg-gray-700 rounded p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-mono font-bold text-sm">
                                {save.name || `Slot ${save.slot_number}`}
                              </div>
                              <div className="font-mono text-xs opacity-80">
                                Slot {save.slot_number}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteSave(game.id, save.slot_number)}
                              disabled={deleteLoading[`${game.id}-${save.slot_number}`]}
                              className="text-red-400 hover:text-red-300 text-sm"
                              title="Delete save"
                            >
                              {deleteLoading[`${game.id}-${save.slot_number}`] ? '...' : '🗑️'}
                            </button>
                          </div>
                          
                          <div className="space-y-1 text-xs font-mono">
                            <div>Score: <span className="text-yellow-400">{save.score}</span></div>
                            <div>Saved: {formatDate(save.saved_at)}</div>
                          </div>
                          
                          <button
                            onClick={() => window.location.href = `/games/${game.name.toLowerCase()}?load=${save.slot_number}`}
                            className="w-full mt-3 nokia-btn text-xs py-1"
                          >
                            LOAD GAME
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;