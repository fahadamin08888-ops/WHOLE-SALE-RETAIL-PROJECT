import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { Purchase, Supplier, Product, PurchaseItem } from '../../types/erp.ts';
import { 
  PackagePlus, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Search, 
  X,
  FileCheck
} from 'lucide-react';

export const PurchaseOrders: React.FC = () => {
  const { activeBusiness, formatMoney } = useTenant();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New PO State
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [poItems, setPoItems] = useState<Omit<PurchaseItem, 'id' | 'purchaseId'>[]>([]);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [poNotes, setPoNotes] = useState<string>('');

  const loadData = async () => {
    if (!activeBusiness) return;
    try {
      const [poRes, sRes, pRes] = await Promise.all([
        fetch(`/api/purchases?businessId=${activeBusiness.id}`),
        fetch(`/api/suppliers?businessId=${activeBusiness.id}`),
        fetch(`/api/products?businessId=${activeBusiness.id}`),
      ]);
      if (poRes.ok) setPurchases(await poRes.json());
      if (sRes.ok) setSuppliers(await sRes.json());
      if (pRes.ok) setProducts(await pRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeBusiness]);

  const handleAddItem = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setPoItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        productName: prod.name,
        quantity: 10,
        unitCost: prod.costPrice,
        subtotal: prod.costPrice * 10,
      },
    ]);
  };

  const handleUpdateItem = (index: number, quantity: number, unitCost: number) => {
    setPoItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              quantity,
              unitCost,
              subtotal: quantity * unitCost,
            }
          : item
      )
    );
  };

  const handleRemoveItem = (index: number) => {
    setPoItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalPoAmount = poItems.reduce((sum, item) => sum + item.subtotal, 0);

  const handleCreatePurchaseOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness || !selectedSupplierId || poItems.length === 0) return;

    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    if (!supplier) return;

    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': activeBusiness.id,
        },
        body: JSON.stringify({
          supplierId: supplier.id,
          supplierName: supplier.name,
          items: poItems,
          totalAmount: totalPoAmount,
          paidAmount,
          paymentStatus:
            paidAmount >= totalPoAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
          status: 'received',
          notes: poNotes,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setPoItems([]);
        setPaidAmount(0);
        setPoNotes('');
        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Purchase Orders & Goods Receiving</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Procure inventory from suppliers, receive goods into warehouse, and update supplier payable ledgers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedSupplierId(suppliers[0]?.id || '');
            setPoItems([]);
            setPaidAmount(0);
            setShowCreateModal(true);
          }}
          className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <PackagePlus className="w-4 h-4" />
          Receive Goods (New PO)
        </button>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">PO Number</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Supplier Name</th>
                <th className="py-2.5 px-3 text-center">Items Received</th>
                <th className="py-2.5 px-3 text-right">Total Invoice</th>
                <th className="py-2.5 px-3 text-right">Paid</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                    No purchase orders recorded yet.
                  </td>
                </tr>
              ) : (
                purchases.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 font-mono">
                      {po.poNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                      {new Date(po.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                      {po.supplierName}
                    </td>
                    <td className="py-2.5 px-3 text-center tabular-nums">
                      {po.items.length} items
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold text-slate-900">
                      {formatMoney(po.totalAmount)}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-emerald-700">
                      {formatMoney(po.paidAmount)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Received
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receive Goods (PO) Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                Receive Goods & Intake Inventory
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePurchaseOrder} className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
              {/* Supplier Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Supplier</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white font-medium"
                  required
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Payable: {formatMoney(s.payableBalance)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Add Product to Intake</label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddItem(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-700"
                >
                  <option value="">+ Click to choose product to receive...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) · Cost: {formatMoney(p.costPrice)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Items List */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Product</th>
                      <th className="py-2 px-3 w-24">Qty Received</th>
                      <th className="py-2 px-3 w-32 text-right">Unit Cost</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                      <th className="py-2 px-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {poItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400 font-sans">
                          No items added. Select products above to receive stock.
                        </td>
                      </tr>
                    ) : (
                      poItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-sans font-medium text-slate-900">
                            {item.productName}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItem(idx, parseInt(e.target.value, 10) || 1, item.unitCost)
                              }
                              className="w-20 px-2 py-1 border border-slate-300 rounded text-center"
                            />
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.unitCost}
                              onChange={(e) =>
                                handleUpdateItem(idx, item.quantity, parseFloat(e.target.value) || 0)
                              }
                              className="w-28 px-2 py-1 border border-slate-300 rounded text-right"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            {formatMoney(item.subtotal)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Summary & Payment */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                <div className="flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>Total Purchase Invoice:</span>
                  <span className="font-mono text-base">{formatMoney(totalPoAmount)}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Immediate Payment Paid to Supplier ({activeBusiness?.currencySymbol || '₨'})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Unpaid Amount (Added to Supplier Payable)
                    </label>
                    <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-md font-mono font-bold text-rose-700">
                      {formatMoney(Math.max(0, totalPoAmount - paidAmount))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Receiving Remarks / Delivery Bilty #</label>
                  <input
                    type="text"
                    value={poNotes}
                    onChange={(e) => setPoNotes(e.target.value)}
                    placeholder="e.g. Received via TCS Freight, Bilty #8912"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={poItems.length === 0 || !selectedSupplierId}
                  className="px-5 py-2 text-white bg-slate-900 hover:bg-slate-800 rounded-md font-semibold disabled:opacity-40"
                >
                  Confirm Goods Receipt & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
