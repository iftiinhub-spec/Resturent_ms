import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Download,
  Printer,
  Calendar,
  Users,
  Award,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

export default function ReportsView() {
  const [period, setPeriod] = useState('daily');
  const [salesReport, setSalesReport] = useState(null);
  const [cashierReport, setCashierReport] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [cancelledReport, setCancelledReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAllReports = async () => {
    try {
      setLoading(true);
      const [salesRes, cashiersRes, topRes, cancelRes] = await Promise.all([
        api.getSalesReport({ period }),
        api.getCashierReport(),
        api.getTopItemsReport(),
        api.getCancelledReport(),
      ]);

      if (salesRes.success) setSalesReport(salesRes);
      if (cashiersRes.success) setCashierReport(cashiersRes.data);
      if (topRes.success) setTopItems(topRes.data);
      if (cancelRes.success) setCancelledReport(cancelRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllReports();
  }, [period]);

  // Export report to CSV
  const handleExportCSV = () => {
    if (!salesReport || !salesReport.breakdown) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Date,Orders Count,Revenue ($),Cost ($),Profit ($),Discounts ($)\n';

    salesReport.breakdown.forEach((row) => {
      csvContent += `${row.date},${row.ordersCount},${row.revenue.toFixed(2)},${row.cost.toFixed(2)},${row.profit.toFixed(2)},${row.discounts.toFixed(2)}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_report_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const summary = salesReport?.summary;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            Financial Reports & Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Revenue trends, profit summaries, cashier sales performance, and item rankings
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>
        </div>
      </div>

      {/* Period Selector Tabs */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Timeframe:</span>
        {[
          { id: 'daily', label: 'Last 7 Days (Daily)' },
          { id: 'weekly', label: 'Last 4 Weeks' },
          { id: 'monthly', label: 'Last 6 Months' },
        ].map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              period === p.id
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-slate-400">Total Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-white mt-2">
            ${summary?.totalRevenue?.toFixed(2) || '0.00'}
          </div>
          <p className="text-xs text-slate-400 mt-1">{summary?.totalOrders || 0} completed orders</p>
        </div>

        {/* Net Profit */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-slate-400">Net Profit</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-white mt-2">
            ${summary?.netProfit?.toFixed(2) || '0.00'}
          </div>
          <p className="text-xs text-slate-400 mt-1">Cost of Goods: ${summary?.totalCost?.toFixed(2) || '0.00'}</p>
        </div>

        {/* Average Order Value */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-slate-400">Avg Order Value</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-white mt-2">
            ${summary?.averageOrderValue?.toFixed(2) || '0.00'}
          </div>
          <p className="text-xs text-slate-400 mt-1">Per transaction average</p>
        </div>

        {/* Discounts & Lost */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-slate-400">Total Discounts Given</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-amber-400 mt-2">
            ${summary?.totalDiscounts?.toFixed(2) || '0.00'}
          </div>
          <p className="text-xs text-slate-400 mt-1">Authorized promotions</p>
        </div>
      </div>

      {/* Sales Breakdown by Date */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-base">Sales Breakdown by Timeline</h3>
          <span className="text-xs text-slate-400">Filtered by {period} period</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Orders Count</th>
                <th className="py-3 px-4">Gross Revenue</th>
                <th className="py-3 px-4">Item Costs</th>
                <th className="py-3 px-4">Net Profit</th>
                <th className="py-3 px-4">Discounts</th>
                <th className="py-3 px-4">Profit Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {salesReport?.breakdown?.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-500">
                    No completed sales data in this timeframe.
                  </td>
                </tr>
              ) : (
                salesReport?.breakdown?.map((row) => {
                  const marginPct = row.revenue > 0 ? (((row.profit) / row.revenue) * 100).toFixed(1) : 0;
                  return (
                    <tr key={row.date} className="hover:bg-slate-850 transition">
                      <td className="py-3 px-4 font-mono font-bold text-white">{row.date}</td>
                      <td className="py-3 px-4">{row.ordersCount} orders</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">${row.revenue.toFixed(2)}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">${row.cost.toFixed(2)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-400">${row.profit.toFixed(2)}</td>
                      <td className="py-3 px-4 font-mono text-amber-400">${row.discounts.toFixed(2)}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-300">{marginPct}%</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two columns: Sales by Cashier & Top Menu Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Cashier */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-sm">Sales Performance by Cashier</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Cashier Name</th>
                  <th className="py-3 px-4">Orders Handled</th>
                  <th className="py-3 px-4">Items Sold</th>
                  <th className="py-3 px-4 text-right">Total Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {cashierReport.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-6 text-slate-500">
                      No cashier data available.
                    </td>
                  </tr>
                ) : (
                  cashierReport.map((c) => (
                    <tr key={c.cashierId} className="hover:bg-slate-850">
                      <td className="py-3 px-4 font-bold text-white">{c.cashierName}</td>
                      <td className="py-3 px-4">{c.orderCount} orders</td>
                      <td className="py-3 px-4">{c.itemsSold} items</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        ${c.totalSales.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Most-Sold Menu Items */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-sm">Most Popular Items (Top Selling)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Rank & Item</th>
                  <th className="py-3 px-4">Units Sold</th>
                  <th className="py-3 px-4">Total Revenue</th>
                  <th className="py-3 px-4 text-right">Total Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {topItems.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-6 text-slate-500">
                      No sales recorded yet.
                    </td>
                  </tr>
                ) : (
                  topItems.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-850">
                      <td className="py-3 px-4">
                        <span className="inline-block w-5 font-bold text-slate-500">#{idx + 1}</span>
                        <span className="font-bold text-white">{it.name}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-300">{it.quantitySold} sold</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">${it.totalRevenue.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-blue-400">
                        ${it.totalProfit.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cancelled Orders Audit Log */}
      {cancelledReport && cancelledReport.count > 0 && (
        <div className="bg-slate-900 border border-rose-500/20 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-rose-950/20">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              <span>Cancelled Orders Audit ({cancelledReport.count} orders • ${cancelledReport.totalLostRevenue?.toFixed(2)} lost revenue)</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Order #</th>
                  <th className="py-2.5 px-4">Cashier</th>
                  <th className="py-2.5 px-4">Cancellation Reason</th>
                  <th className="py-2.5 px-4 text-right">Lost Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {cancelledReport.data.map((ord) => (
                  <tr key={ord._id}>
                    <td className="py-2.5 px-4 font-mono font-bold text-white">{ord.orderNumber}</td>
                    <td className="py-2.5 px-4">{ord.cashierName || 'Staff'}</td>
                    <td className="py-2.5 px-4 text-slate-400 italic">{ord.cancellationReason || 'No reason provided'}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-rose-400 font-bold">${ord.grandTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
