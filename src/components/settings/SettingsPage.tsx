import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { GoogleSheetsWizard } from '../integrations/GoogleSheetsWizard.tsx';
import { 
  Building2, 
  Printer, 
  ShieldCheck, 
  History, 
  Database, 
  Sliders, 
  Check, 
  Layers 
} from 'lucide-react';

export const SettingsPage: React.FC<{ initialTab?: string }> = ({ initialTab = 'integrations' }) => {
  const { activeBusiness, updateSettings, formatMoney } = useTenant();

  const [activeTab, setActiveTab] = useState<'integrations' | 'receipt' | 'business' | 'roles'>(
    initialTab as any
  );

  // Receipt settings form
  const [printerWidth, setPrinterWidth] = useState<'58mm' | '80mm'>(
    activeBusiness?.settings.thermalPrinterWidth || '80mm'
  );
  const [headerNote, setHeaderNote] = useState(activeBusiness?.settings.receiptHeaderNote || '');
  const [footerNote, setFooterNote] = useState(activeBusiness?.settings.receiptFooterNote || '');
  const [enableTax, setEnableTax] = useState(activeBusiness?.settings.enableTax || false);
  const [taxRate, setTaxRate] = useState(activeBusiness?.settings.taxRate || 0);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveReceiptSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      thermalPrinterWidth: printerWidth,
      receiptHeaderNote: headerNote,
      receiptFooterNote: footerNote,
      enableTax,
      taxRate,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-lg text-xs font-medium overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('integrations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'integrations'
              ? 'bg-slate-900 text-white font-semibold shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Google Sheets & Cloud Integration</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('receipt')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'receipt'
              ? 'bg-slate-900 text-white font-semibold shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Thermal Printer & Receipts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('business')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'business'
              ? 'bg-slate-900 text-white font-semibold shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Business Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'roles'
              ? 'bg-slate-900 text-white font-semibold shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Roles & Security Matrix</span>
        </button>
      </div>

      {/* Tab 1: Google Sheets Configuration Wizard */}
      {activeTab === 'integrations' && <GoogleSheetsWizard />}

      {/* Tab 2: Thermal Printer & Receipt Configuration */}
      {activeTab === 'receipt' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-2xl space-y-5">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Thermal Receipt & Hardware Settings</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure roll width paper sizing (58mm / 80mm), tax registration numbers, and custom header/footer notes.
            </p>
          </div>

          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs font-medium flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Receipt & thermal settings updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSaveReceiptSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Thermal Roll Paper Width
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPrinterWidth('58mm')}
                  className={`flex-1 p-3 rounded-lg border text-left transition-all ${
                    printerWidth === '58mm'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <p className="text-sm">58 mm Thermal Roll</p>
                  <p className="text-[11px] text-slate-500 font-normal">Compact portable mobile printers & mini POS terminals</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPrinterWidth('80mm')}
                  className={`flex-1 p-3 rounded-lg border text-left transition-all ${
                    printerWidth === '80mm'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <p className="text-sm">80 mm Standard Roll (Recommended)</p>
                  <p className="text-[11px] text-slate-500 font-normal">Standard commercial countertop ESC/POS receipt printers</p>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Receipt Header Notes & Tax Registration
              </label>
              <textarea
                rows={3}
                value={headerNote}
                onChange={(e) => setHeaderNote(e.target.value)}
                placeholder="Business Name, Tax Registration (NTN / GST #), phone..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Receipt Footer Message & Policy
              </label>
              <textarea
                rows={3}
                value={footerNote}
                onChange={(e) => setFooterNote(e.target.value)}
                placeholder="Thank you message, return window policy..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Enable Value Added Tax / GST</p>
                  <p className="text-[11px] text-slate-500">Calculate tax automatically on wholesale and retail checkouts</p>
                </div>
                <input
                  type="checkbox"
                  checked={enableTax}
                  onChange={(e) => setEnableTax(e.target.checked)}
                  className="rounded text-indigo-600 w-4 h-4"
                />
              </div>

              {enableTax && (
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <label className="text-slate-700 font-semibold">Standard Tax Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 text-right border border-slate-300 rounded font-mono font-bold"
                  />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 text-white bg-slate-900 hover:bg-slate-800 rounded-md font-semibold"
              >
                Save Receipt Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Business Profile */}
      {activeTab === 'business' && activeBusiness && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-2xl space-y-4 text-xs">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Business Profile & Regional Setup</h2>
            <p className="text-slate-500 mt-0.5">Isolated tenant configuration for {activeBusiness.name}.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-500 block">Business Name</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{activeBusiness.name}</p>
            </div>
            <div>
              <span className="text-slate-500 block">Owner Name</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{activeBusiness.ownerName}</p>
            </div>
            <div>
              <span className="text-slate-500 block">Business Email</span>
              <p className="font-mono text-slate-900 mt-0.5">{activeBusiness.email}</p>
            </div>
            <div>
              <span className="text-slate-500 block">Contact Phone</span>
              <p className="font-mono text-slate-900 mt-0.5">{activeBusiness.phone}</p>
            </div>
            <div>
              <span className="text-slate-500 block">Currency</span>
              <p className="font-mono font-bold text-slate-900 mt-0.5">{activeBusiness.currency} ({activeBusiness.currencySymbol})</p>
            </div>
            <div>
              <span className="text-slate-500 block">Timezone</span>
              <p className="font-mono text-slate-900 mt-0.5">{activeBusiness.timezone}</p>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block">Physical Address</span>
              <p className="text-slate-900 mt-0.5">{activeBusiness.address}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Roles & Security Matrix */}
      {activeTab === 'roles' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Role-Based Access Control (RBAC) Matrix</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Permissions governing who can configure integrations, view reports, process sales, and access financial ledgers.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3 text-center">Configure Integrations</th>
                  <th className="py-2.5 px-3 text-center">View Reports</th>
                  <th className="py-2.5 px-3 text-center">Process POS Sales</th>
                  <th className="py-2.5 px-3 text-center">Manage Stock</th>
                  <th className="py-2.5 px-3 text-center">Financial Records</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { role: 'Super Admin (Platform Owner)', c1: true, c2: true, c3: true, c4: true, c5: true },
                  { role: 'Business Owner', c1: true, c2: true, c3: true, c4: true, c5: true },
                  { role: 'Store Manager', c1: false, c2: true, c3: true, c4: true, c5: true },
                  { role: 'Cashier / POS Operator', c1: false, c2: false, c3: true, c4: false, c5: false },
                  { role: 'Inventory Clerk', c1: false, c2: false, c3: false, c4: true, c5: false },
                  { role: 'Accountant', c1: false, c2: true, c3: false, c4: false, c5: true },
                ].map((r) => (
                  <tr key={r.role} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{r.role}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-600">{r.c1 ? '✓' : '—'}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-600">{r.c2 ? '✓' : '—'}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-600">{r.c3 ? '✓' : '—'}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-600">{r.c4 ? '✓' : '—'}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-600">{r.c5 ? '✓' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
