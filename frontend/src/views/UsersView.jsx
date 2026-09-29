import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Plus,
  KeyRound,
  Trash2,
  Edit2,
  Shield,
  UserCheck,
  UserX,
  X,
  Lock,
} from 'lucide-react';

export default function UsersView() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('cashier');

  // Reset Password Modal
  const [resetModalUser, setResetModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getUsers();
      if (res.success) setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setUsername('');
    setName('');
    setPassword('');
    setRole('cashier');
    setIsModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setUsername(u.username);
    setName(u.name);
    setRole(u.role);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.updateUser(editingUser._id, { name, role });
      } else {
        await api.createUser({ username, name, password, role });
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleActive = async (u) => {
    if (u._id === currentUser._id) {
      alert('You cannot deactivate your own admin account');
      return;
    }
    try {
      await api.updateUser(u._id, { isActive: !u.isActive });
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await api.resetUserPassword(resetModalUser._id, newPassword);
      setResetModalUser(null);
      setNewPassword('');
      alert('Password updated successfully');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (u) => {
    if (u._id === currentUser._id) {
      alert('You cannot delete your own admin account');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user "${u.username}"?`)) return;
    try {
      await api.deleteUser(u._id);
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            Staff & Cashier Accounts
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage system access, create cashiers, assign permissions, and reset credentials
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Cashier / User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Username</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4">Last Login</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-500">
                    Loading user accounts...
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = u._id === currentUser._id;
                  const isAdminUser = u.role === 'admin';

                  return (
                    <tr key={u._id} className="hover:bg-slate-850 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                              isAdminUser
                                ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                                : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                            }`}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-white text-sm">{u.name}</span>
                            {isSelf && (
                              <span className="ml-2 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                (You)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-300 font-medium">
                        @{u.username}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                            isAdminUser
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {isAdminUser ? '👑 Admin' : '💼 Cashier'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={isSelf}
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold transition ${
                            u.isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                          }`}
                        >
                          {u.isActive ? (
                            <>
                              <UserCheck className="w-3 h-3 text-emerald-400" />
                              Active
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3 text-rose-400" />
                              Deactivated
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">
                        {u.lastLogin
                          ? new Date(u.lastLogin).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Never'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Reset password button */}
                          <button
                            onClick={() => {
                              setResetModalUser(u);
                              setNewPassword('');
                            }}
                            title="Reset Password"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit user details */}
                          <button
                            onClick={() => openEditModal(u)}
                            title="Edit User"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete user */}
                          {!isSelf && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              title="Delete User"
                              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">
                {editingUser ? 'Edit User' : 'Create New Account'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Username (login ID) *</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. cashier2"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {!editingUser && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Initial Password *</label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 4 characters"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">System Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="cashier">Cashier (POS & Orders Only)</option>
                  <option value="admin">Administrator (Full System Control)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 shadow-md shadow-emerald-600/30"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-base text-white">Reset User Password</h3>
            <p className="text-xs text-slate-400">
              Enter a new password for <span className="text-emerald-400 font-bold">{resetModalUser.username}</span>.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={4}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 4 characters"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-500 shadow-md shadow-amber-600/30"
                >
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
