import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  Boxes,
  TrendingUp,
} from 'lucide-react';

export default function MenuInventoryView() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    description: '',
    price: '',
    costPrice: '',
    stockQuantity: '',
    lowStockThreshold: 5,
    imageEmoji: '🍔',
    isAvailable: true,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [menuRes, catsRes] = await Promise.all([
        api.getMenu(),
        api.getCategories(),
      ]);
      if (menuRes.success) setItems(menuRes.data);
      if (catsRes.success) setCategories(catsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      code: '',
      category: categories[0]?._id || '',
      description: '',
      price: '',
      costPrice: '',
      stockQuantity: '',
      lowStockThreshold: 5,
      imageEmoji: '🍽️',
      isAvailable: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      code: item.code || '',
      category: item.category?._id || item.category,
      description: item.description || '',
      price: item.price,
      costPrice: item.costPrice || 0,
      stockQuantity: item.stockQuantity,
      lowStockThreshold: item.lowStockThreshold || 5,
      imageEmoji: item.imageEmoji || '🍽️',
      isAvailable: item.isAvailable,
    });
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.updateMenuItem(editingItem._id, formData);
      } else {
        await api.createMenuItem(formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await api.deleteMenuItem(id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleAvailability = async (id) => {
    try {
      await api.toggleAvailability(id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleQuickAdjustStock = async (id, adjustment) => {
    try {
      await api.adjustStock(id, adjustment);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesCat =
      selectedCategory === 'all' ||
      (item.category && (item.category._id === selectedCategory || item.category === selectedCategory));

    const matchesSearch =
      searchTerm === '' ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesCat && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-emerald-400" />
            Menu & Inventory Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Create items, adjust stock levels, set prices and manage ingredient availability
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Menu Item
        </button>
      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search menu items by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
            }`}
          >
            All Categories ({items.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat._id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat._id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Item</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Selling Price</th>
                <th className="py-3.5 px-4">Cost Price</th>
                <th className="py-3.5 px-4">Profit Margin</th>
                <th className="py-3.5 px-4">Stock Level</th>
                <th className="py-3.5 px-4">Quick Restock</th>
                <th className="py-3.5 px-4">Available</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-500">
                    Loading menu items...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-500">
                    No menu items found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isOutOfStock = item.stockQuantity <= 0;
                  const isLowStock = !isOutOfStock && item.stockQuantity <= item.lowStockThreshold;
                  const margin = item.price > 0 ? (((item.price - item.costPrice) / item.price) * 100).toFixed(0) : 0;

                  return (
                    <tr key={item._id} className="hover:bg-slate-850 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{item.imageEmoji || '🍽️'}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{item.name}</span>
                              {item.code && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                  {item.code}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-[11px] text-slate-400 max-w-xs truncate">{item.description}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 font-medium">
                        {item.categoryName || item.category?.name || 'General'}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-sm">
                        ${item.price.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        ${(item.costPrice || 0).toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-blue-400">
                        {margin}%
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded ${
                            isOutOfStock
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : isLowStock
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-200'
                          }`}
                        >
                          {isLowStock && <AlertTriangle className="w-3 h-3" />}
                          {item.stockQuantity} units
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">Threshold: {item.lowStockThreshold}</div>
                      </td>

                      {/* Quick stock adjustments */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleQuickAdjustStock(item._id, 5)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-emerald-400 border border-slate-700 transition"
                          >
                            +5
                          </button>
                          <button
                            onClick={() => handleQuickAdjustStock(item._id, 10)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-emerald-400 border border-slate-700 transition"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => handleQuickAdjustStock(item._id, -1)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-rose-400 border border-slate-700 transition"
                          >
                            -1
                          </button>
                        </div>
                      </td>

                      {/* Availability toggle */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleAvailability(item._id)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition ${
                            item.isAvailable
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}
                        >
                          {item.isAvailable ? 'Available' : 'Disabled'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Add / Edit Menu Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Deluxe Cheeseburger"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">SKU / Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. B01"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category *</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Display Emoji / Icon</label>
                  <input
                    type="text"
                    value={formData.imageEmoji}
                    onChange={(e) => setFormData({ ...formData, imageEmoji: e.target.value })}
                    placeholder="e.g. 🍔, 🍕, 🍟, 🥤"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-xl text-white text-base focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ingredients, toppings, preparation notes..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Selling Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="9.99"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Cost Price ($) (Profit)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    placeholder="4.00"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Initial Stock Qty *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    placeholder="50"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Low-Stock Alert Level</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                    placeholder="5"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="availCheck"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-750 text-emerald-500 focus:ring-0"
                />
                <label htmlFor="availCheck" className="text-slate-300 font-semibold cursor-pointer">
                  Item is active and available for ordering on POS
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-800">
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
                  {editingItem ? 'Update Item' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
