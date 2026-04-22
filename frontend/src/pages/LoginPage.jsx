import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1d21]">
      <div className="w-full max-w-md bg-[#222529] rounded-lg p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-2">Sign in to NotifyAI</h1>
        <p className="text-gray-400 mb-6 text-sm">Your AI-powered team workspace</p>

        {error && (
          <div className="bg-red-900/40 border border-red-600 text-red-300 text-sm rounded px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              name="email" type="email" required autoComplete="email"
              value={form.email} onChange={handleChange}
              className="w-full bg-[#1a1d21] border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#4a9eff] focus:ring-1 focus:ring-[#4a9eff]"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              name="password" type="password" required autoComplete="current-password"
              value={form.password} onChange={handleChange}
              className="w-full bg-[#1a1d21] border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#4a9eff] focus:ring-1 focus:ring-[#4a9eff]"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-[#4a9eff] hover:bg-[#3a8eef] disabled:opacity-50 text-white font-medium rounded py-2 transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          New to NotifyAI?{' '}
          <Link to="/register" className="text-[#4a9eff] hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
