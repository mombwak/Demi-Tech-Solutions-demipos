import React, { useState } from 'react';
import { 
  Users, 
  Clock, 
  Receipt, 
  ArrowRightLeft, 
  PlusCircle, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { usePos } from '../../context/PosContext';
import { useAuth } from '../../context/AuthContext';
import { DiningTable, TableStatus } from '../../types';
import { SEED_SECTIONS } from '../../data/seedData';
import { formatKES, posAudio } from '../../utils/formatters';

interface FloorPlanProps {
  onSelectTable: (table: DiningTable) => void;
  onOpenTransferModal: (table: DiningTable) => void;
}

export const FloorPlan: React.FC<FloorPlanProps> = ({ 
  onSelectTable,
  onOpenTransferModal
}) => {
  const { tables, orders } = usePos();
  const { currentUser } = useAuth();
  const [activeSectionId, setActiveSectionId] = useState<string>(SEED_SECTIONS[0].id);

  // Filter tables by active section
  const sectionTables = tables.filter(t => t.sectionId === activeSectionId);

  // Status counters
  const totalOccupied = tables.filter(t => t.status === 'OCCUPIED').length;
  const totalBilled = tables.filter(t => t.status === 'BILLED').length;
  const totalVacant = tables.filter(t => t.status === 'VACANT').length;
  const totalActiveRevenue = tables.reduce((acc, t) => acc + (t.activeOrderTotal || 0), 0);

  const getStatusConfig = (status: TableStatus) => {
    switch (status) {
      case 'OCCUPIED':
        return {
          bg: 'bg-blue-50/80 border-blue-400 hover:border-blue-500 hover:bg-blue-50',
          badge: 'bg-blue-600 text-white',
          text: 'Occupied',
          dot: 'bg-blue-500',
        };
      case 'BILLED':
        return {
          bg: 'bg-amber-50/80 border-amber-400 hover:border-amber-500 hover:bg-amber-50',
          badge: 'bg-amber-600 text-white',
          text: 'Billed / Check Out',
          dot: 'bg-amber-500 animate-pulse',
        };
      case 'RESERVED':
        return {
          bg: 'bg-purple-50/80 border-purple-300 hover:border-purple-400',
          badge: 'bg-purple-600 text-white',
          text: 'Reserved',
          dot: 'bg-purple-500',
        };
      case 'VACANT':
      default:
        return {
          bg: 'bg-white border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/30',
          badge: 'bg-gray-100 text-gray-700 border border-gray-300',
          text: 'Vacant',
          dot: 'bg-emerald-500',
        };
    }
  };

  const handleTableClick = (table: DiningTable) => {
    posAudio.playBeep();
    onSelectTable(table);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Floor Sections Bar & Stats */}
      <div className="bg-white border-b border-gray-200 px-5 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Section Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {SEED_SECTIONS.map(section => {
            const count = tables.filter(t => t.sectionId === section.id).length;
            const occupiedCount = tables.filter(t => t.sectionId === section.id && (t.status === 'OCCUPIED' || t.status === 'BILLED')).length;
            return (
              <button
                key={section.id}
                type="button"
                id={`floor-section-${section.id}`}
                onClick={() => {
                  posAudio.playBeep();
                  setActiveSectionId(section.id);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeSectionId === section.id
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <span>{section.name}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeSectionId === section.id ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}>
                  {occupiedCount}/{count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Real-time Status Metric Badges */}
        <div className="flex items-center gap-3 text-xs font-medium">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Vacant: <strong className="font-bold">{totalVacant}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>Occupied: <strong className="font-bold">{totalOccupied}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Billed: <strong className="font-bold">{totalBilled}</strong></span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-800 font-mono">
            <span>Floor Active Tab: <strong>{formatKES(totalActiveRevenue)}</strong></span>
          </div>
        </div>
      </div>

      {/* Grid of Tables */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {sectionTables.map(table => {
            const cfg = getStatusConfig(table.status);
            const isAssignedToCurrentUser = table.waiterName === currentUser.name;

            return (
              <div
                key={table.id}
                id={`table-card-${table.tableNumber.toLowerCase().replace('-', '')}`}
                onClick={() => handleTableClick(table)}
                className={`relative flex flex-col justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-xs hover:shadow-lg select-none group min-h-[170px] ${cfg.bg}`}
              >
                {/* Header: Table Number & Status Pill */}
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <h3 className="text-xl font-black tracking-tight text-gray-900 group-hover:text-emerald-700 transition-colors">
                      {table.tableNumber}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>{table.guestCount ? `${table.guestCount} / ` : ''}{table.capacity} Seats</span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs ${cfg.badge}`}>
                    {cfg.text}
                  </span>
                </div>

                {/* Middle: Order info if active */}
                <div className="my-2">
                  {table.status === 'OCCUPIED' || table.status === 'BILLED' ? (
                    <div className="space-y-1">
                      <div className="text-lg font-black text-gray-900 leading-tight">
                        {formatKES(table.activeOrderTotal || 0)}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-gray-600">
                        <span className="font-semibold truncate">By: {table.waiterName || 'Staff'}</span>
                        {isAssignedToCurrentUser && (
                          <span className="px-1 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded">YOU</span>
                        )}
                      </div>
                      {table.occupiedSince && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>{table.occupiedSince}</span>
                        </div>
                      )}
                    </div>
                  ) : table.status === 'RESERVED' ? (
                    <div className="text-xs text-purple-700 font-medium">
                      Reserved Party ({table.capacity} pax)
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2 text-gray-400 group-hover:text-emerald-600 transition-colors">
                      <PlusCircle className="w-6 h-6 stroke-[1.5]" />
                      <span className="text-[11px] font-semibold mt-1">Tap to Open</span>
                    </div>
                  )}
                </div>

                {/* Footer: Quick Action Buttons if active */}
                {(table.status === 'OCCUPIED' || table.status === 'BILLED') && (
                  <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between gap-1 text-[11px]">
                    <button
                      type="button"
                      id={`transfer-table-${table.tableNumber.toLowerCase()}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        posAudio.playBeep();
                        onOpenTransferModal(table);
                      }}
                      className="px-2 py-1 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-700 font-semibold flex items-center gap-1 shadow-2xs"
                      title="Transfer or merge table"
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                      <span>Move</span>
                    </button>

                    <div className="text-emerald-700 font-bold flex items-center gap-0.5">
                      <span>View Bill</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
