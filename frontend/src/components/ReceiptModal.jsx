import React from 'react';
import { Printer, X, CheckCircle } from 'lucide-react';

export default function ReceiptModal({ order, onClose }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = order.completedAt
    ? new Date(order.completedAt).toLocaleString()
    : new Date(order.createdAt).toLocaleString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Order Completed</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt paper view */}
        <div className="p-4 overflow-y-auto flex justify-center bg-slate-950">
          <div
            id="printable-receipt"
            className="bg-white text-black p-5 rounded-lg shadow-md w-full max-w-[320px] font-mono text-xs leading-relaxed"
          >
            {/* Store Header */}
            <div className="text-center pb-3 border-b border-dashed border-gray-400">
              <h2 className="text-base font-extrabold tracking-wider">OFFLINE BISTRO & GRILL</h2>
              <p className="text-[11px] text-gray-600">Local POS System • Offline First</p>
              <p className="text-[10px] text-gray-500">123 Market Street, Main District</p>
              <p className="text-[10px] text-gray-500">Tel: (555) 019-2831</p>
            </div>

            {/* Order Meta */}
            <div className="py-2 border-b border-dashed border-gray-400 space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span className="font-bold">Order #:</span>
                <span className="font-extrabold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="font-bold">{order.orderType} {order.tableNumber ? `(${order.tableNumber})` : ''}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{order.cashierName || order.cashier?.name || 'Staff'}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{formattedDate}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-2 border-b border-dashed border-gray-400">
              <div className="flex justify-between font-bold text-[10px] uppercase text-gray-600 mb-1">
                <span>Item</span>
                <span>Total</span>
              </div>
              <div className="space-y-1">
                {order.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="flex-1 pr-2">
                      <span className="font-bold">{it.quantity}x </span>
                      <span>{it.name}</span>
                      {it.notes && <div className="text-[9px] text-gray-500 pl-3 italic">({it.notes})</div>}
                    </div>
                    <span className="font-bold">${it.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="py-2 border-b border-dashed border-gray-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount ({order.discountPercent}%):</span>
                  <span>-${order.discountAmount.toFixed(2)}</span>
                </div>
              )}
              {order.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>Tax ({order.taxPercent}%):</span>
                  <span>+${order.taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black pt-1 border-t border-gray-300">
                <span>TOTAL:</span>
                <span>${order.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-2 border-b border-dashed border-gray-400 space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span>Payment:</span>
                <span className="font-bold">{order.paymentMethod || 'Cash'}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Tendered:</span>
                <span>${(order.amountPaid || order.grandTotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Change Returned:</span>
                <span>${(order.changeGiven || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Barcode and Footer */}
            <div className="pt-3 text-center space-y-1">
              <p className="text-[10px] font-bold">THANK YOU FOR DINING WITH US!</p>
              <p className="text-[9px] text-gray-500">Please retain receipt for your records</p>
              <div className="py-1 tracking-widest text-[10px] text-gray-600 font-mono">
                * * * * * * * * * * * *
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
