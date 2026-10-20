import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { CashRegisterSession } from '../../types/erp.ts';
import { Landmark, ArrowUpRight, ArrowDownLeft, X, DollarSign, AlertCircle, Check } from 'lucide-react';

interface RegisterSessionModalProps {
  onClose: () => void;
}

export const RegisterSessionModal: React.FC<RegisterSessionModalProps> = ({ onClose }) => {
  const { 
    activeBusiness, 
    activeRegisterSession, 
    currentUserId, 
    currentUserName, 
    reloadRegisterSession,
    formatMoney 
  } = useTenant();

  const [openingFloat, setOpeningFloat] = useState<number>(10000);
  const [openingNotes, setOpeningNotes] = useState<string>('Daily register opening');
  const [actualCash, setActualCash] = useState<number>(activeRegisterSession?.expectedCashInDrawer || 0);
  const [closingNotes, setClosingNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOpenRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/register/open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': activeBusiness?.id || '',
        },
        body: JSON.stringify({
          userId: currentUserId,
          userName: currentUserName,
          openingFloat,
          notes: openingNotes,
        }),
      });
      if (res.ok) {
        await reloadRegisterSession();
        onClose();
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Failed to open register.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRegisterSession) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/register/close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': activeBusiness?.id || '',
        },
        body: JSON.stringify({
          sessionId: activeRegisterSession.id,
          actualCash,
          notes: closingNotes,
        }),
      });
      if (res.ok) {
        await reloadRegisterSession();
        onClose();
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Failed to close register.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const variance = activeRegisterSession ? actualCash - activeRegisterSession.expectedCashInDrawer : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-5 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-900 text-sm">
              {activeRegisterSession ? 'Reconcile & Close Cash Drawer' : 'Open Cash Register Session'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* If no active session, show Open Register Form */}
        {!activeRegisterSession ? (
          <form onSubmit={handleOpenRegister} className="space-y-4 text-xs">
            <p className="text-slate-600">
              Start a new sales shift by entering the opening float (petty cash in drawer).
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Opening Cash Drawer Float ({activeBusiness?.currencySymbol || '₨'})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={openingFloat}
                onChange={(e) => setOpeningFloat(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Shift Notes / Register ID</label>
              <input
                type="text"
                value={openingNotes}
                onChange={(e) => setOpeningNotes(e.target.value)}
                placeholder="e.g. Counter 1 - Morning shift"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm"
              >
                {isSubmitting ? 'Opening...' : 'Open Register'}
              </button>
            </div>
          </form>
        ) : (
          /* Active session exists -> Show Reconciliation & Close Form */
          <form onSubmit={handleCloseRegister} className="space-y-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Opened At:</span>
                <span className="font-mono text-slate-900">
                  {new Date(activeRegisterSession.openedAt).toLocaleTimeString()} ({activeRegisterSession.userName})
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Opening Float:</span>
                <span className="font-mono text-slate-900">{formatMoney(activeRegisterSession.openingFloat)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Cash Sales:</span>
                <span className="font-mono text-emerald-700">+{formatMoney(activeRegisterSession.cashSales)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Cash Expenses Paid:</span>
                <span className="font-mono text-rose-700">-{formatMoney(activeRegisterSession.cashExpenses)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
                <span>Expected Drawer Cash:</span>
                <span className="font-mono">{formatMoney(activeRegisterSession.expectedCashInDrawer)}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Counted Physical Cash in Drawer ({activeBusiness?.currencySymbol || '₨'})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={actualCash}
                onChange={(e) => setActualCash(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900 font-bold"
                required
              />
            </div>

            {/* Variance indicator */}
            <div
              className={`p-2.5 rounded-md border flex items-center justify-between font-medium ${
                variance === 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : variance > 0
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <span>Cash Variance:</span>
              <span className="font-mono font-bold">
                {variance === 0 && 'Balanced (₨0.00)'}
                {variance > 0 && `Over: +${formatMoney(variance)}`}
                {variance < 0 && `Short: -${formatMoney(Math.abs(variance))}`}
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Closing Remarks</label>
              <textarea
                rows={2}
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder="Shift hand-over notes, explanations for variance..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 resize-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Keep Open
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-sm"
              >
                {isSubmitting ? 'Closing...' : 'Close & Reconcile'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
