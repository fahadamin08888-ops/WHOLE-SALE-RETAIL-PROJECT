import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { Expense, PaymentMethod } from '../../types/erp.ts';
import { 
  Receipt, 
  Plus, 
  Search, 
  DollarSign, 
  Landmark, 
  Calendar 
} from 'lucide-react';

export const ExpenseTracker: React.FC = () => {
  const { activeBusiness, activeRegisterSession, reloadRegisterSession, formatMoney } = useTenant();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const [category, setCategory] = useState<Expense['category']>('Utilities');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [deductFromRegister, setDeductFromRegister] = useState(true);

  const loadExpenses = async () => {
    if (!activeBusiness) return;
    try {
      const res = await fetch(`/api/expenses?businessId=${activeBusiness.id}`);
      if (res.ok) setExpenses(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [activeBusiness]);

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness || amount <= 0 || !description.trim()) return;

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': activeBusiness.id,
        },
        body: JSON.stringify({
          category,
          description,
          amount,
          paymentMethod,
          date: new Date().toISOString(),
          registerSessionId: deductFromRegister && paymentMethod === 'Cash' ? activeRegisterSession?.id : undefined,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setDescription('');
        setAmount(0);
        await loadExpenses();
        await reloadRegisterSession();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Business Operating Expenses</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log overheads, utilities, logistics freight, generator fuel, and staff disbursements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-md bg-slate-100 text-xs font-medium text-slate-700">
            Total Logged: <b className="font-mono text-slate-900">{formatMoney(totalExpense)}</b>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Log New Expense
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Expense Category</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Payment Method</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                    No operating expenses recorded yet.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                      {new Date(exp.date).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className="font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                      {exp.description}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-600">
                      {exp.paymentMethod} {exp.registerSessionId ? '(Drawer Paid)' : ''}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold text-rose-700">
                      {formatMoney(exp.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              Record Operating Expense
            </h2>

            <form onSubmit={handleRecordExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expense Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white font-medium"
                >
                  <option value="Utilities">Utilities & Electric / Fuel</option>
                  <option value="Rent">Shop / Warehouse Rent</option>
                  <option value="Salaries">Staff Wages & Daily Allowances</option>
                  <option value="Logistics">Logistics & Goods Freight</option>
                  <option value="Maintenance">Store Equipment Maintenance</option>
                  <option value="Supplies">Packing Material & Office Supplies</option>
                  <option value="Marketing">Local Marketing & Signage</option>
                  <option value="Other">Miscellaneous General Expense</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expense Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Generator diesel 20 Litres"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Amount Paid ({activeBusiness?.currencySymbol || '₨'})
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
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
                  <option value="Cash">Cash Drawer</option>
                  <option value="Bank Transfer">Bank Account</option>
                  <option value="Credit Card">Card</option>
                </select>
              </div>

              {paymentMethod === 'Cash' && activeRegisterSession && (
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded border border-slate-200">
                  <input
                    type="checkbox"
                    id="deductDrawer"
                    checked={deductFromRegister}
                    onChange={(e) => setDeductFromRegister(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="deductDrawer" className="text-slate-700 font-medium">
                    Deduct directly from active cash register drawer ({formatMoney(activeRegisterSession.expectedCashInDrawer)} available)
                  </label>
                </div>
              )}

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
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
