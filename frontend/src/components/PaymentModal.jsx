import React, { useState } from 'react';
import { X, DollarSign, CreditCard, Banknote, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PaymentModal({ order, onComplete, onClose }) {
  const grandTotal = Number(order.grandTotal.toFixed(2));
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountPaidStr, setAmountPaidStr] = useState(String(grandTotal));

  const amountPaidNum = parseFloat(amountPaidStr) || 0;
  const changeDue = Number(Math.max(0, amountPaidNum - grandTotal).toFixed(2));
  const isSufficient = amountPaidNum >= grandTotal;

  const handleQuickAmount = (val) => {
    setAmountPaidStr(String(val));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isSufficient && paymentMethod === 'Cash') return;
    onComplete(amountPaidNum, paymentMethod);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div>
            <h3 className="font-bold text-lg text-white">Process Payment</h3>
            <p className="text-xs text-slate-400">Order: <span className="text-emerald-400 font-mono font-medium">{order.orderNumber || 'New Order'}</span></p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Total Amount Display */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Total Amount Due</span>
            <div className="text-4xl font-black text-emerald-400 font-mono mt-1">
              ${grandTotal.toFixed(2)}
            </div>
            {order.discountAmount > 0 && (
              <span className="inline-block mt-1 text-xs text-amber-400 font-medium">
                Includes ${order.discountAmount.toFixed(2)} discount ({order.discountPercent}%)
              </span>
            )}
          </div>

          {/* Payment Method Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('Cash')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-semibold transition ${
                  paymentMethod === 'Cash'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <Banknote className="w-4 h-4" />
                Cash
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('Card');
                  setAmountPaidStr(String(grandTotal));
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-semibold transition ${
                  paymentMethod === 'Card'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Card (Terminal)
              </button>
            </div>
          </div>

          {/* Cash Details */}
          {paymentMethod === 'Cash' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Amount Received from Customer ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    autoFocus
                    required
                    value={amountPaidStr}
                    onChange={(e) => setAmountPaidStr(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xl font-mono font-bold text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickAmount(grandTotal)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700"
                >
                  Exact (${grandTotal.toFixed(2)})
                </button>
                {[10, 20, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickAmount(amt)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700"
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              {/* Real-time Change Output Card */}
              <div className={`p-4 rounded-xl border transition-all ${
                isSufficient
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {isSufficient ? 'Customer Change' : 'Insufficient Amount'}
                  </span>
                  {isSufficient ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  )}
                </div>
                <div className="text-2xl font-black font-mono mt-1">
                  {isSufficient ? `$${changeDue.toFixed(2)}` : `Need $${(grandTotal - amountPaidNum).toFixed(2)} more`}
                </div>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-sm text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={paymentMethod === 'Cash' && !isSufficient}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition flex items-center justify-center gap-2 ${
                paymentMethod === 'Cash' && !isSufficient
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Complete Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
