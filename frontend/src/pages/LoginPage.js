import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        navigate('/games');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="nokia-screen p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold font-mono text-green-400 mb-2">
              📱 NOKIA GAMES
            </h1>
            <h2 className="text-lg font-mono text-green-400">LOGIN</h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded font-mono text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block font-mono text-sm text-green-400 mb-2">
                EMAIL
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded font-mono text-green-400 focus:outline-none focus:border-green-400"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block font-mono text-sm text-green-400 mb-2">
                PASSWORD
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded font-mono text-green-400 focus:outline-none focus:border-green-400"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full nokia-btn py-3 text-base font-bold disabled:opacity-50"
            >
              {loading ? 'LOGGING IN...' : 'LOGIN'}
            </button>
          </form>

          {/* Quick Login */}
          <div className="mt-6 p-4 bg-gray-700 rounded">
            <h3 className="font-mono text-sm text-green-400 mb-3">QUICK LOGIN</h3>
            <div className="space-y-2">
              <button
                onClick={() => setFormData({ email: 'admin@nokia.com', password: 'admin123' })}
                className="w-full text-left font-mono text-xs text-gray-300 hover:text-green-400 transition-colors"
              >
                👑 Admin: admin@nokia.com / admin123
              </button>
              <button
                onClick={() => setFormData({ email: 'demo@nokia.com', password: 'demo' })}
                className="w-full text-left font-mono text-xs text-gray-300 hover:text-green-400 transition-colors"
              >
                🎮 Demo: demo@nokia.com / demo
              </button>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="font-mono text-sm text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-green-400 hover:underline">
                Register here
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-4 text-center">
            <Link to="/" className="font-mono text-sm text-gray-400 hover:text-green-400">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;