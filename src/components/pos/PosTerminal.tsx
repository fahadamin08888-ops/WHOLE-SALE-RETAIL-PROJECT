import React, { useState, useEffect, useRef } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { Product, Customer, CartItem, Sale, PaymentMethod } from '../../types/erp.ts';
import { ThermalReceipt } from './ThermalReceipt.tsx';
import { RegisterSessionModal } from './RegisterSessionModal.tsx';
import { 
  Search, 
  Barcode, 
  Trash2, 
  Plus, 
  Minus, 
  UserPlus, 
  CreditCard, 
  Banknote, 
  Building2, 
  UserCheck, 
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Printer,
  Landmark,
  ShoppingBag
} from 'lucide-react';

export const PosTerminal: React.FC = () => {
  const { 
    activeBusiness, 
    currentUserId, 
    currentUserName, 
    activeRegisterSession, 
    reloadRegisterSession,
    formatMoney 
  } = useTenant();

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');

  // Sale Mode: Retail or Wholesale
  const [saleType, setSaleType] = useState<'retail' | 'wholesale'>(
    activeBusiness?.settings.defaultSaleType || 'retail'
  );

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Payment Checkout Modal
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [tenderedAmount, setTenderedAmount] = useState<number>(0);
  const [saleNotes, setSaleNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Load products, customers, and categories for active business
  const loadData = async () => {
    if (!activeBusiness) return;
    try {
      const [pRes, cRes, catRes] = await Promise.all([
        fetch(`/api/products?businessId=${activeBusiness.id}`),
        fetch(`/api/customers?businessId=${activeBusiness.id}`),
        fetch(`/api/categories?businessId=${activeBusiness.id}`),
      ]);
      if (pRes.ok) setProducts(await pRes.json());
      if (cRes.ok) setCustomers(await cRes.json());
      if (catRes.ok) setCategories(await catRes.json());
    } catch (err) {
      console.error('POS load error:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeBusiness]);

  // Recalculate cart item prices when saleType changes
  useEffect(() => {
    setCart((prev) =>
      prev.map((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (!prod) return item;
        const unitPrice = saleType === 'wholesale' ? prod.wholesalePrice : prod.retailPrice;
        return {
          ...item,
          priceType: saleType,
          unitPrice,
          subtotal: unitPrice * item.quantity,
        };
      })
    );
  }, [saleType, products]);

  // Add Product to Cart
  const addToCart = (product: Product) => {
    // Check stock if negative stock disallowed
    if (!activeBusiness?.settings.allowNegativeStock && product.currentStock <= 0) {
      alert(`Product "${product.name}" is out of stock!`);
      return;
    }

    const unitPrice = saleType === 'wholesale' ? product.wholesalePrice : product.retailPrice;

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        const newQty = existing.quantity + 1;
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: newQty, subtotal: item.unitPrice * newQty }
            : item
        );
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            barcode: product.barcode,
            unitPrice,
            costPrice: product.costPrice,
            quantity: 1,
            subtotal: unitPrice,
            unit: product.unit,
            priceType: saleType,
          },
        ];
      }
    });
  };

  // Barcode enter key trigger
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = products.find(
      (p) => p.barcode === barcodeInput.trim() || p.sku.toLowerCase() === barcodeInput.trim().toLowerCase()
    );

    if (matched) {
      addToCart(matched);
      setBarcodeInput('');
    } else {
      alert(`No product found with barcode or SKU: ${barcodeInput}`);
    }
  };

  // Update Item Quantity
  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0
              ? { ...item, quantity: newQty, subtotal: item.unitPrice * newQty }
              : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Remove Item
  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Clear Cart
  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setDiscountPercent(0);
    setSelectedCustomerId('');
  };

  // Computations
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const calculatedDiscount =
    discountType === 'percent'
      ? (subtotal * discountPercent) / 100
      : Math.min(discountAmount, subtotal);

  const taxableAmount = Math.max(0, subtotal - calculatedDiscount);
  const taxRate = activeBusiness?.settings.enableTax ? activeBusiness.settings.taxRate : 0;
  const taxAmount = (taxableAmount * taxRate) / 100;
  const grandTotal = taxableAmount + taxAmount;

  // Selected customer
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Trigger Checkout
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    if (!activeRegisterSession) {
      setShowRegisterModal(true);
      return;
    }
    setTenderedAmount(grandTotal);
    setShowCheckoutModal(true);
  };

  // Process Checkout
  const handleCompleteSale = async () => {
    if (!activeBusiness) return;
    setIsProcessing(true);

    try {
      const salePayload = {
        cashierId: currentUserId,
        cashierName: currentUserName,
        customerId: selectedCustomerId || undefined,
        customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in Retail Customer',
        saleType,
        items: cart.map((c) => ({
          productId: c.productId,
          productName: c.name,
          sku: c.sku,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
          costPrice: c.costPrice,
          subtotal: c.subtotal,
          priceType: c.priceType,
        })),
        subtotal,
        discountAmount: calculatedDiscount,
        taxAmount,
        grandTotal,
        paidAmount: paymentMethod === 'Customer Credit' ? 0 : Math.min(tenderedAmount, grandTotal),
        changeDue: paymentMethod === 'Cash' ? Math.max(0, tenderedAmount - grandTotal) : 0,
        paymentMethod,
        paymentStatus:
          paymentMethod === 'Customer Credit'
            ? 'unpaid'
            : tenderedAmount >= grandTotal
            ? 'paid'
            : 'partial',
        registerSessionId: activeRegisterSession?.id,
        notes: saleNotes || undefined,
      };

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': activeBusiness.id,
        },
        body: JSON.stringify(salePayload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Sale failed');
      }

      const created: Sale = await res.json();
      setCompletedSale(created);
      setShowCheckoutModal(false);
      clearCart();
      await loadData();
      await reloadRegisterSession();
    } catch (err: any) {
      alert(`Error processing sale: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner: POS Controls & Register Status */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-md text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSaleType('retail')}
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
                saleType === 'retail'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Retail Mode
            </button>
            <button
              type="button"
              onClick={() => setSaleType('wholesale')}
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
                saleType === 'wholesale'
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Wholesale Mode (B2B Bulk)
            </button>
          </div>

          <span className="text-xs text-slate-400 hidden sm:inline">|</span>

          {/* Barcode Quick Scanner Form */}
          <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-1.5">
            <div className="relative">
              <Barcode className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan barcode / enter SKU..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono w-48 sm:w-56"
              />
            </div>
            <button
              type="submit"
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
            >
              Add
            </button>
          </form>
        </div>

        {/* Cash Register Status */}
        <div className="flex items-center gap-2">
          {activeRegisterSession ? (
            <button
              type="button"
              onClick={() => setShowRegisterModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors"
            >
              <Landmark className="w-3.5 h-3.5 text-emerald-600" />
              <span>Drawer Active · Expected: <b>{formatMoney(activeRegisterSession.expectedCashInDrawer)}</b></span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowRegisterModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100 transition-colors animate-pulse"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Register Closed · Click to Open Float</span>
            </button>
          )}
        </div>
      </div>

      {/* Main POS Grid: Product Catalog (60%) | Cart & Order Total (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column: Product Search & Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Search & Categories Bar */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name, SKU, or category..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Category Segmented Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors font-medium ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                All Items ({products.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors font-medium ${
                    selectedCategory === c.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[640px] overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const activePrice = saleType === 'wholesale' ? p.wholesalePrice : p.retailPrice;
              const isLowStock = p.currentStock <= p.reorderLevel;
              const isOutOfStock = p.currentStock <= 0;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addToCart(p)}
                  disabled={isOutOfStock && !activeBusiness?.settings.allowNegativeStock}
                  className="bg-white border border-slate-200 rounded-lg p-3 text-left hover:border-indigo-400 hover:shadow-sm transition-all flex flex-col justify-between space-y-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {p.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 font-mono">
                      <span>{p.sku}</span>
                      <span>·</span>
                      <span>{p.unit}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-end justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                        {formatMoney(activePrice)}
                      </p>
                      {saleType === 'wholesale' && (
                        <p className="text-[10px] text-indigo-600 font-medium">
                          Min WS Qty: {p.minWholesaleQty}
                        </p>
                      )}
                    </div>

                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isOutOfStock
                          ? 'bg-rose-50 text-rose-700 font-bold'
                          : isLowStock
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Stock: {p.currentStock}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Cart, Customer & Checkout (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-4 space-y-4 sticky top-4">
          
          {/* Customer Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-700 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                Customer Account
              </label>
              {selectedCustomer && (
                <button
                  type="button"
                  onClick={() => setSelectedCustomerId('')}
                  className="text-slate-400 hover:text-slate-600 text-[11px]"
                >
                  Clear
                </button>
              )}
            </div>

            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Walk-in Retail Customer (Cash Only)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.customerType === 'wholesale' ? '(Wholesale)' : ''} · Bal: {formatMoney(c.outstandingBalance)}
                </option>
              ))}
            </select>

            {/* Selected Customer Credit Callout */}
            {selectedCustomer && (
              <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Credit Limit:</span>
                  <span className="font-mono font-medium">{formatMoney(selectedCustomer.creditLimit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Current Outstanding:</span>
                  <span className={`font-mono font-bold ${selectedCustomer.outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {formatMoney(selectedCustomer.outstandingBalance)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Available Credit:</span>
                  <span className="font-mono text-slate-700">
                    {formatMoney(Math.max(0, selectedCustomer.creditLimit - selectedCustomer.outstandingBalance))}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Cart Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
              <span className="font-semibold text-slate-800">
                Cart Items ({cart.reduce((sum, i) => sum + i.quantity, 0)})
              </span>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-rose-600 hover:text-rose-700 text-[11px] font-medium"
                >
                  Clear Cart
                </button>
              )}
            </div>

            <div className="max-h-[280px] overflow-y-auto space-y-2 divide-y divide-slate-100 pr-1">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-1">
                  <ShoppingBag className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs">Cart is empty</p>
                  <p className="text-[11px] text-slate-400">Click products or scan barcode to add</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.productId} className="pt-2 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {formatMoney(item.unitPrice)} × {item.quantity} {item.unit}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, -1)}
                        className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-mono font-bold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, 1)}
                        className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right shrink-0 w-20">
                      <p className="font-mono font-bold text-slate-900">{formatMoney(item.subtotal)}</p>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId)}
                        className="text-[10px] text-rose-500 hover:text-rose-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pricing Breakdown & Discounts */}
          <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-medium">{formatMoney(subtotal)}</span>
            </div>

            {/* Discount Row */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600">Discount:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  value={discountType === 'percent' ? discountPercent : discountAmount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    if (discountType === 'percent') setDiscountPercent(val);
                    else setDiscountAmount(val);
                  }}
                  className="w-16 px-1.5 py-1 text-right text-xs border border-slate-300 rounded font-mono"
                />
                <button
                  type="button"
                  onClick={() => setDiscountType(discountType === 'fixed' ? 'percent' : 'fixed')}
                  className="px-1.5 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 rounded"
                >
                  {discountType === 'percent' ? '%' : (activeBusiness?.currencySymbol || '₨')}
                </button>
              </div>
            </div>

            {taxRate > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tax / GST ({taxRate}%):</span>
                <span className="font-mono">+{formatMoney(taxAmount)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
              <span className="font-bold text-slate-900 text-sm">Grand Total:</span>
              <span className="font-mono font-bold text-lg text-slate-900">
                {formatMoney(grandTotal)}
              </span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            type="button"
            onClick={handleOpenCheckout}
            disabled={cart.length === 0}
            className="w-full py-3 text-xs font-bold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
          >
            <span>Proceed to Payment</span>
            <span>·</span>
            <span>{formatMoney(grandTotal)}</span>
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="font-bold text-slate-900 text-base">Payment & Thermal Checkout</h2>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Select Payment Method</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Cash', 'Credit Card', 'Bank Transfer', 'Customer Credit'] as PaymentMethod[]).map(
                  (method) => {
                    const isCredit = method === 'Customer Credit';
                    const isAllowed = !isCredit || (selectedCustomer && selectedCustomer.creditLimit > 0);

                    return (
                      <button
                        key={method}
                        type="button"
                        disabled={!isAllowed}
                        onClick={() => setPaymentMethod(method)}
                        className={`p-2.5 rounded-md border text-xs font-medium text-center transition-all ${
                          paymentMethod === method
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        {method}
                      </button>
                    );
                  }
                )}
              </div>
              {paymentMethod === 'Customer Credit' && !selectedCustomerId && (
                <p className="text-[11px] text-rose-600 font-medium">
                  Please select a registered customer with available credit to book on account.
                </p>
              )}
            </div>

            {/* Cash Tendered & Quick Amount Buttons */}
            {paymentMethod === 'Cash' && (
              <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-slate-700">Cash Tendered by Customer</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={tenderedAmount}
                    onChange={(e) => setTenderedAmount(parseFloat(e.target.value) || 0)}
                    className="w-32 px-2.5 py-1.5 text-right font-mono font-bold text-slate-900 border border-slate-300 rounded bg-white text-sm"
                  />
                </div>

                {/* Quick Cash Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTenderedAmount(grandTotal)}
                    className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded hover:bg-slate-100 font-mono"
                  >
                    Exact ({formatMoney(grandTotal)})
                  </button>
                  {[500, 1000, 2000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTenderedAmount(amt)}
                      className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded hover:bg-slate-100 font-mono"
                    >
                      {activeBusiness?.currencySymbol || '₨'}{amt}
                    </button>
                  ))}
                </div>

                {/* Change Due Display */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-bold">
                  <span>Change to Return:</span>
                  <span className={`font-mono ${tenderedAmount >= grandTotal ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {tenderedAmount >= grandTotal
                      ? formatMoney(tenderedAmount - grandTotal)
                      : `Short by ${formatMoney(grandTotal - tenderedAmount)}`}
                  </span>
                </div>
              </div>
            )}

            {/* Sale Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Notes (Optional)</label>
              <input
                type="text"
                value={saleNotes}
                onChange={(e) => setSaleNotes(e.target.value)}
                placeholder="e.g. Delivered to shop counter, gate pass #14"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            {/* Total Summary */}
            <div className="p-3 bg-slate-900 text-white rounded-lg flex items-center justify-between text-xs">
              <div>
                <p className="text-slate-400">Total Payable</p>
                <p className="font-mono font-bold text-base">{formatMoney(grandTotal)}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400">Type: <span className="uppercase text-white">{saleType}</span></p>
                <p className="text-slate-400">Method: <span className="text-white">{paymentMethod}</span></p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing || (paymentMethod === 'Cash' && tenderedAmount < grandTotal)}
                onClick={handleCompleteSale}
                className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors disabled:opacity-40 flex items-center gap-2 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                {isProcessing ? 'Recording Sale...' : 'Complete & Print Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render Thermal Receipt modal if completed sale */}
      {completedSale && activeBusiness && (
        <ThermalReceipt
          sale={completedSale}
          business={activeBusiness}
          onClose={() => setCompletedSale(null)}
        />
      )}

      {/* Register Session Modal */}
      {showRegisterModal && (
        <RegisterSessionModal onClose={() => setShowRegisterModal(false)} />
      )}
    </div>
  );
};
