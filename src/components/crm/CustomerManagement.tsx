import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { Customer, CustomerLedgerEntry, PaymentMethod } from '../../types/erp.ts';
import { 
  Users, 
  UserPlus, 
  Search, 
  Receipt, 
  DollarSign, 
  CreditCard, 
  ArrowDownLeft, 
  X, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

export const CustomerManagement: React.FC = () => {
  const { activeBusiness, formatMoney } = useTenant();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'wholesale' | 'retail'>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomerForLedger, setSelectedCustomerForLedger] = useState<Customer | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<CustomerLedgerEntry[]>([]);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);

  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // Add form
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    creditLimit: 50000,
    customerType: 'wholesale' as 'retail' | 'wholesale',
  });

  const loadCustomers = async () => {
    if (!activeBusiness) return;
    try {
      const res = await fetch(`/api/customers?businessId=${activeBusiness.id}`);
      if (res.ok) setCustomers(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [activeBusiness]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness) return;
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': activeBusiness.id,
        },
        body: JSON.stringify(newCustomer),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewCustomer({
          name: '',
          phone: '',
          email: '',
          address: '',
          creditLimit: 50000,
          customerType: 'wholesale',
        });
        await loadCustomers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenLedger = async (customer: Customer) => {
    setSelectedCustomerForLedger(customer);
    setIsLoadingLedger(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}/ledger?businessId=${activeBusiness?.id}`);
      if (res.ok) {
        setLedgerEntries(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingLedger(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForPayment || !activeBusiness) return;
    try {
      const res = await fetch(`/api/customers/${selectedCustomerForPayment.id}/payment`, {
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
        setSelectedCustomerForPayment(null);
        setPaymentAmount(0);
        setPaymentNotes('');
        await loadCustomers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesFilter = filterType === 'all' || c.customerType === filterType;
    const matchesQuery =
      !searchQuery.trim() ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesQuery;
  });

  const totalReceivables = customers.reduce((sum, c) => sum + Math.max(0, c.outstandingBalance), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customer Accounts & Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage wholesale client credit limits, track outstanding balances, and record collections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-md bg-slate-100 text-xs font-medium text-slate-700">
            Total Receivables: <b className="font-mono text-slate-900">{formatMoney(totalReceivables)}</b>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer name, phone, or email..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              filterType === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            All Customers ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('wholesale')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              filterType === 'wholesale' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600'
            }`}
          >
            Wholesale
          </button>
          <button
            type="button"
            onClick={() => setFilterType('retail')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              filterType === 'retail' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600'
            }`}
          >
            Retail
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Customer Name</th>
                <th className="py-2.5 px-3">Contact Details</th>
                <th className="py-2.5 px-3">Account Type</th>
                <th className="py-2.5 px-3 text-right">Credit Limit</th>
                <th className="py-2.5 px-3 text-right">Outstanding Balance</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                    No customers found matching filters.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const hasDebt = c.outstandingBalance > 0;
                  const isExceeded = c.outstandingBalance > c.creditLimit;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-sans">
                        <div className="font-semibold text-slate-900">{c.name}</div>
                        <div className="text-[11px] text-slate-400">{c.address || 'No address specified'}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                        <div>{c.phone}</div>
                        <div className="text-slate-400 font-sans text-[10px]">{c.email}</div>
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className="capitalize text-slate-700 font-medium">
                          {c.customerType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-slate-600">
                        {formatMoney(c.creditLimit)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-bold">
                        <span
                          className={`${
                            isExceeded
                              ? 'text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded'
                              : hasDebt
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {formatMoney(c.outstandingBalance)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomerForPayment(c);
                              setPaymentAmount(c.outstandingBalance > 0 ? c.outstandingBalance : 0);
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200"
                          >
                            Receive Payment
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenLedger(c)}
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

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              Add New Customer Account
            </h2>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer / Shop Name</label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="e.g. Al-Madina Wholesale Mart"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    placeholder="+92 300 1234567"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business Address</label>
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  placeholder="Street, City, Market"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Type</label>
                  <select
                    value={newCustomer.customerType}
                    onChange={(e) => setNewCustomer({ ...newCustomer, customerType: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white"
                  >
                    <option value="wholesale">Wholesale (B2B)</option>
                    <option value="retail">Retail</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Credit Limit</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={newCustomer.creditLimit}
                    onChange={(e) => setNewCustomer({ ...newCustomer, creditLimit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                  />
                </div>
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
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Ledger Statement Modal */}
      {selectedCustomerForLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Customer Ledger: {selectedCustomerForLedger.name}
                </h2>
                <p className="text-xs text-slate-500">
                  Phone: {selectedCustomerForLedger.phone} · Outstanding: <b>{formatMoney(selectedCustomerForLedger.outstandingBalance)}</b>
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomerForLedger(null)}
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
                    <th className="py-2 px-2.5 text-right">Debit (Sale)</th>
                    <th className="py-2 px-2.5 text-right">Credit (Paid)</th>
                    <th className="py-2 px-2.5 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
                  {ledgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                        No transactions recorded for this customer ledger yet.
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
                        <td className="py-2 px-2.5 text-right tabular-nums text-rose-700">
                          {e.debit > 0 ? formatMoney(e.debit) : '-'}
                        </td>
                        <td className="py-2 px-2.5 text-right tabular-nums text-emerald-700">
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
                onClick={() => setSelectedCustomerForLedger(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Payment Modal */}
      {selectedCustomerForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Receive Customer Payment
            </h3>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <p className="font-semibold text-slate-900">{selectedCustomerForPayment.name}</p>
                <div className="flex justify-between pt-1 text-slate-600">
                  <span>Current Outstanding:</span>
                  <span className="font-mono font-bold text-rose-600">
                    {formatMoney(selectedCustomerForPayment.outstandingBalance)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Amount Received ({activeBusiness?.currencySymbol || '₨'})
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
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer / Online Deposit</option>
                  <option value="Credit Card">Credit Card POS</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Receipt Reference / Notes</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Cheque #9821 or online slip"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCustomerForPayment(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-white bg-slate-900 hover:bg-slate-800 rounded-md font-semibold"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
