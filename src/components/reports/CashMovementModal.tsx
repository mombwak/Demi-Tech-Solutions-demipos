import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Banknote, AlertCircle } from 'lucide-react';
import { usePos } from '../../context/PosContext';
import { useAuth } from '../../context/AuthContext';
import { formatKES, posAudio } from '../../utils/formatters';

interface CashMovementModalProps {
  onClose: () => void;
}

export const CashMovementModal: React.FC<CashMovementModalProps> = ({ onClose }) => {
  const { tillSession, recordCashMovement } = usePos();
  const { currentUser } = useAuth();

  const [type, setType] = useState<'PAID_OUT' | 'PAID_IN'>('PAID_OUT');
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const parsedAmount = Number(amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }
    if (!reason.trim()) {
      setError('Please enter a specific reason / description for this cash movement.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await recordCashMovement(tillSession.id, type, parsedAmount, reason.trim());
      posAudio.playBeep();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record cash movement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none">
      <div 
        id="cash-movement-dialog"
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-900 text-white">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg text-white ${type === 'PAID_OUT' ? 'bg-amber-600' : 'bg-emerald-600'}`}>
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Cash Drawer Movement</h2>
              <p className="text-[11px] text-gray-400">Petty Cash Out / Float Add In</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Movement Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              id="movement-type-out"
              onClick={() => {
                posAudio.playBeep();
                setType('PAID_OUT');
              }}
              className={`py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                type === 'PAID_OUT'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Paid Out (Petty Cash)</span>
            </button>

            <button
              type="button"
              id="movement-type-in"
              onClick={() => {
                posAudio.playBeep();
                setType('PAID_IN');
              }}
              className={`py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                type === 'PAID_IN'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Paid In (Float Top-up)</span>
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Amount (KES):
            </label>
            <input
              type="number"
              id="cash-movement-amount"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 1500"
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-lg font-mono font-bold text-gray-900 focus:outline-none focus:border-emerald-600"
              required
            />
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Reason / Expense Description:
            </label>
            <input
              type="text"
              id="cash-movement-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={type === 'PAID_OUT' ? 'e.g. Purchased 2 bags of ice, lemons' : 'e.g. Added coins & 500 notes for change'}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-emerald-600"
              required
            />
          </div>

          {/* Current Drawer Status */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs flex justify-between items-center text-gray-600">
            <span>Expected Cash in Drawer:</span>
            <span className="font-mono font-bold text-gray-900">{formatKES(tillSession.expectedCash)}</span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="confirm-cash-movement-btn"
              disabled={isSubmitting}
              className={`flex-1 py-3 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                type === 'PAID_OUT' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <span>{isSubmitting ? 'Recording...' : `Record ${type === 'PAID_OUT' ? 'Expense' : 'Paid In'}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
