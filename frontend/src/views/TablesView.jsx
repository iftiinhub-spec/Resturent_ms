import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Grid2X2,
  Users,
  Plus,
  Trash2,
  Edit2,
  Utensils,
  CheckCircle,
  Clock,
  Bookmark,
  X,
  ArrowRight,
} from 'lucide-react';

export default function TablesView({ setCurrentView, onSelectTableForOrder }) {
  const { isAdmin } = useAuth();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [errorMsg, setErrorMsg] = useState('');

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [notes, setNotes] = useState('');

  const loadTables = async () => {
    try {
      setLoading(true);
      const res = await api.getTables();
      if (res.success) setTables(res.data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const handleSaveTable = async (e) => {
    e.preventDefault();
    try {
      if (editingTable) {
        await api.updateTable(editingTable._id, { tableNumber, capacity, notes });
      } else {
        await api.createTable({ tableNumber, capacity, notes });
      }
      setIsAddModalOpen(false);
      setEditingTable(null);
      setTableNumber('');
      setCapacity(4);
      setNotes('');
      loadTables();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleEditClick = (t) => {
    setEditingTable(t);
    setTableNumber(t.tableNumber);
    setCapacity(t.capacity);
    setNotes(t.notes || '');
    setIsAddModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this table?')) return;
    try {
      await api.deleteTable(id);
      loadTables();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.updateTableStatus(id, newStatus);
      loadTables();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredTables = tables.filter((t) => {
    if (filterStatus === 'all') return true;
    return t.status.toLowerCase() === filterStatus.toLowerCase();
  });

  const availableCount = tables.filter((t) => t.status === 'Available').length;
  const occupiedCount = tables.filter((t) => t.status === 'Occupied').length;
  const reservedCount = tables.filter((t) => t.status === 'Reserved').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header and stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Grid2X2 className="w-6 h-6 text-emerald-400" />
            Table Floor Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Monitor real-time dine-in occupancy and start orders directly
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setEditingTable(null);
              setTableNumber(`Table ${tables.length + 1}`);
              setCapacity(4);
              setNotes('');
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Table
          </button>
        )}
      </div>

      {/* Floor Overview Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setFilterStatus('all')}
          className={`p-3.5 rounded-2xl border text-left transition ${
            filterStatus === 'all'
              ? 'bg-slate-800 border-slate-600'
              : 'bg-slate-900 border-slate-800 hover:bg-slate-850'
          }`}
        >
          <span className="text-xs text-slate-400 font-semibold uppercase">Total Tables</span>
          <p className="text-2xl font-black text-white font-mono mt-1">{tables.length}</p>
        </button>

        <button
          onClick={() => setFilterStatus('available')}
          className={`p-3.5 rounded-2xl border text-left transition ${
            filterStatus === 'available'
              ? 'bg-emerald-950/40 border-emerald-500'
              : 'bg-slate-900 border-slate-800 hover:bg-slate-850'
          }`}
        >
          <span className="text-xs text-emerald-400 font-semibold uppercase flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Available
          </span>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-1">{availableCount}</p>
        </button>

        <button
          onClick={() => setFilterStatus('occupied')}
          className={`p-3.5 rounded-2xl border text-left transition ${
            filterStatus === 'occupied'
              ? 'bg-amber-950/40 border-amber-500'
              : 'bg-slate-900 border-slate-800 hover:bg-slate-850'
          }`}
        >
          <span className="text-xs text-amber-400 font-semibold uppercase flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Occupied
          </span>
          <p className="text-2xl font-black text-amber-400 font-mono mt-1">{occupiedCount}</p>
        </button>

        <button
          onClick={() => setFilterStatus('reserved')}
          className={`p-3.5 rounded-2xl border text-left transition ${
            filterStatus === 'reserved'
              ? 'bg-blue-950/40 border-blue-500'
              : 'bg-slate-900 border-slate-800 hover:bg-slate-850'
          }`}
        >
          <span className="text-xs text-blue-400 font-semibold uppercase flex items-center gap-1">
            <Bookmark className="w-3.5 h-3.5" /> Reserved
          </span>
          <p className="text-2xl font-black text-blue-400 font-mono mt-1">{reservedCount}</p>
        </button>
      </div>

      {/* Tables Floor Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading floor layout...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTables.map((t) => {
            const isAvail = t.status === 'Available';
            const isOcc = t.status === 'Occupied';
            const isRes = t.status === 'Reserved';

            return (
              <div
                key={t._id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isAvail
                    ? 'bg-slate-900 border-slate-800 hover:border-emerald-500/50'
                    : isOcc
                    ? 'bg-slate-900 border-amber-500/40 shadow-lg shadow-amber-950/10'
                    : 'bg-slate-900 border-blue-500/40'
                }`}
              >
                <div>
                  {/* Card Header: Table name and status */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-black text-white text-lg">{t.tableNumber}</h3>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        isAvail
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isOcc
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  {/* Capacity & notes */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>Capacity: {t.capacity} seats</span>
                  </div>

                  {t.notes && (
                    <p className="text-[11px] text-slate-500 italic mb-2">Note: {t.notes}</p>
                  )}

                  {/* Occupied details */}
                  {isOcc && t.currentOrder && (
                    <div className="my-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span>Active Order:</span>
                        <span className="font-mono text-white font-bold">{t.currentOrder.orderNumber}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Current Bill:</span>
                        <span className="font-mono text-emerald-400 font-bold">${t.currentOrder.grandTotal?.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-slate-500 uppercase font-bold">Status:</label>
                    <select
                      value={t.status}
                      onChange={(e) => handleStatusChange(t._id, e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg text-xs py-1 px-2 text-slate-300 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Available">Available</option>
                      <option value="Occupied">Occupied</option>
                      <option value="Reserved">Reserved</option>
                    </select>
                  </div>

                  {/* Primary card button */}
                  {isAvail ? (
                    <button
                      onClick={() => {
                        if (onSelectTableForOrder) onSelectTableForOrder(t);
                        setCurrentView('pos');
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 hover:border-emerald-500 text-emerald-300 hover:text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
                    >
                      Start Order Here <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentView('orders')}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition flex items-center justify-center gap-1.5"
                    >
                      View in Orders
                    </button>
                  )}

                  {/* Admin Edit / Delete */}
                  {isAdmin && (
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleEditClick(t)}
                        className="p-1.5 text-slate-500 hover:text-slate-200 rounded hover:bg-slate-800 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(t._id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Table Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">
                {editingTable ? 'Edit Table' : 'Add New Table'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Table Name / Number
                </label>
                <input
                  type="text"
                  required
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g. Table 9, Patio 1, Bar 2"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Capacity (Seats)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Notes (Location, window seat, etc.)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 shadow-md shadow-emerald-600/30"
                >
                  Save Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
