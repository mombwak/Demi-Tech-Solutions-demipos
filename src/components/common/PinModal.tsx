import React, { useState } from 'react';
import { Lock, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TouchKeypad } from './TouchKeypad';
import { SEED_USERS } from '../../data/seedData';

interface PinModalProps {
  onClose?: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({ onClose }) => {
  const { isPinModalOpen, closePinModal, verifyPinAndSwitch } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isPinModalOpen) return null;

  const handleClose = () => {
    if (onClose) onClose();
    closePinModal();
  };

  const handleVerify = () => {
    if (pin.length < 4) {
      setError('Please enter a 4-digit PIN');
      return;
    }
    const success = verifyPinAndSwitch(pin);
    if (success) {
      setPin('');
      setError(null);
    } else {
      setError('Invalid PIN code. Try demo PINs below.');
      setPin('');
    }
  };

  const handleQuickSelect = (quickPin: string) => {
    verifyPinAndSwitch(quickPin);
    setPin('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div 
        id="pin-login-dialog"
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-gray-100 overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 bg-gray-900 text-white">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-lg">Staff PIN Switch</h2>
          </div>
          <button 
            type="button"
            id="close-pin-modal-btn"
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="text-center mb-5">
            <p className="text-xs text-gray-500 mb-2">Enter 4-digit authorization PIN</p>
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map(index => (
                <div 
                  key={index}
                  className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                    pin.length > index 
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900' 
                      : 'border-gray-200 bg-gray-50 text-transparent'
                  }`}
                >
                  {pin.length > index ? '●' : '—'}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <TouchKeypad 
            value={pin}
            onChange={(val) => {
              setError(null);
              setPin(val);
              if (val.length === 4) {
                const autoSuccess = verifyPinAndSwitch(val);
                if (!autoSuccess) {
                  setError('Invalid PIN code');
                  setPin('');
                }
              }
            }}
            onSubmit={handleVerify}
            submitLabel="Unlock Terminal"
            maxLength={4}
          />

          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 text-center">
              Quick Role Switch (Demo Emulators)
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {SEED_USERS.map(u => (
                <button
                  key={u.id}
                  type="button"
                  id={`demo-user-${u.role.toLowerCase()}`}
                  onClick={() => handleQuickSelect(u.pin)}
                  className="p-1.5 bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 rounded-lg text-left cursor-pointer transition-colors"
                >
                  <p className="text-[11px] font-bold text-gray-800 truncate">{u.name.split(' ')[0]}</p>
                  <p className="text-[9px] text-gray-500 uppercase font-mono">{u.role} ({u.pin})</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
