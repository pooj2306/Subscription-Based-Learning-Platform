import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../api/authApi';
import { useAuth } from './AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-brand-600 tracking-tight">SBLP</h1>
          <p className="text-gray-400 text-sm mt-1">Subscription-Based Learning Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Welcome back</h2>

          {error && (
            <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input
            name="username" value={form.username} onChange={handleChange}
            className="w-full border border-gray-200 p-2.5 rounded-lg mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            required
          />

          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            name="password" type="password" value={form.password} onChange={handleChange}
            className="w-full border border-gray-200 p-2.5 rounded-lg mb-6 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            required
          />

          <button
            type="submit" disabled={loading}
            className="w-full bg-brand-600 text-white font-semibold py-2.5 rounded-lg hover:bg-brand-700 transition disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <p className="text-sm text-center text-gray-500 mt-5">
            Don't have an account? <Link to="/register" className="text-brand-600 font-medium">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
}