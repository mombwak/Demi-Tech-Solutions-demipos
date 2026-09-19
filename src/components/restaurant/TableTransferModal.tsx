import React, { useState } from 'react';
import { X, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { DiningTable } from '../../types';
import { usePos } from '../../context/PosContext';
import { posAudio } from '../../utils/formatters';

interface TableTransferModalProps {
  sourceTable: DiningTable;
  onClose: () => void;
}

export const TableTransferModal: React.FC<TableTransferModalProps> = ({
  sourceTable,
  onClose,
}) => {
  const { tables, transferTable } = usePos();
  const [targetTableId, setTargetTableId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Exclude source table from choices
  const candidateTables = tables.filter(t => t.id !== sourceTable.id);

  const handleTransfer = () => {
    if (!targetTableId) {
      setError('Please select a destination table');
      return;
    }
    const success = transferTable(sourceTable.id, targetTableId);
    if (success) {
      onClose();
    } else {
      setError('Unable to complete transfer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div 
        id="table-transfer-dialog"
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 bg-gray-900 text-white">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-base">Move / Transfer Table {sourceTable.tableNumber}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-600">
            Select the destination table to transfer the active bill of <strong>Table {sourceTable.tableNumber}</strong>:
          </p>

          {error && (
            <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1">
            {candidateTables.map(t => {
              const isSelected = targetTableId === t.id;
              const isOccupied = t.status === 'OCCUPIED' || t.status === 'BILLED';
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    posAudio.playBeep();
                    setTargetTableId(t.id);
                    setError(null);
                  }}
                  className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black shadow-xs' 
                      : isOccupied 
                        ? 'border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-900' 
                        : 'border-gray-200 hover:border-gray-300 text-gray-800'
                  }`}
                >
                  <p className="text-sm font-bold">{t.tableNumber}</p>
                  <p className="text-[10px] text-gray-500 uppercase mt-0.5">
                    {t.status}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-gray-100 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleTransfer}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md"
            >
              Confirm Move
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
