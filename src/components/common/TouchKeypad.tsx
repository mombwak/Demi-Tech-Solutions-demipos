import React from 'react';
import { Delete } from 'lucide-react';
import { posAudio } from '../../utils/formatters';

interface TouchKeypadProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit?: () => void;
  submitLabel?: string;
  quickDenominations?: number[];
  onQuickAdd?: (amount: number) => void;
  maxLength?: number;
}

export const TouchKeypad: React.FC<TouchKeypadProps> = ({
  value,
  onChange,
  onSubmit,
  submitLabel = 'Confirm',
  quickDenominations,
  onQuickAdd,
  maxLength = 10,
}) => {
  const handleDigit = (digit: string) => {
    posAudio.playBeep();
    if (value.length >= maxLength) return;
    if (value === '0' && digit !== '.') {
      onChange(digit);
    } else {
      onChange(value + digit);
    }
  };

  const handleBackspace = () => {
    posAudio.playBeep();
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    posAudio.playBeep();
    onChange('');
  };

  return (
    <div id="touch-keypad-container" className="w-full select-none">
      {quickDenominations && quickDenominations.length > 0 && onQuickAdd && (
        <div className="grid grid-cols-4 gap-2 mb-3">
          {quickDenominations.map(denom => (
            <button
              key={denom}
              type="button"
              id={`quick-add-${denom}`}
              onClick={() => {
                posAudio.playBeep();
                onQuickAdd(denom);
              }}
              className="py-2.5 px-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold rounded-lg text-sm transition-colors text-center shadow-xs cursor-pointer"
            >
              +{denom.toLocaleString()}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
          <button
            key={d}
            type="button"
            id={`keypad-${d}`}
            onClick={() => handleDigit(d)}
            className="h-14 text-2xl font-bold bg-white active:bg-gray-200 border border-gray-200 rounded-xl shadow-xs text-gray-800 flex items-center justify-center transition-all cursor-pointer hover:bg-gray-50"
          >
            {d}
          </button>
        ))}

        <button
          type="button"
          id="keypad-clear"
          onClick={handleClear}
          className="h-14 text-sm font-semibold bg-red-50 active:bg-red-100 border border-red-200 rounded-xl text-red-700 flex items-center justify-center cursor-pointer hover:bg-red-100"
        >
          CLEAR
        </button>

        <button
          type="button"
          id="keypad-0"
          onClick={() => handleDigit('0')}
          className="h-14 text-2xl font-bold bg-white active:bg-gray-200 border border-gray-200 rounded-xl shadow-xs text-gray-800 flex items-center justify-center cursor-pointer hover:bg-gray-50"
        >
          0
        </button>

        <button
          type="button"
          id="keypad-backspace"
          onClick={handleBackspace}
          className="h-14 bg-gray-100 active:bg-gray-200 border border-gray-200 rounded-xl text-gray-700 flex items-center justify-center cursor-pointer hover:bg-gray-200"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>

      {onSubmit && (
        <button
          type="button"
          id="keypad-submit"
          onClick={() => {
            posAudio.playBeep();
            onSubmit();
          }}
          className="w-full mt-3 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-lg rounded-xl shadow-md cursor-pointer transition-colors"
        >
          {submitLabel}
        </button>
      )}
    </div>
  );
};
