import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { DashboardSummary } from '../../types/erp.ts';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  AlertTriangle, 
  FileSpreadsheet, 
  ArrowUpRight, 
  BarChart3, 
  Download,
  Calendar,
  Layers
} from 'lucide-react';

export const BusinessAnalytics: React.FC = () => {
  const { activeBusiness, formatMoney } = useTenant();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const loadSummary = async () => {
    if (!activeBusiness) return;
    try {
      const res = await fetch(`/api/reports/summary?businessId=${activeBusiness.id}`);
      if (res.ok) setSummary(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [activeBusiness]);

  const handleSyncSheets = async () => {
    if (!activeBusiness) return;
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/integrations/google-sheets/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': activeBusiness.id,
        },
        body: JSON.stringify({ businessId: activeBusiness.id }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncFeedback('Successfully exported snapshot to Google Sheets worksheets.');
      }
    } catch (err: any) {
      setSyncFeedback(`Sync failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!summary) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading business analytics...</div>;
  }

  const grossProfitEstimate = summary.monthSales * 0.18; // approx gross margin

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Business Reports & Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time financial performance, inventory valuation, receivables, and Google Sheets data ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSyncSheets}
            disabled={isSyncing}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            {isSyncing ? 'Syncing...' : 'Sync to Google Sheets'}
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-md text-xs font-medium">
          {syncFeedback}
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today Sales */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Today's Revenue
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
              {formatMoney(summary.todaySales)}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {summary.todayOrders} invoices
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 font-medium pt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Live register transactions
          </p>
        </div>

        {/* Month Sales */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Month-to-Date Revenue
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
              {formatMoney(summary.monthSales)}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Margin ~18%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1">
            Est. Gross Margin: <b className="font-mono text-slate-900">{formatMoney(grossProfitEstimate)}</b>
          </p>
        </div>

        {/* Receivables & Payables */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Net Working Capital
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-slate-600">Cust Receivables:</span>
            <span className="text-xs font-bold text-emerald-700 font-mono tabular-nums">
              {formatMoney(summary.totalReceivables)}
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-xs text-slate-600">Supplier Payables:</span>
            <span className="text-xs font-bold text-rose-700 font-mono tabular-nums">
              {formatMoney(summary.totalPayables)}
            </span>
          </div>
        </div>

        {/* Stock Valuation */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Warehouse Valuation
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
              {formatMoney(summary.totalStockValueRetail)}
            </span>
            {summary.lowStockCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono">
                {summary.lowStockCount} Low
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 pt-1">
            At Cost: <b className="font-mono text-slate-900">{formatMoney(summary.totalStockValueCost)}</b>
          </p>
        </div>
      </div>

      {/* Analytics Grid: Sales Trend & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Sales Trend (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-semibold text-slate-900">7-Day Sales Trajectory</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">Daily settlement trend</span>
          </div>

          <div className="space-y-3 pt-2">
            {summary.salesTrend.map((day) => {
              const maxAmt = Math.max(...summary.salesTrend.map((d) => d.amount), 1);
              const pct = Math.min(100, Math.round((day.amount / maxAmt) * 100));

              return (
                <div key={day.date} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-mono font-medium">{day.date}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatMoney(day.amount)} <span className="text-[10px] text-slate-400">({day.count} orders)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Selling Products (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-semibold text-slate-900">Top Selling Products</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">By gross volume</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {summary.topProducts.length === 0 ? (
              <p className="py-6 text-center text-slate-400 text-xs">No product sales recorded yet.</p>
            ) : (
              summary.topProducts.map((tp, idx) => (
                <div
                  key={tp.name}
                  className="p-2.5 rounded-md bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 block truncate">{idx + 1}. {tp.name}</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Quantity Sold: <b>{tp.quantity}</b>
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-slate-900 block">{formatMoney(tp.revenue)}</span>
                    <span className="text-[10px] text-emerald-600 font-medium">Wholesale/Retail</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
