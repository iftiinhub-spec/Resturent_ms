import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Utensils,
  ArrowRight,
  PlusCircle,
  Clock,
  CheckCircle,
  Boxes,
} from 'lucide-react';

export default function DashboardView({ setCurrentView }) {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardData();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mr-3"></div>
        <span>Loading dashboard overview...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl border border-slate-750 shadow-lg">
        <div>
          <h2 className="text-2xl font-black text-white">
            Welcome back, <span className="text-emerald-400">{user?.name}</span>!
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isAdmin
              ? 'Administrator Control Center • Full System Overview'
              : 'Cashier Terminal • Operational Sales & Orders'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentView('pos')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition"
          >
            <PlusCircle className="w-4 h-4" />
            New Order (POS)
          </button>
          <button
            onClick={() => setCurrentView('tables')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition"
          >
            Table Floor
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Today's Sales</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-white mt-2">
            ${data?.todaySales?.toFixed(2) || '0.00'}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {data?.todayCompletedCount || 0} completed orders today
          </p>
        </div>

        {/* Profit (Admin) or Pending Orders (Cashier) */}
        {isAdmin ? (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Net Profit Today</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black font-mono text-white mt-2">
              ${data?.todayProfit?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Estimated from item cost margins
            </p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Active Pending</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black font-mono text-amber-400 mt-2">
              {data?.pendingOrdersCount || 0}
            </div>
            <p className="text-xs text-slate-400 mt-1">Awaiting customer payment</p>
          </div>
        )}

        {/* Available Menu Items */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Available Items</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Utensils className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-white mt-2">
            {data?.availableMenuItems || 0}
            <span className="text-sm font-normal text-slate-500"> / {data?.totalMenuItems || 0}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Active on POS menu</p>
        </div>

        {/* Low Stock Alerts */}
        <div className={`p-5 rounded-2xl border shadow-sm ${
          (data?.lowStockCount || 0) > 0
            ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
            : 'bg-slate-900 border-slate-800 text-slate-400'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider">Low Stock Items</span>
            <div className={`p-2 rounded-xl ${
              (data?.lowStockCount || 0) > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-white mt-2">
            {data?.lowStockCount || 0}
          </div>
          <p className="text-xs mt-1">
            {(data?.lowStockCount || 0) > 0 ? 'Needs immediate restock!' : 'Stock levels healthy'}
          </p>
        </div>
      </div>

      {/* Low Stock Notification Banner (if any) */}
      {(data?.lowStockItems?.length || 0) > 0 && (
        <div className="bg-rose-950/30 border border-rose-500/30 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
              <span>Low-Stock Inventory Warnings ({data.lowStockItems.length} items below threshold)</span>
            </div>
            {isAdmin && (
              <button
                onClick={() => setCurrentView('menu')}
                className="text-xs text-rose-300 hover:text-white underline font-semibold"
              >
                Go to Inventory Management →
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.lowStockItems.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-rose-500/20 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{item.imageEmoji || '🍽️'}</span>
                  <div>
                    <p className="font-bold text-white">{item.name}</p>
                    <p className="text-slate-400">{item.categoryName || 'Food'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-rose-400 text-sm font-mono">{item.stockQuantity} left</span>
                  <p className="text-[10px] text-slate-500">Min: {item.lowStockThreshold}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-base">Recent Orders</h3>
          <button
            onClick={() => setCurrentView('orders')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
          >
            View All Orders <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Cashier</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {data?.recentOrders?.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-500">
                    No orders recorded yet. Start a new order from POS!
                  </td>
                </tr>
              ) : (
                data?.recentOrders?.map((ord) => (
                  <tr key={ord._id} className="hover:bg-slate-850 transition">
                    <td className="py-3 px-4 font-mono font-bold text-white">{ord.orderNumber}</td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-300">
                        {ord.orderType} {ord.tableNumber ? `(${ord.tableNumber})` : ''}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{ord.cashierName || 'Staff'}</td>
                    <td className="py-3 px-4">
                      {ord.items?.reduce((acc, it) => acc + it.quantity, 0)} items
                    </td>
                    <td className="py-3 px-4 font-bold font-mono text-emerald-400">
                      ${ord.grandTotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                          ord.status === 'Completed'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : ord.status === 'Pending'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
