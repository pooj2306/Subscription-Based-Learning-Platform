import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../api/authApi';
import { useAuth } from './AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginUser(form);
      const { access, refresh, role, username } = res.data;
      login(username, role, access, refresh);
      if (role === 'STUDENT') navigate('/student');
      else if (role === 'INSTRUCTOR') navigate('/instructor');
      else if (role === 'ADMIN') navigate('/admin');
    } catch (err) {
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors px-4 relative py-12">
      {/* Top Controls */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between max-w-5xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-white transition"
        >
          <span>←</span> Back to Home
        </Link>
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="p-2 rounded-xl text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block group">
            <h1 className="text-3xl font-black text-brand-600 dark:text-white tracking-tight group-hover:scale-105 transition-transform">
              SBLP
            </h1>
          </Link>
          <p className="text-gray-400 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mt-1">
            Subscription-Based Learning Platform
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[var(--bg-card)] p-8 rounded-3xl shadow-sm border border-[var(--card-border)] transition-colors"
        >
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Welcome Back</h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-6">
            Log in to continue your courses, quizzes, and learning streaks.
          </p>

          {error && (
            <p className="text-rose-600 dark:text-rose-400 text-xs font-semibold mb-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl px-3.5 py-2.5">
              {error}
            </p>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1.5">
                Username
              </label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Enter your username"
                className="w-full border border-[var(--card-border)] bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1.5">
                Password
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full border border-[var(--card-border)] bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-extrabold py-3 rounded-xl transition disabled:opacity-50 mt-6 text-xs sm:text-sm shadow-md shadow-brand-700/20 cursor-pointer"
          >
            {loading ? 'Logging in...' : 'Log In ➔'}
          </button>

          <div className="mt-6 pt-5 border-t border-[var(--card-border)] flex items-center justify-between text-xs">
            <Link to="/demo" className="text-gray-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-white font-semibold">
              ⚡ Explore Demo Mode
            </Link>
            <Link to="/register" className="text-brand-600 dark:text-brand-400 font-bold hover:underline">
              Register for Free
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}