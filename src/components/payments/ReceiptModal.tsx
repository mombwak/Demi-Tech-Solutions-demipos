import React from 'react';
import { X, Printer, Check, QrCode } from 'lucide-react';
import { Sale } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { formatKES } from '../../utils/formatters';

interface ReceiptModalProps {
  sale: Sale;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  const { currentTenant, currentBranch } = useAuth();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div 
        id="receipt-preview-dialog"
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-gray-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Actions Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Fiscal Receipt Generated
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="print-receipt-action-btn"
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="close-receipt-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Receipt Scrollable Body (Designed like 80mm ESC/POS Thermal Paper) */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex justify-center">
          <div className="w-full max-w-[320px] bg-white p-5 border border-gray-200 shadow-sm font-mono text-[11px] text-gray-800 leading-relaxed">
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-gray-300">
              <h3 className="text-sm font-black uppercase text-gray-900">{currentTenant.name}</h3>
              <p className="text-[10px] text-gray-600">{currentBranch.name}</p>
              <p className="text-[10px] text-gray-600">{currentBranch.address}</p>
              <p className="text-[10px] text-gray-600">TEL: {currentBranch.phone}</p>
              <p className="text-[10px] font-bold mt-1">KRA PIN: {currentTenant.kraPin}</p>
              <p className="text-[9px] text-gray-500">ETIMS DEV: {currentBranch.etimsDeviceId || 'VSCU-KEN-01'}</p>
            </div>

            {/* Meta */}
            <div className="py-2.5 border-b border-dashed border-gray-300 text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>RECEIPT:</span>
                <span className="font-bold">{sale.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE:</span>
                <span>{new Date(sale.createdAt).toLocaleDateString()} {new Date(sale.createdAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span>TABLE / LANE:</span>
                <span className="font-bold">{sale.tableNumber || 'Retail Counter'}</span>
              </div>
              <div className="flex justify-between">
                <span>CASHIER:</span>
                <span>{sale.cashierName}</span>
              </div>
              {sale.waiterName && (
                <div className="flex justify-between">
                  <span>SERVER:</span>
                  <span>{sale.waiterName}</span>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="py-2.5 border-b border-dashed border-gray-300 space-y-1.5">
              {sale.items.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between font-bold">
                    <span>{item.productName}</span>
                    <span>{formatKES(item.unitPrice * item.quantity)}</span>
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {item.quantity} × {formatKES(item.unitPrice)}
                    {item.notes && <span className="italic ml-1">({item.notes})</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-2.5 border-b border-dashed border-gray-300 space-y-1">
              <div className="flex justify-between text-gray-600">
                <span>TAXABLE BASE:</span>
                <span>{formatKES(sale.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>VAT 16.0%:</span>
                <span>{formatKES(sale.taxTotal)}</span>
              </div>
              <div className="flex justify-between text-xs font-black text-gray-900 pt-1 border-t border-gray-200">
                <span>TOTAL PAYABLE:</span>
                <span>{formatKES(sale.grandTotal)}</span>
              </div>
            </div>

            {/* Payment Tender Details */}
            <div className="py-2.5 border-b border-dashed border-gray-300 space-y-1">
              <span className="font-bold text-[10px] uppercase">PAYMENT TENDERS:</span>
              {sale.payments.map((p, idx) => (
                <div key={idx} className="flex justify-between text-[10px]">
                  <span>
                    {p.method} {p.transactionRef ? `(${p.transactionRef})` : ''}:
                  </span>
                  <span>{formatKES(p.amountApplied)}</span>
                </div>
              ))}
              {sale.payments.some(p => p.changeGiven > 0) && (
                <div className="flex justify-between text-[10px] font-bold text-gray-900">
                  <span>CHANGE RETURNED:</span>
                  <span>{formatKES(sale.payments.reduce((s, p) => s + p.changeGiven, 0))}</span>
                </div>
              )}
            </div>

            {/* eTIMS Fiscal Compliance Block */}
            <div className="pt-3 text-center space-y-1">
              <p className="font-bold text-[10px] text-emerald-900 uppercase">KRA eTIMS FISCAL INVOICE</p>
              <p className="text-[9px] text-gray-600 font-mono break-all">{sale.etimsInvoiceNumber}</p>
              
              {/* Simulated QR Code Graphic */}
              <div className="my-2 p-2 border border-gray-300 rounded inline-block bg-white">
                <QrCode className="w-20 h-20 text-gray-900 mx-auto" />
                <span className="text-[8px] text-gray-500 uppercase block mt-1">Scan to Verify KRA</span>
              </div>

              <p className="text-[9px] text-gray-500 italic mt-2">
                Asante Sana! Thank you for dining with us!
              </p>
              <p className="text-[8px] text-gray-400">Powered by DEMIPOS Commercial Platform</p>
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <div className="p-4 bg-white border-t border-gray-200">
          <button
            type="button"
            id="done-receipt-btn"
            onClick={onClose}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
          >
            Done / Return to Floor
          </button>
        </div>
      </div>
    </div>
  );
};
