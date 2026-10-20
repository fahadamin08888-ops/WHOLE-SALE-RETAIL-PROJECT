import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { Product, Category } from '../../types/erp.ts';
import { 
  Plus, 
  Search, 
  AlertCircle, 
  ArrowUpDown, 
  Layers, 
  Edit3, 
  SlidersHorizontal,
  Package,
  FileSpreadsheet,
  Check
} from 'lucide-react';

export const ProductManagement: React.FC = () => {
  const { activeBusiness, formatMoney } = useTenant();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('Stock intake');

  // New/Edit form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    costPrice: 0,
    retailPrice: 0,
    wholesalePrice: 0,
    minWholesaleQty: 5,
    currentStock: 0,
    reorderLevel: 10,
    unit: 'pcs',
  });

  const loadData = async () => {
    if (!activeBusiness) return;
    try {
      const [pRes, cRes] = await Promise.all([
        fetch(`/api/products?businessId=${activeBusiness.id}`),
        fetch(`/api/categories?businessId=${activeBusiness.id}`),
      ]);
      if (pRes.ok) setProducts(await pRes.json());
      if (cRes.ok) setCategories(await cRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeBusiness]);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      barcode: Math.floor(100000000000 + Math.random() * 900000000000).toString(),
      categoryId: categories[0]?.id || '',
      costPrice: 0,
      retailPrice: 0,
      wholesalePrice: 0,
      minWholesaleQty: 5,
      currentStock: 0,
      reorderLevel: 10,
      unit: 'pcs',
    });
    setEditingProduct(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setFormData({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      categoryId: p.categoryId,
      costPrice: p.costPrice,
      retailPrice: p.retailPrice,
      wholesalePrice: p.wholesalePrice,
      minWholesaleQty: p.minWholesaleQty,
      currentStock: p.currentStock,
      reorderLevel: p.reorderLevel,
      unit: p.unit,
    });
    setEditingProduct(p);
    setShowAddModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness) return;

    const matchedCat = categories.find((c) => c.id === formData.categoryId);
    const payload = {
      ...formData,
      categoryName: matchedCat ? matchedCat.name : '',
      isActive: true,
    };

    try {
      if (editingProduct) {
        // Update
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-business-id': activeBusiness.id,
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setShowAddModal(false);
          await loadData();
        }
      } else {
        // Create
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-business-id': activeBusiness.id,
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setShowAddModal(false);
          await loadData();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStockAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || !activeBusiness) return;

    try {
      const res = await fetch('/api/products/stock-adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': activeBusiness.id,
        },
        body: JSON.stringify({
          productId: adjustingProduct.id,
          delta: adjustDelta,
          reason: adjustReason,
        }),
      });

      if (res.ok) {
        setAdjustingProduct(null);
        setAdjustDelta(0);
        await loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesQuery =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);
    const matchesLowStock = !showLowStockOnly || p.currentStock <= p.reorderLevel;
    return matchesCat && matchesQuery && matchesLowStock;
  });

  return (
    <div className="space-y-5">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Products & Inventory Control</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage wholesale and retail pricing tiers, reorder thresholds, and stock movements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product name, SKU, or barcode..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`px-3 py-1.5 rounded-md border font-medium transition-colors flex items-center gap-1.5 ${
              showLowStockOnly
                ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            Low Stock Only ({products.filter((p) => p.currentStock <= p.reorderLevel).length})
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Product Name & SKU</th>
                <th className="py-2.5 px-3">Barcode</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Cost Price</th>
                <th className="py-2.5 px-3 text-right">Retail Price</th>
                <th className="py-2.5 px-3 text-right">Wholesale Price</th>
                <th className="py-2.5 px-3 text-center">Stock / Reorder</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.currentStock <= p.reorderLevel;
                  const isOut = p.currentStock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-sans">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{p.sku}</div>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-600 font-mono">
                        {p.barcode}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-700">
                        {p.categoryName || 'General'}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-slate-600">
                        {formatMoney(p.costPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-slate-900">
                        {formatMoney(p.retailPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-indigo-700 font-medium">
                        {formatMoney(p.wholesalePrice)}
                        <span className="text-[10px] text-slate-400 block font-sans">
                          min {p.minWholesaleQty} {p.unit}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            isOut
                              ? 'bg-rose-100 text-rose-800'
                              : isLow
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {p.currentStock} {p.unit}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-sans">
                          Min: {p.reorderLevel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustingProduct(p);
                              setAdjustDelta(0);
                            }}
                            className="px-2 py-1 text-[11px] text-indigo-700 hover:bg-indigo-50 rounded border border-indigo-200"
                            title="Adjust inventory"
                          >
                            Adjust
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                            title="Edit Product"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
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

      {/* Add / Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              {editingProduct ? 'Edit Product' : 'Add New ERP Product'}
            </h2>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Title</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Super Kernel Basmati Rice 5kg"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="pcs, bag, carton, kg, box"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                    required
                  />
                </div>
              </div>

              {/* Pricing Tiers */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cost Price</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Retail Price</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.retailPrice}
                    onChange={(e) => setFormData({ ...formData, retailPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Wholesale Price</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.wholesalePrice}
                    onChange={(e) => setFormData({ ...formData, wholesalePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono font-bold text-indigo-700"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Wholesale Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minWholesaleQty}
                    onChange={(e) => setFormData({ ...formData, minWholesaleQty: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Current Stock</label>
                  <input
                    type="number"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reorder Threshold</label>
                  <input
                    type="number"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono"
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
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Adjust Stock: {adjustingProduct.name}
            </h3>

            <form onSubmit={handleStockAdjust} className="space-y-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-600">Current Stock:</span>
                  <span className="font-mono font-bold">{adjustingProduct.currentStock} {adjustingProduct.unit}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">New Resulting Stock:</span>
                  <span className="font-mono font-bold text-indigo-700">
                    {adjustingProduct.currentStock + adjustDelta} {adjustingProduct.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Quantity Change (+ for in, - for out)
                </label>
                <input
                  type="number"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason (Audit Requirement)</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white"
                >
                  <option value="Manual stock intake">Manual stock intake</option>
                  <option value="Physical count correction">Physical count correction</option>
                  <option value="Damaged or expired goods">Damaged or expired goods</option>
                  <option value="Customer return without invoice">Customer return without invoice</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-white bg-slate-900 hover:bg-slate-800 rounded-md font-semibold"
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
