import React, { useState } from 'react';
import { X, Printer, CheckCircle2, AlertTriangle, FileText, Banknote } from 'lucide-react';
import { usePos } from '../../context/PosContext';
import { useAuth } from '../../context/AuthContext';
import { formatKES, posAudio } from '../../utils/formatters';

interface ZReportModalProps {
  onClose: () => void;
}

export const ZReportModal: React.FC<ZReportModalProps> = ({ onClose }) => {
  const { tillSession } = usePos();
  const { currentTenant, currentBranch, currentUser } = useAuth();
  const [actualCashCount, setActualCashCount] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const countedCash = Number(actualCashCount) || 0;
  const variance = countedCash - tillSession.expectedCash;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div 
        id="z-report-dialog"
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-900 text-white">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-base">Shift Till Z-Report (End of Shift)</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Business / Outlet:</span>
              <span className="font-bold text-gray-900">{currentBranch.name}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Cashier / Till Operator:</span>
              <span className="font-bold text-gray-900">{tillSession.cashierName}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shift Opened:</span>
              <span>{tillSession.openedAt}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Opening Cash Float:</span>
              <span className="font-mono font-bold">{formatKES(tillSession.openingFloat)}</span>
            </div>
          </div>

          {/* Sales by Tender */}
          <div>
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Sales Breakdown by Tender Method
            </h4>
            <div className="space-y-1.5 p-3 bg-white border border-gray-200 rounded-xl text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Cash Received at Till:</span>
                <span className="font-mono font-bold text-gray-900">
                  {formatKES(tillSession.expectedCash - tillSession.openingFloat)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">M-Pesa Collections (Daraja):</span>
                <span className="font-mono font-bold text-emerald-700">
                  {formatKES(tillSession.totalMpesa)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Card / Visa Transactions:</span>
                <span className="font-mono font-bold text-blue-700">
                  {formatKES(tillSession.totalCard)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 text-sm font-black">
                <span>Total Shift Gross Revenue:</span>
                <span className="font-mono text-emerald-800">
                  {formatKES(tillSession.totalSales)}
                </span>
              </div>
            </div>
          </div>

          {/* Blind Cash Count & Variance */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-emerald-700" />
              <span>Physical Cash Drawer Count</span>
            </h4>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">System Expected Cash in Drawer:</span>
              <span className="font-mono font-bold text-gray-900">{formatKES(tillSession.expectedCash)}</span>
            </div>

            <div>
              <label className="text-xs text-gray-600 block mb-1">
                Enter Actual Cash Counted in Drawer (Float + Cash Sales):
              </label>
              <input
                type="number"
                id="cash-drawer-count-input"
                value={actualCashCount}
                onChange={(e) => setActualCashCount(e.target.value)}
                placeholder="e.g. 16500"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono font-bold text-gray-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            {actualCashCount && (
              <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                variance === 0
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                  : variance > 0
                    ? 'bg-blue-100 border-blue-300 text-blue-900'
                    : 'bg-red-100 border-red-300 text-red-900'
              }`}>
                <span className="font-bold">
                  {variance === 0 ? 'Exact Balance (Zero Discrepancy)' : variance > 0 ? 'Cash Surplus (Over)' : 'Cash Shortage (Deficit)'}
                </span>
                <span className="font-mono font-bold">
                  {variance > 0 ? `+${formatKES(variance)}` : formatKES(variance)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Z-Report</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Close / Done
          </button>
        </div>
      </div>
    </div>
  );
};
