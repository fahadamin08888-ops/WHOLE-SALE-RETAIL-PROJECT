import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { Supplier, SupplierLedgerEntry, PaymentMethod } from '../../types/erp.ts';
import { 
  Truck, 
  Plus, 
  Search, 
  DollarSign, 
  X, 
  FileText, 
  ExternalLink 
} from 'lucide-react';

export const SupplierManagement: React.FC = () => {
  const { activeBusiness, formatMoney } = useTenant();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSupplierForLedger, setSelectedSupplierForLedger] = useState<Supplier | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<SupplierLedgerEntry[]>([]);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);

  const [selectedSupplierForPayment, setSelectedSupplierForPayment] = useState<Supplier | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // Add form
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
  });

  const loadSuppliers = async () => {
    if (!activeBusiness) return;
    try {
      const res = await fetch(`/api/suppliers?businessId=${activeBusiness.id}`);
      if (res.ok) setSuppliers(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [activeBusiness]);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness) return;
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': activeBusiness.id,
        },
        body: JSON.stringify(newSupplier),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewSupplier({
          name: '',
          contactPerson: '',
          phone: '',
          email: '',
          address: '',
        });
        await loadSuppliers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenLedger = async (supplier: Supplier) => {
    setSelectedSupplierForLedger(supplier);
    setIsLoadingLedger(true);
    try {
      const res = await fetch(`/api/suppliers/${supplier.id}/ledger?businessId=${activeBusiness?.id}`);
      if (res.ok) {
        setLedgerEntries(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingLedger(false);
    }
  };

  const handleDisbursePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForPayment || !activeBusiness) return;
    try {
      const res = await fetch(`/api/suppliers/${selectedSupplierForPayment.id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': activeBusiness.id,
        },
        body: JSON.stringify({
          amount: paymentAmount,
          method: paymentMethod,
          notes: paymentNotes,
        }),
      });
      if (res.ok) {
        setSelectedSupplierForPayment(null);
        setPaymentAmount(0);
        setPaymentNotes('');
        await loadSuppliers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredSuppliers = suppliers.filter((s) => {
    return (
      !searchQuery.trim() ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery)
    );
  });

  const totalPayables = suppliers.reduce((sum, s) => sum + Math.max(0, s.payableBalance), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Suppliers & Vendor Accounts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage wholesale distributors, procurement partners, and supplier ledger disbursements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-md bg-slate-100 text-xs font-medium text-slate-700">
            Total Payables: <b className="font-mono text-rose-700">{formatMoney(totalPayables)}</b>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Supplier
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search supplier company, contact person, or phone..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <span className="text-slate-500 shrink-0 font-medium">
          {filteredSuppliers.length} suppliers registered
        </span>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Supplier Name & Contact</th>
                <th className="py-2.5 px-3">Phone & Email</th>
                <th className="py-2.5 px-3">Address</th>
                <th className="py-2.5 px-3 text-right">Payable Balance</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                    No suppliers found matching filters.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((s) => {
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-sans">
                        <div className="font-semibold text-slate-900">{s.name}</div>
                        <div className="text-[11px] text-slate-400">Contact: {s.contactPerson}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                        <div>{s.phone}</div>
                        <div className="text-slate-400 font-sans text-[10px]">{s.email}</div>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-600">
                        {s.address || 'SITE Area'}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-bold">
                        <span className={s.payableBalance > 0 ? 'text-rose-700' : 'text-slate-600'}>
                          {formatMoney(s.payableBalance)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSupplierForPayment(s);
                              setPaymentAmount(s.payableBalance > 0 ? s.payableBalance : 0);
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200"
                          >
                            Pay Supplier
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenLedger(s)}
                            className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                          >
                            View Ledger
                          </button>
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

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              Register New Supplier / Distributor
            </h2>

            <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company / Mill Name</label>
                <input
                  type="text"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  placeholder="e.g. National Foods & Agro Industries"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Representative</label>
                <input
                  type="text"
                  value={newSupplier.contactPerson}
                  onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                  placeholder="e.g. Tariq Mehmood (Sales Manager)"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    placeholder="+92 21 35061234"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                    placeholder="orders@supplier.com"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Warehouse / Factory Address</label>
                <input
                  type="text"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  placeholder="Industrial Area, City"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white bg-slate-900 hover:bg-slate-800 rounded-md font-semibold"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Ledger Statement Modal */}
      {selectedSupplierForLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Supplier Payable Statement: {selectedSupplierForLedger.name}
                </h2>
                <p className="text-xs text-slate-500">
                  Contact: {selectedSupplierForLedger.contactPerson} · Payable: <b>{formatMoney(selectedSupplierForLedger.payableBalance)}</b>
                </p>
              </div>
              <button
                onClick={() => setSelectedSupplierForLedger(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                    <th className="py-2 px-2.5">Date</th>
                    <th className="py-2 px-2.5">Description</th>
                    <th className="py-2 px-2.5 text-right">Debit (Paid)</th>
                    <th className="py-2 px-2.5 text-right">Credit (Purchased)</th>
                    <th className="py-2 px-2.5 text-right">Payable Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
                  {ledgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                        No transactions recorded for this supplier ledger yet.
                      </td>
                    </tr>
                  ) : (
                    ledgerEntries.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/80">
                        <td className="py-2 px-2.5 text-slate-500 text-[11px]">
                          {new Date(e.date).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-2.5 font-sans font-medium text-slate-900">
                          {e.description}
                        </td>
                        <td className="py-2 px-2.5 text-right tabular-nums text-emerald-700">
                          {e.debit > 0 ? formatMoney(e.debit) : '-'}
                        </td>
                        <td className="py-2 px-2.5 text-right tabular-nums text-rose-700">
                          {e.credit > 0 ? formatMoney(e.credit) : '-'}
                        </td>
                        <td className="py-2 px-2.5 text-right tabular-nums font-bold text-slate-900">
                          {formatMoney(e.balance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSupplierForLedger(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disburse Payment Modal */}
      {selectedSupplierForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Disburse Supplier Payment
            </h3>

            <form onSubmit={handleDisbursePayment} className="space-y-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <p className="font-semibold text-slate-900">{selectedSupplierForPayment.name}</p>
                <div className="flex justify-between pt-1 text-slate-600">
                  <span>Current Payable:</span>
                  <span className="font-mono font-bold text-rose-700">
                    {formatMoney(selectedSupplierForPayment.payableBalance)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Amount Disbursed ({activeBusiness?.currencySymbol || '₨'})
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white"
                >
                  <option value="Bank Transfer">Bank Transfer / Online RTGS</option>
                  <option value="Cash">Cash Voucher</option>
                  <option value="Credit Card">Company Corporate Card</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bank Reference / Cheque #</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. HBL Cheque #00918231"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSupplierForPayment(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-white bg-slate-900 hover:bg-slate-800 rounded-md font-semibold"
                >
                  Confirm Disbursement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
