import React, { useState } from 'react';
import { 
  ChefHat, 
  Clock, 
  Flame, 
  Beer, 
  Utensils, 
  CheckCircle2, 
  AlertCircle,
  Bell,
  ArrowRight
} from 'lucide-react';
import { usePos } from '../../context/PosContext';
import { KotTicket, KotStatus, ProductDepartment } from '../../types';
import { posAudio } from '../../utils/formatters';

export const KdsDisplay: React.FC = () => {
  const { kotTickets, bumpKotStatus } = usePos();
  const [stationFilter, setStationFilter] = useState<'ALL' | ProductDepartment>('ALL');

  const filteredTickets = kotTickets.filter(ticket => {
    if (ticket.status === 'SERVED' || ticket.status === 'CANCELLED') return false;
    if (stationFilter === 'ALL') return true;
    return ticket.station === stationFilter;
  });

  const getStatusBadge = (status: KotStatus) => {
    switch (status) {
      case 'NEW':
        return 'bg-red-500 text-white animate-pulse';
      case 'ACCEPTED':
        return 'bg-blue-600 text-white';
      case 'PREPARING':
        return 'bg-amber-500 text-white';
      case 'READY':
        return 'bg-emerald-600 text-white';
      case 'SERVED':
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const getNextStatusAction = (status: KotStatus): { next: KotStatus; label: string; color: string } => {
    switch (status) {
      case 'NEW':
        return { next: 'ACCEPTED', label: 'Accept Ticket', color: 'bg-blue-600 hover:bg-blue-700' };
      case 'ACCEPTED':
        return { next: 'PREPARING', label: 'Start Preparing', color: 'bg-amber-600 hover:bg-amber-700' };
      case 'PREPARING':
        return { next: 'READY', label: 'Mark Ready', color: 'bg-emerald-600 hover:bg-emerald-700' };
      case 'READY':
        return { next: 'SERVED', label: 'Bump / Served', color: 'bg-gray-800 hover:bg-gray-900' };
      default:
        return { next: 'SERVED', label: 'Done', color: 'bg-gray-700' };
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-900 text-white overflow-hidden select-none">
      {/* KDS Control Header */}
      <div className="bg-gray-950 px-5 py-3 border-b border-gray-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-lg tracking-tight">Kitchen & Bar Display System (KDS)</h2>
            <p className="text-xs text-gray-400">Live ticket bump bar with automated station routing</p>
          </div>
        </div>

        {/* Station Tabs */}
        <div className="flex items-center gap-1.5 bg-gray-900 p-1 rounded-xl border border-gray-800">
          {(['ALL', 'FOOD', 'GRILL', 'BAR'] as const).map(station => (
            <button
              key={station}
              type="button"
              id={`kds-station-filter-${station.toLowerCase()}`}
              onClick={() => {
                posAudio.playBeep();
                setStationFilter(station);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                stationFilter === station
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {station === 'ALL' ? 'All Stations' : station}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets Scrollable Grid */}
      <div className="flex-1 overflow-y-auto p-5">
        {filteredTickets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 stroke-[1.5] mb-2" />
            <h3 className="text-base font-bold text-gray-300">All Clear — No Pending Orders</h3>
            <p className="text-xs text-gray-500 mt-1">New orders fired from tables will appear here instantly</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTickets.map(ticket => {
              const action = getNextStatusAction(ticket.status);
              const isGrill = ticket.station === 'GRILL';
              const isBar = ticket.station === 'BAR';

              return (
                <div
                  key={ticket.id}
                  id={`kds-ticket-${ticket.ticketNumber}`}
                  className="bg-gray-800/90 border border-gray-700 rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg"
                >
                  {/* Ticket Header */}
                  <div className="p-3.5 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-white">#{ticket.ticketNumber}</span>
                        <span className="text-sm font-bold text-emerald-400">{ticket.tableNumber}</span>
                      </div>
                      <p className="text-[11px] text-gray-400">Server: {ticket.waiterName}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${getStatusBadge(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{ticket.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  {/* Station Banner */}
                  <div className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                    isGrill ? 'bg-red-950/60 text-red-300 border-b border-red-900/50' :
                    isBar ? 'bg-amber-950/60 text-amber-300 border-b border-amber-900/50' :
                    'bg-blue-950/60 text-blue-300 border-b border-blue-900/50'
                  }`}>
                    {isGrill && <Flame className="w-3.5 h-3.5 text-red-400" />}
                    {isBar && <Beer className="w-3.5 h-3.5 text-amber-400" />}
                    {!isGrill && !isBar && <Utensils className="w-3.5 h-3.5 text-blue-400" />}
                    <span>{ticket.station} STATION</span>
                  </div>

                  {/* Items List */}
                  <div className="p-4 space-y-3 flex-1">
                    {ticket.items.map((item) => (
                      <div key={item.id} className="border-b border-gray-700/60 pb-2.5 last:border-0 last:pb-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-bold text-gray-100 leading-snug">
                            {item.productName}
                          </span>
                          <span className="text-base font-black text-amber-400 font-mono px-2 py-0.5 bg-gray-900 rounded-md">
                            ×{item.quantity}
                          </span>
                        </div>

                        {item.seatNumber && (
                          <span className="text-[10px] font-semibold text-gray-400">
                            Seat {item.seatNumber}
                          </span>
                        )}

                        {item.notes && (
                          <div className="mt-1 text-xs text-amber-200 bg-amber-950/70 px-2 py-1 rounded border border-amber-800/80 font-medium">
                            Note: {item.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Bump Status Button */}
                  <div className="p-3 bg-gray-950 border-t border-gray-800">
                    <button
                      type="button"
                      id={`bump-ticket-${ticket.ticketNumber}`}
                      onClick={() => bumpKotStatus(ticket.id, action.next)}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider text-white flex items-center justify-center gap-2 cursor-pointer shadow-md transition-colors ${action.color}`}
                    >
                      <span>{action.label}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
