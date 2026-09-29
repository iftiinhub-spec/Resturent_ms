import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PaymentModal from '../components/PaymentModal';
import ReceiptModal from '../components/ReceiptModal';
import {
  Receipt,
  Search,
  Filter,
  DollarSign,
  Printer,
  XCircle,
  CheckCircle,
  Clock,
  Eye,
  RotateCcw,
  Calendar,
} from 'lucide-react';

export default function OrdersView() {
  const { user, isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [viewingOrder, setViewingOrder] = useState(null);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getOrders();
      if (res.success) setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCompletePayment = async (amountPaid, paymentMethod) => {
    try {
      const res = await api.payOrder(paymentOrder._id, amountPaid, paymentMethod);
      if (res.success) {
        setPaymentOrder(null);
        setReceiptOrder(res.data);
        loadOrders();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalOrder) return;
    try {
      await api.cancelOrder(cancelModalOrder._id, cancelReason);
      setCancelModalOrder(null);
      setCancelReason('');
      loadOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredOrders = orders.filter((ord) => {
    const matchesStatus = statusFilter === 'all' || ord.status === statusFilter;
    const matchesType = typeFilter === 'all' || ord.orderType === typeFilter;
    const matchesSearch =
      searchTerm === '' ||
      ord.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ord.cashierName && ord.cashierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ord.tableNumber && ord.tableNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesStatus && matchesType && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-400" />
            Orders & Transactions
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete transaction logs, receipt printing, and payment collection
          </p>
        </div>

        <button
          onClick={loadOrders}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Refresh Orders
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order #, Cashier, or Table..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {['all', 'Pending', 'Completed', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
              }`}
            >
              {st === 'all' ? 'All Status' : st}
            </button>
          ))}
        </div>

        {/* Order Type Dropdown */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-950 border border-slate-750 rounded-xl text-xs py-2 px-3 text-slate-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Types (Dine-In / Takeaway)</option>
          <option value="Dine-In">Dine-In</option>
          <option value="Takeaway">Takeaway</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Order #</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Type / Table</th>
                <th className="py-3.5 px-4">Cashier</th>
                <th className="py-3.5 px-4">Items Summary</th>
                <th className="py-3.5 px-4">Grand Total</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-500">
                    Loading order history...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-500">
                    No orders found matching filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const itemCount = ord.items?.reduce((s, it) => s + it.quantity, 0) || 0;
                  const isPending = ord.status === 'Pending';
                  const isCompleted = ord.status === 'Completed';

                  return (
                    <tr key={ord._id} className="hover:bg-slate-850 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(ord.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-300">
                          {ord.orderType}
                        </span>
                        {ord.tableNumber && (
                          <span className="ml-1 text-[11px] text-emerald-400 font-mono">
                            ({ord.tableNumber})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {ord.cashierName || 'Staff'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-300 font-medium">
                          {itemCount} items
                        </span>
                        <div className="text-[10px] text-slate-500 truncate max-w-xs">
                          {ord.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-sm text-emerald-400">
                        ${ord.grandTotal.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isPending
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Pay button for Pending orders */}
                          {isPending && (
                            <button
                              onClick={() => setPaymentOrder(ord)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-600/20"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              Pay
                            </button>
                          )}

                          {/* Print / View receipt for Completed */}
                          {isCompleted && (
                            <button
                              onClick={() => setReceiptOrder(ord)}
                              title="Print Receipt"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Order details */}
                          <button
                            onClick={() => setViewingOrder(ord)}
                            title="View Full Details"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Cancel button */}
                          {(isPending || (isCompleted && isAdmin)) && (
                            <button
                              onClick={() => {
                                setCancelModalOrder(ord);
                                setCancelReason('');
                              }}
                              title="Cancel Order"
                              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition"
                            >
                              <XCircle className="w-3.5 h-3.5" />
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

      {/* Payment Modal for Pending Orders */}
      {paymentOrder && (
        <PaymentModal
          order={paymentOrder}
          onComplete={handleCompletePayment}
          onClose={() => setPaymentOrder(null)}
        />
      )}

      {/* Receipt Modal */}
      {receiptOrder && (
        <ReceiptModal
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}

      {/* Order Details View Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base">Order Details</h3>
                <p className="text-xs text-emerald-400 font-mono font-medium">{viewingOrder.orderNumber}</p>
              </div>
              <button onClick={() => setViewingOrder(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Cashier:</span>
                <p className="font-semibold text-white mt-0.5">{viewingOrder.cashierName}</p>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Order Type:</span>
                <p className="font-semibold text-white mt-0.5">{viewingOrder.orderType} {viewingOrder.tableNumber ? `(${viewingOrder.tableNumber})` : ''}</p>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Status:</span>
                <p className="font-semibold text-white mt-0.5">{viewingOrder.status}</p>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Payment:</span>
                <p className="font-semibold text-white mt-0.5">{viewingOrder.paymentMethod || 'Cash'}</p>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              <p className="text-xs font-bold text-slate-400 uppercase">Items Ordered:</p>
              {viewingOrder.items?.map((it, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span>{it.quantity}x {it.name}</span>
                  <span className="font-mono text-emerald-400">${it.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span>${viewingOrder.subtotal.toFixed(2)}</span>
              </div>
              {viewingOrder.discountAmount > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>Discount:</span>
                  <span>-${viewingOrder.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-slate-800">
                <span>Grand Total:</span>
                <span className="text-emerald-400">${viewingOrder.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setReceiptOrder(viewingOrder);
                  setViewingOrder(null);
                }}
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Receipt
              </button>
              <button
                onClick={() => setViewingOrder(null)}
                className="py-2 px-4 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-white text-base">Cancel Order</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to cancel order <span className="font-mono font-bold text-white">{cancelModalOrder.orderNumber}</span>?
              {cancelModalOrder.status === 'Completed' && ' (Stock will be automatically refunded)'}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Reason for Cancellation</label>
              <input
                type="text"
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Customer change of mind, wrong entry"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCancelModalOrder(null)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
