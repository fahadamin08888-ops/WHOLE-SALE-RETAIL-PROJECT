import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { UserRole } from '../../types/erp.ts';
import { 
  Building2, 
  ChevronDown, 
  Plus, 
  ShieldCheck, 
  User, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

interface HeaderProps {
  onOpenOnboarding: () => void;
  activeNav: string;
  onNavigate: (nav: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenOnboarding, activeNav, onNavigate }) => {
  const { 
    activeBusiness, 
    businesses, 
    switchBusiness, 
    currentRole, 
    switchRole, 
    currentUserName 
  } = useTenant();

  const [showBizDropdown, setShowBizDropdown] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const sheetsStatus = activeBusiness?.googleSheetsConfig?.connectionStatus || 'Not Connected';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between gap-8 px-6 py-3">
        
        {/* Zone 1: Single element Brand wordmark */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('pos')}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              N
            </span>
            <span>NexusERP Cloud</span>
          </button>

          {/* Tenant Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowBizDropdown(!showBizDropdown);
                setShowRoleDropdown(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-slate-200 hover:border-slate-300 bg-slate-50 text-xs font-semibold text-slate-900 transition-colors whitespace-nowrap"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span className="max-w-[160px] truncate">{activeBusiness?.name || 'Select Business'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showBizDropdown && (
              <div className="absolute left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 text-xs">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Switch Business Tenant
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {businesses.map((biz) => (
                    <button
                      key={biz.id}
                      type="button"
                      onClick={() => {
                        switchBusiness(biz.id);
                        setShowBizDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between transition-colors ${
                        biz.id === activeBusiness?.id ? 'bg-indigo-50/60 font-bold text-indigo-950' : 'text-slate-800'
                      }`}
                    >
                      <div className="truncate">
                        <p className="truncate font-semibold">{biz.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{biz.businessType} · {biz.currency}</p>
                      </div>
                      {biz.id === activeBusiness?.id && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="pt-1 border-t border-slate-100 px-2 py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBizDropdown(false);
                      onOpenOnboarding();
                    }}
                    className="w-full px-2 py-1.5 text-left rounded text-indigo-600 hover:bg-indigo-50 font-semibold flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Onboard New Business</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Zone 2: 4–5 clean single-line nav links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => onNavigate('pos')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeNav === 'pos' ? 'text-slate-900 font-bold border-b-2 border-slate-900 pb-0.5' : ''
            }`}
          >
            Point of Sale
          </button>
          <button
            type="button"
            onClick={() => onNavigate('inventory')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeNav === 'inventory' ? 'text-slate-900 font-bold border-b-2 border-slate-900 pb-0.5' : ''
            }`}
          >
            Inventory
          </button>
          <button
            type="button"
            onClick={() => onNavigate('customers')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeNav === 'customers' ? 'text-slate-900 font-bold border-b-2 border-slate-900 pb-0.5' : ''
            }`}
          >
            Customers
          </button>
          <button
            type="button"
            onClick={() => onNavigate('analytics')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeNav === 'analytics' ? 'text-slate-900 font-bold border-b-2 border-slate-900 pb-0.5' : ''
            }`}
          >
            Analytics
          </button>
          <button
            type="button"
            onClick={() => onNavigate('settings-sheets')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              activeNav === 'settings-sheets' ? 'text-slate-900 font-bold border-b-2 border-slate-900 pb-0.5' : ''
            }`}
          >
            Sheets Config
          </button>
        </nav>

        {/* Zone 3: 1 primary action & role profile */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Sheets Quick Status Link */}
          <button
            type="button"
            onClick={() => onNavigate('settings-sheets')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
            title="Click to view Google Sheets Integration configuration"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-600 font-sans">Sheets:</span>
            {sheetsStatus === 'Connected' ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> OK
              </span>
            ) : sheetsStatus === 'Error' ? (
              <span className="text-rose-700 font-bold flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-rose-600" /> Error
              </span>
            ) : (
              <span className="text-slate-500">Not Linked</span>
            )}
          </button>

          {/* Role simulation dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowRoleDropdown(!showRoleDropdown);
                setShowBizDropdown(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span className="capitalize">{currentRole.replace('_', ' ')}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showRoleDropdown && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 text-xs">
                <div className="px-3 py-1 text-[10px] text-slate-400 font-semibold uppercase">
                  Simulate User Role
                </div>
                {(['super_admin', 'owner', 'manager', 'cashier', 'inventory_clerk', 'accountant'] as UserRole[]).map(
                  (role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        switchRole(role);
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left capitalize hover:bg-slate-50 flex items-center justify-between ${
                        currentRole === role ? 'font-bold text-indigo-600 bg-indigo-50/50' : 'text-slate-700'
                      }`}
                    >
                      <span>{role.replace('_', ' ')}</span>
                      {currentRole === role && <span className="text-indigo-600">✓</span>}
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={onOpenOnboarding}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Business</span>
          </button>
        </div>
      </div>
    </header>
  );
};
