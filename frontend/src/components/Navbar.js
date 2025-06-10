import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-800 border-b-2 border-green-400 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-green-400 font-bold text-xl font-mono">
              📱 NOKIA GAMES
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className={`font-mono transition-colors ${
                isActive('/') 
                  ? 'text-green-400' 
                  : 'text-gray-300 hover:text-green-400'
              }`}
            >
              HOME
            </Link>
            <Link
              to="/games"
              className={`font-mono transition-colors ${
                isActive('/games') 
                  ? 'text-green-400' 
                  : 'text-gray-300 hover:text-green-400'
              }`}
            >
              GAMES
            </Link>
            
            {user ? (
              <>
                <Link
                  to="/profile"
                  className={`font-mono transition-colors ${
                    isActive('/profile') 
                      ? 'text-green-400' 
                      : 'text-gray-300 hover:text-green-400'
                  }`}
                >
                  PROFILE
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`font-mono transition-colors ${
                      isActive('/admin') 
                        ? 'text-green-400' 
                        : 'text-gray-300 hover:text-green-400'
                    }`}
                  >
                    ADMIN
                  </Link>
                )}
                <div className="flex items-center space-x-4">
                  <span className="text-green-400 font-mono text-sm">
                    {user.username}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="nokia-btn text-xs px-3 py-1"
                  >
                    LOGOUT
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="nokia-btn text-xs px-3 py-1"
                >
                  LOGIN
                </Link>
                <Link
                  to="/register"
                  className="nokia-btn text-xs px-3 py-1"
                >
                  REGISTER
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="nokia-btn text-sm"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-2">
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className={`font-mono text-sm px-2 py-1 transition-colors ${
                  isActive('/') 
                    ? 'text-green-400' 
                    : 'text-gray-300 hover:text-green-400'
                }`}
              >
                HOME
              </Link>
              <Link
                to="/games"
                onClick={() => setIsMenuOpen(false)}
                className={`font-mono text-sm px-2 py-1 transition-colors ${
                  isActive('/games') 
                    ? 'text-green-400' 
                    : 'text-gray-300 hover:text-green-400'
                }`}
              >
                GAMES
              </Link>
              
              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className={`font-mono text-sm px-2 py-1 transition-colors ${
                      isActive('/profile') 
                        ? 'text-green-400' 
                        : 'text-gray-300 hover:text-green-400'
                    }`}
                  >
                    PROFILE
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className={`font-mono text-sm px-2 py-1 transition-colors ${
                        isActive('/admin') 
                          ? 'text-green-400' 
                          : 'text-gray-300 hover:text-green-400'
                      }`}
                    >
                      ADMIN
                    </Link>
                  )}
                  <div className="px-2 py-1">
                    <span className="text-green-400 font-mono text-sm">
                      {user.username}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="nokia-btn text-xs px-3 py-1 mx-2"
                  >
                    LOGOUT
                  </button>
                </>
              ) : (
                <div className="flex space-x-2 px-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="nokia-btn text-xs px-3 py-1"
                  >
                    LOGIN
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="nokia-btn text-xs px-3 py-1"
                  >
                    REGISTER
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;