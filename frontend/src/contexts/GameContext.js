import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

const GameContext = createContext();

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export const GameProvider = ({ children }) => {
  const { user } = useAuth();
  const [gameStates, setGameStates] = useState({});

  const saveGameState = async (gameId, slotNumber, gameData, score, name = null) => {
    if (!user) {
      throw new Error('User must be logged in to save game state');
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/game-states/save?user_id=${user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          game_id: gameId,
          slot_number: slotNumber,
          game_data: gameData,
          score: score,
          name: name,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to save game state');
      }

      const data = await response.json();
      return { success: true, data: data.save_data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const loadGameState = async (gameId, slotNumber) => {
    if (!user) {
      throw new Error('User must be logged in to load game state');
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/game-states/${user.id}/${gameId}/${slotNumber}`);

      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: 'Save not found' };
        }
        const error = await response.json();
        throw new Error(error.detail || 'Failed to load game state');
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const getUserGameStates = async (gameId) => {
    if (!user) return { success: false, error: 'User not logged in' };

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/game-states/${user.id}/${gameId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get game states');
      }

      const data = await response.json();
      return { success: true, saves: data.saves };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const deleteGameState = async (gameId, slotNumber) => {
    if (!user) {
      throw new Error('User must be logged in to delete game state');
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/game-states/${user.id}/${gameId}/${slotNumber}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete game state');
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateHighScore = async (gameId, score) => {
    try {
      const userId = user?.id || 'demo-user';
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/scores/update?game_id=${gameId}&score=${score}&user_id=${userId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update score');
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const getLeaderboard = async (gameId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/scores/leaderboard/${gameId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get leaderboard');
      }

      const data = await response.json();
      return { success: true, leaderboard: data.leaderboard };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    saveGameState,
    loadGameState,
    getUserGameStates,
    deleteGameState,
    updateHighScore,
    getLeaderboard,
    gameStates,
    setGameStates,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};