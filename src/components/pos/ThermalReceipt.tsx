import React, { useState } from 'react';
import { Sale, Business } from '../../types/erp.ts';
import { Printer, X, Download, FileText } from 'lucide-react';

interface ThermalReceiptProps {
  sale: Sale;
  business: Business;
  onClose?: () => void;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ sale, business, onClose }) => {
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(
    business.settings.thermalPrinterWidth || '80mm'
  );

  const handlePrint = () => {
    // Populate the hidden print area
    const printArea = document.getElementById('thermal-print-area');
    const receiptContent = document.getElementById('rendered-thermal-receipt');
    if (printArea && receiptContent) {
      printArea.innerHTML = receiptContent.innerHTML;
      window.print();
    }
  };

  const currencySymbol = business.currencySymbol || '₨';
  const widthClasses = paperWidth === '58mm' ? 'max-w-[280px] text-[11px]' : 'max-w-[380px] text-xs';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-lg w-full p-5 space-y-4 shadow-2xl relative my-auto">
        
        {/* Header Controls */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-slate-900 text-sm">Thermal POS Receipt</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Paper Width Selector */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-md text-xs font-medium">
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={`px-2 py-1 rounded transition-colors ${
                  paperWidth === '58mm' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600'
                }`}
              >
                58 mm
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={`px-2 py-1 rounded transition-colors ${
                  paperWidth === '80mm' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600'
                }`}
              >
                80 mm
              </button>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Receipt Container Preview */}
        <div className="flex justify-center p-3 bg-slate-100/70 rounded-lg max-h-[60vh] overflow-y-auto">
          <div
            id="rendered-thermal-receipt"
            className={`w-full ${widthClasses} bg-white p-4 shadow-sm border border-slate-200 font-mono text-slate-900 leading-tight space-y-2 select-text`}
          >
            {/* Business Header */}
            <div className="text-center space-y-0.5">
              <h2 className="font-bold text-sm uppercase tracking-wide">{business.name}</h2>
              <p className="text-[10px] text-slate-600 whitespace-pre-line">{business.address}</p>
              <p className="text-[10px] text-slate-600">Tel: {business.phone}</p>
              {business.settings.receiptHeaderNote && (
                <p className="text-[10px] text-slate-500 whitespace-pre-line pt-1">
                  {business.settings.receiptHeaderNote}
                </p>
              )}
            </div>

            <div className="border-b border-dashed border-slate-400 pt-1"></div>

            {/* Invoice Info */}
            <div className="text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>INVOICE:</span>
                <span className="font-bold">{sale.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE:</span>
                <span>{new Date(sale.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>CASHIER:</span>
                <span>{sale.cashierName}</span>
              </div>
              {sale.customerName && (
                <div className="flex justify-between">
                  <span>CUSTOMER:</span>
                  <span className="truncate max-w-[180px]">{sale.customerName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>SALE TYPE:</span>
                <span className="uppercase font-semibold">{sale.saleType}</span>
              </div>
            </div>

            <div className="border-b border-dashed border-slate-400 pt-1"></div>

            {/* Line Items Header */}
            <div className="grid grid-cols-12 text-[10px] font-bold pb-1 border-b border-slate-300">
              <span className="col-span-6">ITEM</span>
              <span className="col-span-2 text-center">QTY</span>
              <span className="col-span-4 text-right">AMOUNT</span>
            </div>

            {/* Items List */}
            <div className="space-y-1.5 pt-1 text-[11px]">
              {sale.items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 leading-tight">
                  <div className="col-span-6">
                    <p className="font-medium truncate">{item.productName}</p>
                    <p className="text-[9px] text-slate-500">
                      @{currencySymbol}{item.unitPrice} {item.priceType === 'wholesale' ? '(WS)' : ''}
                    </p>
                  </div>
                  <div className="col-span-2 text-center tabular-nums">
                    {item.quantity}
                  </div>
                  <div className="col-span-4 text-right tabular-nums font-semibold">
                    {currencySymbol}{item.subtotal.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-b border-dashed border-slate-400 pt-2"></div>

            {/* Financial Summary */}
            <div className="text-[11px] space-y-1 pt-1">
              <div className="flex justify-between">
                <span>SUBTOTAL:</span>
                <span className="tabular-nums">{currencySymbol}{sale.subtotal.toLocaleString()}</span>
              </div>
              {sale.discountAmount > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>DISCOUNT:</span>
                  <span className="tabular-nums">-{currencySymbol}{sale.discountAmount.toLocaleString()}</span>
                </div>
              )}
              {sale.taxAmount > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>TAX / GST:</span>
                  <span className="tabular-nums">+{currencySymbol}{sale.taxAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-300">
                <span>TOTAL:</span>
                <span className="tabular-nums">{currencySymbol}{sale.grandTotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-[11px] pt-1">
                <span>PAYMENT ({sale.paymentMethod}):</span>
                <span className="tabular-nums">{currencySymbol}{sale.paidAmount.toLocaleString()}</span>
              </div>

              {sale.changeDue > 0 && (
                <div className="flex justify-between text-[11px]">
                  <span>CHANGE DUE:</span>
                  <span className="tabular-nums font-bold">{currencySymbol}{sale.changeDue.toLocaleString()}</span>
                </div>
              )}

              {sale.grandTotal - sale.paidAmount > 0 && (
                <div className="flex justify-between text-[11px] text-slate-800 font-bold">
                  <span>BALANCE DUE (CREDIT):</span>
                  <span className="tabular-nums">{currencySymbol}{(sale.grandTotal - sale.paidAmount).toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="border-b border-dashed border-slate-400 pt-2"></div>

            {/* Barcode representation */}
            <div className="text-center pt-2 space-y-1">
              <div className="tracking-[0.25em] text-xs font-bold font-mono">
                |||| | ||||| ||| |||| | ||||| ||||
              </div>
              <p className="text-[9px] text-slate-500">{sale.invoiceNumber}</p>
            </div>

            {/* Footer Message */}
            <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-slate-200 whitespace-pre-line">
              {business.settings.receiptFooterNote || 'Thank you for your visit!\nPlease come again.'}
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              Close
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print Receipt ({paperWidth})
          </button>
        </div>
      </div>
    </div>
  );
};
