import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
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

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 3) {
      setError('Password must be at least 3 characters long');
      return;
    }

    setLoading(true);

    try {
      const result = await register(formData.username, formData.email, formData.password);
      if (result.success) {
        navigate('/games');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
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
            <h2 className="text-lg font-mono text-green-400">REGISTER</h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded font-mono text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block font-mono text-sm text-green-400 mb-2">
                USERNAME
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded font-mono text-green-400 focus:outline-none focus:border-green-400"
                placeholder="Choose a username"
              />
            </div>

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
                placeholder="Create a password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block font-mono text-sm text-green-400 mb-2">
                CONFIRM PASSWORD
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded font-mono text-green-400 focus:outline-none focus:border-green-400"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full nokia-btn py-3 text-base font-bold disabled:opacity-50"
            >
              {loading ? 'REGISTERING...' : 'REGISTER'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="font-mono text-sm text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-green-400 hover:underline">
                Login here
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

export default RegisterPage;