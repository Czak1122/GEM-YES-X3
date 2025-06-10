import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';

const GameWrapper = ({ gameId, gameName, GameComponent }) => {
  const { user } = useAuth();
  const { saveGameState, loadGameState, getUserGameStates, updateHighScore } = useGame();
  const [currentScore, setCurrentScore] = useState(0);
  const [gameState, setGameState] = useState(null);
  const [savedSlots, setSavedSlots] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [saveSlot, setSaveSlot] = useState(1);
  const [saveName, setSaveName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSavedSlots();
    }
  }, [user]);

  useEffect(() => {
    // Update high score when game ends
    if (currentScore > 0) {
      updateHighScore(gameId, currentScore);
    }
  }, [currentScore, gameId, updateHighScore]);

  const fetchSavedSlots = async () => {
    if (!user) return;
    
    try {
      const result = await getUserGameStates(gameId);
      if (result.success) {
        setSavedSlots(result.saves);
      }
    } catch (error) {
      console.error('Failed to fetch saved slots:', error);
    }
  };

  const handleSaveGame = async () => {
    if (!user || !gameState) {
      alert('You must be logged in to save games');
      return;
    }

    setLoading(true);
    try {
      const result = await saveGameState(
        gameId, 
        saveSlot, 
        gameState, 
        currentScore, 
        saveName || `Save Slot ${saveSlot}`
      );
      
      if (result.success) {
        alert('Game saved successfully!');
        setShowSaveModal(false);
        setSaveName('');
        fetchSavedSlots();
      } else {
        alert('Failed to save game: ' + result.error);
      }
    } catch (error) {
      alert('Failed to save game: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadGame = async (slotNumber) => {
    if (!user) {
      alert('You must be logged in to load games');
      return;
    }

    setLoading(true);
    try {
      const result = await loadGameState(gameId, slotNumber);
      if (result.success) {
        // This would need to be implemented in each game component
        // For now, we'll just show success
        alert('Game loaded successfully! Please implement game loading in the game component.');
        setShowLoadModal(false);
      } else {
        alert('Failed to load game: ' + result.error);
      }
    } catch (error) {
      alert('Failed to load game: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-green-400 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-mono mb-4">{gameName}</h1>
          <div className="flex justify-center space-x-4 mb-4">
            <Link to="/games" className="nokia-btn text-sm px-4 py-2">
              ← BACK TO GAMES
            </Link>
            {user && (
              <>
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="nokia-btn text-sm px-4 py-2"
                  disabled={!gameState}
                >
                  💾 SAVE GAME
                </button>
                <button
                  onClick={() => setShowLoadModal(true)}
                  className="nokia-btn text-sm px-4 py-2"
                >
                  📁 LOAD GAME
                </button>
              </>
            )}
          </div>
          {!user && (
            <p className="font-mono text-sm opacity-80">
              <Link to="/login" className="text-green-400 hover:underline">Login</Link> to save your progress
            </p>
          )}
        </div>

        {/* Game Component */}
        <div className="flex justify-center">
          <GameComponent 
            onScoreUpdate={setCurrentScore}
            onGameStateChange={setGameState}
          />
        </div>

        {/* Current Score Display */}
        <div className="text-center mt-6">
          <div className="nokia-screen inline-block p-4">
            <div className="font-mono">
              Current Score: <span className="text-yellow-400 font-bold">{currentScore}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Game Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="nokia-screen p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-bold font-mono mb-4">SAVE GAME</h2>
            
            <div className="mb-4">
              <label className="block font-mono text-sm mb-2">SLOT (1-10)</label>
              <select
                value={saveSlot}
                onChange={(e) => setSaveSlot(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded font-mono text-green-400"
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Slot {i + 1}
                    {savedSlots.find(s => s.slot_number === i + 1) && ' (Occupied)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block font-mono text-sm mb-2">SAVE NAME (Optional)</label>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder={`Save Slot ${saveSlot}`}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded font-mono text-green-400"
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleSaveGame}
                disabled={loading}
                className="flex-1 nokia-btn py-2"
              >
                {loading ? 'SAVING...' : 'SAVE'}
              </button>
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 nokia-btn py-2 bg-gray-600"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Game Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="nokia-screen p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-bold font-mono mb-4">LOAD GAME</h2>
            
            {savedSlots.length === 0 ? (
              <div className="text-center py-4">
                <p className="font-mono opacity-80">No saved games found</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {savedSlots.map((save) => (
                  <div key={save.id} className="bg-gray-700 rounded p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-mono font-bold text-sm">
                          {save.name || `Slot ${save.slot_number}`}
                        </div>
                        <div className="font-mono text-xs opacity-80">
                          Score: {save.score} • {formatDate(save.saved_at)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleLoadGame(save.slot_number)}
                        disabled={loading}
                        className="nokia-btn text-xs px-3 py-1"
                      >
                        LOAD
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4">
              <button
                onClick={() => setShowLoadModal(false)}
                className="w-full nokia-btn py-2 bg-gray-600"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameWrapper;