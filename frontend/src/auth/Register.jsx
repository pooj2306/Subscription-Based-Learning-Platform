import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../api/authApi';
import { useTheme } from '../context/ThemeContext';

export default function Register() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [form, setForm] = useState({
    username: '',
    email: '',
    mobile_number: '',
    role: 'STUDENT',
    password: '',
    password2: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerUser(form);
      navigate('/login');
    } catch (err) {
      const data = err.response?.data;
      const message = data ? Object.values(data).flat().join(' ') : 'Registration failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors px-4 py-12 relative">
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
            Create Your Account
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[var(--bg-card)] p-8 rounded-3xl shadow-sm border border-[var(--card-border)] transition-colors"
        >
          <div className="mb-6">
            <h2 className="text-xl font-black text-gray-900 dark:text-white">Register for Free</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Start your self-paced learning journey with full course tracking.
            </p>
          </div>

          {error && (
            <p className="text-rose-600 dark:text-rose-400 text-xs font-semibold mb-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl px-3.5 py-2.5">
              {error}
            </p>
          )}

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1">
                Username *
              </label>
              <input
                name="username"
                placeholder="Choose username"
                value={form.username}
                onChange={handleChange}
                className="w-full border border-[var(--card-border)] bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1">
                Email Address *
              </label>
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-[var(--card-border)] bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1">
                Mobile Number
              </label>
              <input
                name="mobile_number"
                placeholder="e.g. +91 9876543210"
                value={form.mobile_number}
                onChange={handleChange}
                className="w-full border border-[var(--card-border)] bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1">
                Role *
              </label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full border border-[var(--card-border)] bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="STUDENT">Student</option>
                <option value="INSTRUCTOR">Instructor</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1">
                Password *
              </label>
              <input
                name="password"
                type="password"
                placeholder="Create password"
                value={form.password}
                onChange={handleChange}
                className="w-full border border-[var(--card-border)] bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-200 mb-1">
                Confirm Password *
              </label>
              <input
                name="password2"
                type="password"
                placeholder="Confirm password"
                value={form.password2}
                onChange={handleChange}
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
            {loading ? 'Creating account...' : 'Register for Free ➔'}
          </button>

          <p className="text-xs text-center text-gray-500 dark:text-slate-400 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 dark:text-brand-400 font-bold hover:underline">
              Log In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}