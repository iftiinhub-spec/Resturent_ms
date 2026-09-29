import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import PaymentModal from '../components/PaymentModal';
import ReceiptModal from '../components/ReceiptModal';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Check,
  Utensils,
  Coffee,
  AlertCircle,
  Percent,
  Receipt,
  RotateCcw,
} from 'lucide-react';

export default function POSView({ initialTable = null }) {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Cart state
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('Dine-In');
  const [selectedTableId, setSelectedTableId] = useState(initialTable?._id || '');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);

  // Modals state
  const [activePaymentOrder, setActivePaymentOrder] = useState(null);
  const [completedOrderReceipt, setCompletedOrderReceipt] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Load initial data
  const loadPOSData = async () => {
    try {
      setLoading(true);
      const [catsRes, itemsRes, tablesRes] = await Promise.all([
        api.getCategories(),
        api.getMenu({ availableOnly: 'true' }),
        api.getTables(),
      ]);

      if (catsRes.success) setCategories(catsRes.data);
      if (itemsRes.success) setMenuItems(itemsRes.data);
      if (tablesRes.success) {
        setTables(tablesRes.data);
        if (!selectedTableId && tablesRes.data.length > 0) {
          const avail = tablesRes.data.find((t) => t.status === 'Available');
          if (avail) setSelectedTableId(avail._id);
        }
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPOSData();
  }, []);

  // Filter items
  const filteredItems = menuItems.filter((item) => {
    const matchesCat =
      selectedCategory === 'all' ||
      (item.category && (item.category._id === selectedCategory || item.category === selectedCategory));

    const matchesSearch =
      searchTerm === '' ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesCat && matchesSearch;
  });

  // Cart operations
  const addToCart = (item) => {
    if (item.stockQuantity <= 0) {
      setErrorMsg(`"${item.name}" is out of stock!`);
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item._id);
      if (existing) {
        if (existing.quantity >= item.stockQuantity) {
          setErrorMsg(`Cannot add more. Max stock for "${item.name}" reached.`);
          setTimeout(() => setErrorMsg(''), 3000);
          return prev;
        }
        return prev.map((i) =>
          i.menuItemId === item._id
            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price }
            : i
        );
      } else {
        return [
          ...prev,
          {
            menuItemId: item._id,
            name: item.name,
            price: item.price,
            costPrice: item.costPrice || 0,
            quantity: 1,
            subtotal: item.price,
            stockQuantity: item.stockQuantity,
            notes: '',
          },
        ];
      }
    });
  };

  const updateQuantity = (menuItemId, change) => {
    setCart((prev) =>
      prev
        .map((it) => {
          if (it.menuItemId === menuItemId) {
            const newQty = it.quantity + change;
            if (newQty <= 0) return null;
            if (newQty > it.stockQuantity) {
              setErrorMsg(`Stock limit reached for "${it.name}"`);
              setTimeout(() => setErrorMsg(''), 3000);
              return it;
            }
            return { ...it, quantity: newQty, subtotal: newQty * it.price };
          }
          return it;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (menuItemId) => {
    setCart((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountPercent(0);
  };

  // Calculations
  const subtotal = cart.reduce((sum, it) => sum + it.subtotal, 0);
  const discountAmount = Number(((subtotal * discountPercent) / 100).toFixed(2));
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Number(((afterDiscount * taxPercent) / 100).toFixed(2));
  const grandTotal = Number((afterDiscount + taxAmount).toFixed(2));

  // Handle Save / Hold Order (Pending)
  const handleHoldOrder = async () => {
    if (cart.length === 0) return;
    try {
      const payload = {
        orderType,
        tableId: orderType === 'Dine-In' ? selectedTableId : null,
        items: cart,
        discountPercent,
        taxPercent,
        isPaidNow: false,
      };

      const res = await api.createOrder(payload);
      if (res.success) {
        setSuccessMsg(`Order ${res.data.orderNumber} saved as PENDING!`);
        clearCart();
        loadPOSData();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Trigger Payment
  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    if (orderType === 'Dine-In' && !selectedTableId) {
      setErrorMsg('Please select a table for Dine-In orders');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    const orderObj = {
      orderNumber: 'NEW ORDER',
      orderType,
      tableId: orderType === 'Dine-In' ? selectedTableId : null,
      subtotal,
      discountPercent,
      discountAmount,
      taxPercent,
      taxAmount,
      grandTotal,
      items: cart,
    };

    setActivePaymentOrder(orderObj);
  };

  // Confirm Payment & Complete Order
  const handleCompletePayment = async (amountPaid, paymentMethod) => {
    try {
      const payload = {
        orderType,
        tableId: orderType === 'Dine-In' ? selectedTableId : null,
        items: cart,
        discountPercent,
        taxPercent,
        isPaidNow: true,
        amountPaid,
        paymentMethod,
      };

      const res = await api.createOrder(payload);
      if (res.success) {
        setActivePaymentOrder(null);
        setCompletedOrderReceipt(res.data);
        clearCart();
        loadPOSData();
      }
    } catch (err) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-65px)] overflow-hidden bg-slate-950">
      {/* Toast Notifications */}
      {errorMsg && (
        <div className="fixed top-16 right-6 z-50 p-4 rounded-xl bg-rose-500/90 text-white font-medium text-xs shadow-xl flex items-center gap-2 animate-bounce">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="fixed top-16 right-6 z-50 p-4 rounded-xl bg-emerald-600/90 text-white font-medium text-xs shadow-xl flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* LEFT: Menu items & Categories */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800 h-full">
        {/* Search & Category Filter Toolbar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 space-y-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search menu items or SKU code (e.g. B01)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-750 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
            <button
              onClick={loadPOSData}
              title="Refresh Menu"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Categories Tab Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === 'all'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Items ({menuItems.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat._id
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
              Loading menu catalog...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-sm">
              <Utensils className="w-8 h-8 mb-2 opacity-50" />
              <span>No items match your search or category filter.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredItems.map((item) => {
                const isOutOfStock = item.stockQuantity <= 0;
                const isLowStock = !isOutOfStock && item.stockQuantity <= item.lowStockThreshold;

                return (
                  <button
                    key={item._id}
                    onClick={() => !isOutOfStock && addToCart(item)}
                    disabled={isOutOfStock}
                    className={`relative p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all duration-150 group ${
                      isOutOfStock
                        ? 'bg-slate-900/40 border-slate-800/60 opacity-50 cursor-not-allowed'
                        : 'bg-slate-900 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 hover:shadow-lg hover:shadow-emerald-950/20 active:scale-[0.98]'
                    }`}
                  >
                    <div>
                      {/* Top: emoji & SKU badge */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-3xl select-none">{item.imageEmoji || '🍽️'}</span>
                        {item.code && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 font-bold">
                            {item.code}
                          </span>
                        )}
                      </div>

                      {/* Name & Category */}
                      <h4 className="font-bold text-white text-xs sm:text-sm line-clamp-1 group-hover:text-emerald-400 transition">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {item.categoryName || 'General'}
                      </p>
                    </div>

                    {/* Bottom: Price and Stock */}
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-emerald-400 font-mono font-bold text-sm">
                        ${item.price.toFixed(2)}
                      </span>

                      {isOutOfStock ? (
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                          Out of Stock
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            isLowStock
                              ? 'text-amber-400 bg-amber-500/10 font-bold'
                              : 'text-slate-400 bg-slate-800'
                          }`}
                        >
                          {item.stockQuantity} left
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Order Cart & Checkout Panel */}
      <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 flex flex-col h-full flex-shrink-0">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-sm">Current Order</h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-xs font-bold text-slate-300">
              {cart.reduce((sum, it) => sum + it.quantity, 0)}
            </span>
          </div>

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

        {/* Order Type & Table Configuration */}
        <div className="p-3 border-b border-slate-800 bg-slate-900/80 space-y-2">
          {/* Order Type Switch */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setOrderType('Dine-In')}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition ${
                orderType === 'Dine-In'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
              }`}
            >
              🍽️ Dine-In
            </button>
            <button
              onClick={() => setOrderType('Takeaway')}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition ${
                orderType === 'Takeaway'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
              }`}
            >
              🥡 Takeaway
            </button>
          </div>

          {/* Table Selector (if Dine-In) */}
          {orderType === 'Dine-In' && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-semibold whitespace-nowrap">Table:</label>
              <select
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-750 rounded-lg text-xs py-1.5 px-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Choose Table --</option>
                {tables.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.tableNumber} ({t.capacity} seats) - {t.status}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs text-center p-4">
              <ShoppingCart className="w-10 h-10 mb-2 opacity-30 text-emerald-400" />
              <p className="font-semibold text-slate-400">Order is empty</p>
              <p className="text-[11px] text-slate-500 mt-1">Tap items on the left to add them to this order</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.menuItemId}
                className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-xs truncate">{item.name}</p>
                  <p className="text-[11px] font-mono text-emerald-400">
                    ${item.price.toFixed(2)} x {item.quantity} = ${item.subtotal.toFixed(2)}
                  </p>
                </div>

                {/* Qty controls */}
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => updateQuantity(item.menuItemId, -1)}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-mono font-bold text-xs text-white">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.menuItemId, 1)}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.menuItemId)}
                    className="p-1 text-slate-500 hover:text-rose-400 ml-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Pricing Summary & Discounts */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 space-y-3">
          {/* Quick Discounts */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="flex items-center gap-1 font-semibold">
                <Percent className="w-3 h-3 text-amber-400" />
                Discount: {discountPercent}%
              </span>
              {discountPercent > 0 && (
                <button
                  onClick={() => setDiscountPercent(0)}
                  className="text-[10px] text-slate-500 hover:text-white"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="grid grid-cols-5 gap-1 text-[11px]">
              {[0, 5, 10, 15, 20].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDiscountPercent(d)}
                  className={`py-1 rounded font-semibold border transition ${
                    discountPercent === d
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800 border-slate-750 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {d}%
                </button>
              ))}
            </div>
          </div>

          {/* Breakdown calculation */}
          <div className="space-y-1 text-xs text-slate-300 pt-1 border-t border-slate-800/80">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono">${subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-amber-400 font-semibold">
                <span>Discount ({discountPercent}%):</span>
                <span className="font-mono">-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
              <span>Grand Total:</span>
              <span className="font-mono text-emerald-400">${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Checkout & Hold Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleHoldOrder}
              disabled={cart.length === 0}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-1.5"
            >
              Save Pending
            </button>
            <button
              onClick={handleOpenPayment}
              disabled={cart.length === 0}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-1.5"
            >
              Pay Now (${grandTotal.toFixed(2)})
            </button>
          </div>
        </div>
      </div>

      {/* Payment Processing Modal */}
      {activePaymentOrder && (
        <PaymentModal
          order={activePaymentOrder}
          onComplete={handleCompletePayment}
          onClose={() => setActivePaymentOrder(null)}
        />
      )}

      {/* Receipt Modal */}
      {completedOrderReceipt && (
        <ReceiptModal
          order={completedOrderReceipt}
          onClose={() => setCompletedOrderReceipt(null)}
        />
      )}
    </div>
  );
}
