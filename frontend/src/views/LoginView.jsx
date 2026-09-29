import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, ShieldCheck, Database, Utensils, AlertCircle } from 'lucide-react';

export default function LoginView() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-xl shadow-emerald-500/20 text-white text-3xl mb-3">
            🍽️
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide">
            OFFLINE RESTAURANT <span className="text-emerald-400">POS</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            100% Offline System • Local Database
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-1">System Authentication</h2>
          <p className="text-xs text-slate-400 mb-6">Enter your credentials to access your dashboard</p>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin or cashier1"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition disabled:opacity-50 mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Switch Demo Accounts */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-xs font-semibold text-slate-400 mb-2">Quick Sign-in (Default Accounts):</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCredentials('admin', 'admin123')}
                className="py-2 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-xs font-semibold text-amber-300 text-center transition"
              >
                👑 Admin Role
                <div className="text-[10px] text-slate-400 font-normal">admin / admin123</div>
              </button>
              <button
                type="button"
                onClick={() => setCredentials('cashier1', 'cashier123')}
                className="py-2 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-xs font-semibold text-blue-300 text-center transition"
              >
                💼 Cashier Role
                <div className="text-[10px] text-slate-400 font-normal">cashier1 / cashier123</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-6 text-center text-xs text-slate-500 space-y-1">
          <p className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Role-Based Access Control Protected
          </p>
          <p>Local offline storage • Encrypted passwords</p>
        </div>
      </div>
    </div>
  );
}
