import React, { useState } from 'react';
import { X, PlayCircle, Banknote, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePos } from '../../context/PosContext';
import { formatKES, posAudio } from '../../utils/formatters';

interface StartShiftModalProps {
  onClose: () => void;
}

export const StartShiftModal: React.FC<StartShiftModalProps> = ({ onClose }) => {
  const { currentUser, currentBranch, currentTerminal } = useAuth();
  const { openShift } = usePos();

  const [openingFloat, setOpeningFloat] = useState<string>('5000');
  const [notes, setNotes] = useState<string>('Standard till cash float');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const floatValue = Number(openingFloat) || 0;

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (floatValue < 0) {
      setError('Opening cash float cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await openShift(floatValue, currentTerminal);
      posAudio.playBeep();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to start shift on server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none">
      <div 
        id="start-shift-dialog"
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-900 text-white">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Start Cashier Shift</h2>
              <p className="text-[11px] text-gray-400">Open Till & Initialize Cash Drawer Float</p>
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
        <form onSubmit={handleStart} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Terminal & Cashier Identity */}
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-500">Terminal:</span>
              <span className="font-bold text-gray-900 font-mono">{currentTerminal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Cashier:</span>
              <span className="font-bold text-gray-900">{currentUser.name} ({currentUser.role})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Outlet / Branch:</span>
              <span className="text-gray-700">{currentBranch.name}</span>
            </div>
          </div>

          {/* Opening Float Input */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Opening Cash Float in Drawer (KES):
            </label>
            <div className="relative">
              <Banknote className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                id="opening-float-input"
                min="0"
                step="50"
                value={openingFloat}
                onChange={(e) => setOpeningFloat(e.target.value)}
                placeholder="5000"
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-lg font-mono font-black text-gray-900 focus:outline-none focus:border-emerald-600"
                required
              />
            </div>

            {/* Float Preset Chips */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-gray-500">Presets:</span>
              {[2000, 5000, 10000, 15000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    posAudio.playBeep();
                    setOpeningFloat(amt.toString());
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                    floatValue === amt 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                      : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700'
                  }`}
                >
                  {formatKES(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Shift Notes */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Opening Notes / Float Denominations (Optional):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 5x 1000 notes, coins for change"
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="confirm-start-shift-btn"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <PlayCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Opening...' : 'Start Shift'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
