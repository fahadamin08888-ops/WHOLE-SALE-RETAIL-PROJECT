import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { Business, AuditLog } from '../../types/erp.ts';
import { 
  ShieldCheck, 
  Building2, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Power, 
  Lock, 
  History, 
  ExternalLink 
} from 'lucide-react';

export const PlatformAdmin: React.FC = () => {
  const { businesses, switchBusiness, reloadBusiness } = useTenant();

  const [metrics, setMetrics] = useState<{
    totalBusinesses: number;
    activeBusinesses: number;
    suspendedBusinesses: number;
    connectedSheets: number;
    failedSheets: number;
    recentErrors: any[];
  } | null>(null);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isTogglingId, setIsTogglingId] = useState<string | null>(null);

  const loadAdminData = async () => {
    try {
      const [mRes, aRes] = await Promise.all([
        fetch('/api/admin/metrics'),
        fetch('/api/audit-logs?all=true'),
      ]);
      if (mRes.ok) setMetrics(await mRes.json());
      if (aRes.ok) setAuditLogs(await aRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [businesses]);

  const handleToggleStatus = async (bizId: string) => {
    setIsTogglingId(bizId);
    try {
      const res = await fetch(`/api/businesses/${bizId}/toggle-status`, {
        method: 'POST',
      });
      if (res.ok) {
        await reloadBusiness();
        await loadAdminData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>SaaS Service Provider Console</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Platform Administration & Tenant Fleet Overview
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Monitor multiple tenant businesses, track Google Sheets API connection health, and govern account lifecycles.
        </p>
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Tenants</span>
            <p className="text-2xl font-bold text-slate-900 font-mono">{metrics.totalBusinesses}</p>
            <p className="text-[11px] text-slate-400">Registered SaaS customers</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Active Accounts</span>
            <p className="text-2xl font-bold text-emerald-700 font-mono">{metrics.activeBusinesses}</p>
            <p className="text-[11px] text-emerald-600 font-medium">In good standing</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Suspended</span>
            <p className="text-2xl font-bold text-rose-700 font-mono">{metrics.suspendedBusinesses}</p>
            <p className="text-[11px] text-rose-600">Access disabled</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Sheets Connected</span>
            <p className="text-2xl font-bold text-indigo-700 font-mono">{metrics.connectedSheets}</p>
            <p className="text-[11px] text-indigo-600 font-medium">Real-time sync active</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Integration Errors</span>
            <p className="text-2xl font-bold text-amber-700 font-mono">{metrics.failedSheets}</p>
            <p className="text-[11px] text-amber-600">Pending credential check</p>
          </div>
        </div>
      )}

      {/* Tenant Directory Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm space-y-0">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-900">Tenant Fleet Directory & Google Sheets Status</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">{businesses.length} Total Registered</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Business & Owner</th>
                <th className="py-2.5 px-3">Industry Type</th>
                <th className="py-2.5 px-3">Google Cloud Project ID</th>
                <th className="py-2.5 px-3">Sheets Connection</th>
                <th className="py-2.5 px-3">Plan</th>
                <th className="py-2.5 px-3">Account Status</th>
                <th className="py-2.5 px-3 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
              {businesses.map((biz) => {
                const sheetStatus = biz.googleSheetsConfig.connectionStatus;
                const isSuspended = biz.status === 'suspended';

                return (
                  <tr key={biz.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-sans">
                      <div className="font-semibold text-slate-900">{biz.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {biz.ownerName} · {biz.email}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-700">
                      {biz.businessType}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                      {biz.googleSheetsConfig.projectId || <span className="text-slate-400">Not configured</span>}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      {sheetStatus === 'Connected' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Connected
                        </span>
                      ) : sheetStatus === 'Error' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-800 border border-rose-200">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          Config Error
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                          Disconnected
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-700">
                      {biz.subscriptionPlan}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          isSuspended
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => switchBusiness(biz.id)}
                          className="px-2.5 py-1 text-[11px] text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-medium"
                        >
                          Switch Context
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(biz.id)}
                          disabled={isTogglingId === biz.id}
                          className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${
                            isSuspended
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                          }`}
                        >
                          {isSuspended ? 'Activate' : 'Suspend'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cross-Tenant Audit Log Strip */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <History className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-semibold text-slate-900">Platform & Integration Audit Trails</h2>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
          {auditLogs.slice(0, 10).map((log) => (
            <div
              key={log.id}
              className="p-2.5 rounded bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
            >
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200 text-slate-700 font-semibold">
                  {log.module}
                </span>
                <span className="font-semibold text-slate-900">{log.action}:</span>
                <span className="text-slate-600">{log.details}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono shrink-0">
                {new Date(log.timestamp).toLocaleString()} ({log.userName})
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
