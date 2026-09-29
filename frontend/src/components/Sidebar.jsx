import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Grid2X2,
  Receipt,
  UtensilsCrossed,
  Tags,
  Users,
  BarChart3,
  Boxes,
} from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView }) {
  const { isAdmin } = useAuth();

  const cashierNav = [
    { id: 'pos', label: 'POS Terminal', icon: ShoppingCart },
    { id: 'orders', label: 'Orders & Receipts', icon: Receipt },
    { id: 'tables', label: 'Table Floor', icon: Grid2X2 },
    { id: 'dashboard', label: 'My Shift Overview', icon: LayoutDashboard },
  ];

  const adminNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'POS Terminal', icon: ShoppingCart },
    { id: 'orders', label: 'Orders & History', icon: Receipt },
    { id: 'tables', label: 'Table Floor', icon: Grid2X2 },
    { id: 'menu', label: 'Menu & Inventory', icon: UtensilsCrossed },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: 'users', label: 'Cashiers & Users', icon: Users },
    { id: 'reports', label: 'Sales Reports & Analytics', icon: BarChart3 },
  ];

  const navItems = isAdmin ? adminNav : cashierNav;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 min-h-[calc(100vh-65px)]">
      {/* Role Banner */}
      <div className="p-4 mx-3 my-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
        <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Active Workspace</p>
        <p className="text-sm font-semibold text-emerald-400 mt-0.5">
          {isAdmin ? '👑 Admin Management' : '💼 Cashier Terminal'}
        </p>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Offline Status footer */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-slate-300">Connection</span>
          <span className="text-emerald-400 font-bold">Offline / Local</span>
        </div>
        <p className="text-[11px] text-slate-500">Database: MongoDB (127.0.0.1:27017)</p>
      </div>
    </aside>
  );
}
