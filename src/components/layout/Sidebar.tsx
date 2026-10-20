import React from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { 
  ShoppingBag, 
  Package, 
  Users, 
  Truck, 
  PackagePlus, 
  Receipt, 
  BarChart3, 
  ShieldCheck, 
  Settings, 
  Database,
  FileSpreadsheet
} from 'lucide-react';

interface SidebarProps {
  activeNav: string;
  onNavigate: (nav: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeNav, onNavigate }) => {
  const { activeBusiness, currentRole } = useTenant();

  const navItems = [
    { id: 'pos', label: 'POS Terminal', icon: ShoppingBag },
    { id: 'inventory', label: 'Products & Inventory', icon: Package },
    { id: 'customers', label: 'Customers & Ledger', icon: Users },
    { id: 'suppliers', label: 'Suppliers & Ledger', icon: Truck },
    { id: 'purchases', label: 'Purchase Orders', icon: PackagePlus },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'admin', label: 'Platform SaaS Console', icon: ShieldCheck, badge: 'SaaS Admin' },
    { id: 'settings-sheets', label: 'Google Sheets Config', icon: Database, isHighlighted: true },
    { id: 'settings', label: 'Business Settings', icon: Settings },
  ];

  const sheetsStatus = activeBusiness?.googleSheetsConfig?.connectionStatus || 'Not Connected';

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-57px)]">
      
      {/* Current Tenant Identity Card */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/60">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Workspace</p>
        <p className="font-bold text-slate-900 text-sm truncate mt-0.5">{activeBusiness?.name}</p>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1 font-mono">
          <span>{activeBusiness?.businessType}</span>
          <span>·</span>
          <span>{activeBusiness?.currency} ({activeBusiness?.currencySymbol})</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ backgroundColor: '#00000e' }} className="p-3 space-y-1 flex-1 text-xs font-medium">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-colors text-left ${
                isActive
                  ? 'bg-slate-900 text-white font-semibold shadow-sm'
                  : item.isHighlighted
                  ? 'text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.isHighlighted ? 'text-indigo-600' : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.id === 'settings-sheets' && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                    sheetsStatus === 'Connected'
                      ? 'text-emerald-700 bg-emerald-100'
                      : sheetsStatus === 'Error'
                      ? 'text-rose-700 bg-rose-100'
                      : 'text-slate-500 bg-slate-200'
                  }`}
                >
                  {sheetsStatus === 'Connected' ? 'Sync' : 'Setup'}
                </span>
              )}

              {item.badge && item.id !== 'settings-sheets' && (
                <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Google Sheets Quick Card */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Google Sheets DB
          </span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
              sheetsStatus === 'Connected' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {sheetsStatus}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-tight">
          {sheetsStatus === 'Connected'
            ? 'All 20 worksheets verified with standard schema.'
            : 'Configure GCP credentials in Settings → Integrations.'}
        </p>
      </div>
    </aside>
  );
};
