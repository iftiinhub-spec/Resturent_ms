import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { WifiOff, ShieldCheck, User, LogOut, Clock, Database } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Offline status */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-lg shadow-emerald-500/20 text-white font-black text-xl">
          🍽️
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-lg text-white tracking-wide">RESTO<span className="text-emerald-400">POS</span></h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
              Offline Ready
            </span>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Database className="w-3 h-3 text-slate-500" />
            Local MongoDB Server (offline)
          </p>
        </div>
      </div>

      {/* Center Clock */}
      <div className="hidden md:flex items-center space-x-2 text-slate-300 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50 text-sm">
        <Clock className="w-4 h-4 text-emerald-400" />
        <span>{time.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        <span className="text-slate-500">|</span>
        <span className="font-mono font-medium text-white">{time.toLocaleTimeString()}</span>
      </div>

      {/* User profile & Logout */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3 text-right">
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-white">{user?.name || user?.username}</p>
            <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
              isAdmin ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            }`}>
              {user?.role}
            </span>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-inner ${
            isAdmin ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
          }`}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign out"
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
