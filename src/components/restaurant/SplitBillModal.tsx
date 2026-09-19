import React, { useState } from 'react';
import { X, Users, CheckSquare, Split, Receipt } from 'lucide-react';
import { Order, OrderItem } from '../../types';
import { formatKES, posAudio } from '../../utils/formatters';

interface SplitBillModalProps {
  order: Order;
  onClose: () => void;
  onPaySplitShare: (shareAmount: number, description: string, splitItems?: OrderItem[]) => void;
}

export const SplitBillModal: React.FC<SplitBillModalProps> = ({
  order,
  onClose,
  onPaySplitShare,
}) => {
  const [splitMode, setSplitMode] = useState<'EQUAL' | 'SEAT' | 'ITEMS'>('EQUAL');
  const [equalParts, setEqualParts] = useState<number>(order.guestCount || 2);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Equal split calculation
  const sharePerPerson = Math.ceil(order.grandTotal / equalParts);

  // Group items by seat
  const seatGroups = order.items.reduce((acc, item) => {
    const seat = item.seatNumber || 1;
    if (!acc[seat]) acc[seat] = [];
    acc[seat].push(item);
    return acc;
  }, {} as Record<number, OrderItem[]>);

  const toggleItemSelection = (id: string) => {
    posAudio.playBeep();
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectedItemsTotal = order.items
    .filter(i => selectedItemIds.includes(i.id))
    .reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div 
        id="split-bill-dialog"
        className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-900 text-white">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Split className="w-5 h-5 text-emerald-400" />
              <span>Split Bill: Table {order.tableNumber}</span>
            </h2>
            <p className="text-xs text-gray-400">
              Total Bill: <strong className="text-emerald-400 font-mono">{formatKES(order.grandTotal)}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 p-2 gap-2">
          <button
            type="button"
            onClick={() => {
              posAudio.playBeep();
              setSplitMode('EQUAL');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              splitMode === 'EQUAL'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Equal Split ({equalParts} Ways)
          </button>

          <button
            type="button"
            onClick={() => {
              posAudio.playBeep();
              setSplitMode('SEAT');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              splitMode === 'SEAT'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Split by Seat
          </button>

          <button
            type="button"
            onClick={() => {
              posAudio.playBeep();
              setSplitMode('ITEMS');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              splitMode === 'ITEMS'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Select Specific Items
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1">
          {splitMode === 'EQUAL' && (
            <div className="space-y-6 text-center">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                  Number of Paying Guests
                </label>
                <div className="flex items-center justify-center gap-2">
                  {[2, 3, 4, 5, 6].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        posAudio.playBeep();
                        setEqualParts(n);
                      }}
                      className={`w-12 h-12 rounded-xl text-lg font-bold border-2 cursor-pointer transition-all ${
                        equalParts === n
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <p className="text-xs text-emerald-800 font-semibold mb-1">Each Guest Pays:</p>
                <p className="text-3xl font-black text-emerald-900 font-mono">
                  {formatKES(sharePerPerson)}
                </p>
                <p className="text-[11px] text-emerald-700 mt-1">
                  ({equalParts} payments of {formatKES(sharePerPerson)} = {formatKES(sharePerPerson * equalParts)})
                </p>
              </div>

              <button
                type="button"
                onClick={() => onPaySplitShare(sharePerPerson, `Equal 1/${equalParts} Split (Table ${order.tableNumber})`)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-xl shadow-md cursor-pointer transition-colors"
              >
                Pay 1 Guest's Share ({formatKES(sharePerPerson)})
              </button>
            </div>
          )}

          {splitMode === 'SEAT' && (
            <div className="space-y-4">
              {Object.entries(seatGroups).map(([seatNum, items]) => {
                const seatTotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
                return (
                  <div key={seatNum} className="p-4 border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">Seat {seatNum}</h4>
                      <p className="text-xs text-gray-500">{items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}</p>
                      <p className="text-sm font-black text-emerald-800 font-mono mt-1">{formatKES(seatTotal)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onPaySplitShare(seatTotal, `Seat ${seatNum} Bill (Table ${order.tableNumber})`, items)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Pay Seat {seatNum}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {splitMode === 'ITEMS' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 mb-2">Check the specific items the customer wishes to settle now:</p>
              {order.items.map(item => {
                const isSelected = selectedItemIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItemSelection(item.id)}
                    className={`p-3 border-2 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                      isSelected ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center text-xs font-bold ${
                        isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300'
                      }`}>
                        {isSelected && '✓'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{item.productName}</p>
                        <p className="text-[11px] text-gray-500 font-mono">{item.quantity} × {formatKES(item.unitPrice)}</p>
                      </div>
                    </div>
                    <span className="font-black text-xs text-gray-900 font-mono">
                      {formatKES(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                );
              })}

              {selectedItemIds.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-500">Selected Items Total:</span>
                    <p className="text-xl font-black text-emerald-800 font-mono">{formatKES(selectedItemsTotal)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const chosenItems = order.items.filter(i => selectedItemIds.includes(i.id));
                      onPaySplitShare(selectedItemsTotal, `Selected Items (Table ${order.tableNumber})`, chosenItems);
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    Pay Selected Items
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
