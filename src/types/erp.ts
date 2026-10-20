/**
 * Multi-Business ERP Software Service Platform Type Definitions
 */

export type BusinessType = 
  | 'Retail'
  | 'Wholesale'
  | 'Supermarket'
  | 'Pharmacy'
  | 'Hardware & Building'
  | 'Electronics'
  | 'General Trading';

export type UserRole = 
  | 'super_admin'
  | 'owner'
  | 'manager'
  | 'cashier'
  | 'inventory_clerk'
  | 'accountant';

export type SheetsConnectionStatus = 'Connected' | 'Not Connected' | 'Error';

export interface GoogleSheetsConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string; // Encrypted on server, masked in frontend
  hasPrivateKey?: boolean;
  spreadsheetId: string;
  oauthClientId?: string;
  oauthClientSecret?: string; // Encrypted on server, masked in frontend
  hasOauthSecret?: boolean;
  oauthRedirectUri?: string;
  connectionStatus: SheetsConnectionStatus;
  lastTestedAt?: string;
  lastSyncAt?: string;
  errorMessage?: string;
  verifiedWorksheets?: string[];
  isSimulatedDemo?: boolean;
}

export interface Business {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  businessType: BusinessType;
  currency: string;
  currencySymbol: string;
  timezone: string;
  status: 'active' | 'suspended';
  subscriptionPlan: 'Trial' | 'Starter' | 'Professional' | 'Enterprise';
  createdAt: string;
  googleSheetsConfig: GoogleSheetsConfig;
  settings: {
    receiptHeaderNote?: string;
    receiptFooterNote?: string;
    taxRate: number; // e.g. 0 or 15%
    enableTax: boolean;
    thermalPrinterWidth: '58mm' | '80mm';
    allowNegativeStock: boolean;
    defaultSaleType: 'retail' | 'wholesale';
  };
}

export interface User {
  id: string;
  businessId: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  businessId: string;
  name: string;
  code: string;
  description?: string;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  categoryName?: string;
  costPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  minWholesaleQty: number;
  currentStock: number;
  reorderLevel: number;
  unit: string; // 'pcs', 'box', 'kg', 'carton', 'meter'
  isActive: boolean;
  updatedAt: string;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  creditLimit: number;
  outstandingBalance: number; // Positive means customer owes business
  customerType: 'retail' | 'wholesale';
  createdAt: string;
}

export interface Supplier {
  id: string;
  businessId: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  payableBalance: number; // Positive means business owes supplier
  createdAt: string;
}

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  barcode: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  subtotal: number;
  unit: string;
  priceType: 'retail' | 'wholesale';
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  subtotal: number;
  priceType: 'retail' | 'wholesale';
}

export type PaymentMethod = 'Cash' | 'Credit Card' | 'Bank Transfer' | 'Customer Credit';

export interface Sale {
  id: string;
  businessId: string;
  invoiceNumber: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  saleType: 'retail' | 'wholesale';
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  changeDue: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  registerSessionId?: string;
  notes?: string;
  createdAt: string;
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export interface Purchase {
  id: string;
  businessId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  status: 'received' | 'pending';
  notes?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  businessId: string;
  type: 'sale_receipt' | 'customer_payment' | 'supplier_payment' | 'expense';
  referenceId?: string; // saleId, purchaseId, customerId, supplierId
  amount: number;
  method: PaymentMethod;
  notes?: string;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  businessId: string;
  productId: string;
  productName: string;
  type: 'sale' | 'purchase' | 'adjustment_in' | 'adjustment_out' | 'return';
  quantityDelta: number;
  previousStock: number;
  newStock: number;
  reason: string;
  referenceId?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  businessId: string;
  category: 'Rent' | 'Utilities' | 'Salaries' | 'Logistics' | 'Maintenance' | 'Supplies' | 'Marketing' | 'Other';
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  registerSessionId?: string;
}

export interface CustomerLedgerEntry {
  id: string;
  businessId: string;
  customerId: string;
  date: string;
  description: string;
  referenceType: 'sale' | 'payment' | 'opening_balance';
  referenceId: string;
  debit: number; // Increase balance (sale)
  credit: number; // Decrease balance (payment)
  balance: number;
}

export interface SupplierLedgerEntry {
  id: string;
  businessId: string;
  supplierId: string;
  date: string;
  description: string;
  referenceType: 'purchase' | 'payment' | 'opening_balance';
  referenceId: string;
  debit: number; // Decrease balance (payment)
  credit: number; // Increase balance (purchase)
  balance: number;
}

export interface CashRegisterSession {
  id: string;
  businessId: string;
  userId: string;
  userName: string;
  openedAt: string;
  closedAt?: string;
  openingFloat: number;
  cashSales: number;
  cardSales: number;
  bankSales: number;
  creditSales: number;
  cashExpenses: number;
  expectedCashInDrawer: number;
  actualCashInDrawer?: number;
  cashDifference?: number;
  status: 'open' | 'closed';
  notes?: string;
}

export interface AuditLog {
  id: string;
  businessId: string;
  userId: string;
  userName: string;
  action: string;
  module: 'AUTH' | 'INTEGRATION' | 'POS' | 'INVENTORY' | 'PURCHASES' | 'CUSTOMERS' | 'SUPPLIERS' | 'EXPENSES' | 'SETTINGS' | 'PLATFORM';
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface DashboardSummary {
  todaySales: number;
  todayOrders: number;
  monthSales: number;
  totalReceivables: number;
  totalPayables: number;
  totalStockValueCost: number;
  totalStockValueRetail: number;
  lowStockCount: number;
  recentSales: Sale[];
  salesTrend: { date: string; amount: number; count: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
}
