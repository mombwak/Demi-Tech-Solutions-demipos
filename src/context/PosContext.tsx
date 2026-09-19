import React, { createContext, useContext, useState } from 'react';
import { 
  DiningTable, 
  Order, 
  KotTicket, 
  Sale, 
  TillSession, 
  OrderItem, 
  KotStatus,
  ProductDepartment
} from '../types';
import { 
  SEED_TABLES, 
  SEED_INITIAL_ORDERS, 
  SEED_INITIAL_KOTS, 
  SEED_TILL_SESSION 
} from '../data/seedData';
import { posAudio } from '../utils/formatters';

export type PosOperatingMode = 'RESTAURANT' | 'RETAIL' | 'KITCHEN_KDS' | 'DASHBOARD';

interface PosContextType {
  tables: DiningTable[];
  orders: Record<string, Order>;
  kotTickets: KotTicket[];
  salesHistory: Sale[];
  tillSession: TillSession;
  operatingMode: PosOperatingMode;
  setOperatingMode: (mode: PosOperatingMode) => void;
  isOffline: boolean;
  toggleOffline: () => void;
  offlineQueueCount: number;
  activeTableId: string | null;
  setActiveTableId: (id: string | null) => void;
  createOrUpdateOrder: (order: Order) => void;
  dispatchKot: (orderId: string, itemsToDispatch: OrderItem[], tableNumber?: string, waiterName?: string) => void;
  bumpKotStatus: (ticketId: string, nextStatus: KotStatus) => void;
  completeSale: (sale: Sale) => void;
  transferTable: (sourceTableId: string, targetTableId: string) => boolean;
  settleTableOrder: (tableId: string) => void;
}

const PosContext = createContext<PosContextType | undefined>(undefined);

export const PosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tables, setTables] = useState<DiningTable[]>(SEED_TABLES);
  const [orders, setOrders] = useState<Record<string, Order>>(SEED_INITIAL_ORDERS);
  const [kotTickets, setKotTickets] = useState<KotTicket[]>(SEED_INITIAL_KOTS);
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [tillSession, setTillSession] = useState<TillSession>(SEED_TILL_SESSION);
  const [operatingMode, setOperatingMode] = useState<PosOperatingMode>('RESTAURANT');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  const [activeTableId, setActiveTableId] = useState<string | null>(null);

  const toggleOffline = () => {
    setIsOffline(prev => !prev);
  };

  const createOrUpdateOrder = (order: Order) => {
    setOrders(prev => ({
      ...prev,
      [order.id]: order
    }));

    if (order.tableId) {
      setTables(prevTables =>
        prevTables.map(t => {
          if (t.id === order.tableId) {
            return {
              ...t,
              status: order.status === 'BILLED' ? 'BILLED' : 'OCCUPIED',
              currentOrderId: order.id,
              waiterName: order.waiterName,
              activeOrderTotal: order.grandTotal,
              guestCount: order.guestCount
            };
          }
          return t;
        })
      );
    }
  };

  const dispatchKot = (
    orderId: string, 
    itemsToDispatch: OrderItem[], 
    tableNumber?: string, 
    waiterName: string = 'Staff'
  ) => {
    if (itemsToDispatch.length === 0) return;

    // Group items by station: FOOD / GRILL vs BAR
    const stationGroups: Record<ProductDepartment, OrderItem[]> = {
      FOOD: [],
      GRILL: [],
      BAR: [],
      RETAIL: []
    };

    itemsToDispatch.forEach(item => {
      stationGroups[item.department].push(item);
    });

    const newTickets: KotTicket[] = [];
    let ticketCounter = 1050 + kotTickets.length;

    (['GRILL', 'FOOD', 'BAR'] as ProductDepartment[]).forEach(station => {
      const stationItems = stationGroups[station];
      if (stationItems.length > 0) {
        newTickets.push({
          id: `kot-${Date.now()}-${station.toLowerCase()}`,
          ticketNumber: ticketCounter++,
          orderId,
          tableNumber: tableNumber || 'Quick Order',
          waiterName,
          station,
          status: 'NEW',
          createdAt: 'Just now',
          items: stationItems.map((item, idx) => ({
            id: `ki-${Date.now()}-${idx}`,
            orderItemId: item.id,
            productName: item.productName,
            variantName: item.variantName,
            quantity: item.quantity,
            notes: item.notes,
            seatNumber: item.seatNumber
          }))
        });
      }
    });

    setKotTickets(prev => [...newTickets, ...prev]);
    posAudio.playKotBell();

    if (isOffline) {
      setOfflineQueueCount(c => c + newTickets.length);
    }
  };

  const bumpKotStatus = (ticketId: string, nextStatus: KotStatus) => {
    setKotTickets(prev =>
      prev.map(ticket => {
        if (ticket.id === ticketId) {
          return { ...ticket, status: nextStatus };
        }
        return ticket;
      })
    );
    posAudio.playBeep();
  };

  const completeSale = (sale: Sale) => {
    setSalesHistory(prev => [sale, ...prev]);

    // Update till session totals
    let cashAdded = 0;
    let mpesaAdded = 0;
    let cardAdded = 0;

    sale.payments.forEach(p => {
      if (p.method === 'CASH') cashAdded += p.amountApplied;
      if (p.method === 'MPESA') mpesaAdded += p.amountApplied;
      if (p.method === 'CARD') cardAdded += p.amountApplied;
    });

    setTillSession(prev => ({
      ...prev,
      expectedCash: prev.expectedCash + cashAdded,
      totalMpesa: prev.totalMpesa + mpesaAdded,
      totalCard: prev.totalCard + cardAdded,
      totalSales: prev.totalSales + sale.grandTotal
    }));

    // If linked to a table, reset table to VACANT
    if (sale.tableNumber) {
      setTables(prev =>
        prev.map(t => {
          if (t.tableNumber === sale.tableNumber) {
            return {
              ...t,
              status: 'VACANT',
              currentOrderId: undefined,
              activeOrderTotal: undefined,
              waiterName: undefined
            };
          }
          return t;
        })
      );
    }

    if (sale.orderId && orders[sale.orderId]) {
      setOrders(prev => ({
        ...prev,
        [sale.orderId!]: {
          ...prev[sale.orderId!],
          status: 'PAID'
        }
      }));
    }

    if (isOffline) {
      setOfflineQueueCount(c => c + 1);
    }
  };

  const transferTable = (sourceTableId: string, targetTableId: string): boolean => {
    const source = tables.find(t => t.id === sourceTableId);
    const target = tables.find(t => t.id === targetTableId);

    if (!source || !target || !source.currentOrderId) return false;

    // Update target table with source's active order
    setTables(prev =>
      prev.map(t => {
        if (t.id === targetTableId) {
          return {
            ...t,
            status: 'OCCUPIED',
            currentOrderId: source.currentOrderId,
            waiterName: source.waiterName,
            activeOrderTotal: source.activeOrderTotal,
            guestCount: source.guestCount
          };
        }
        if (t.id === sourceTableId) {
          return {
            ...t,
            status: 'VACANT',
            currentOrderId: undefined,
            waiterName: undefined,
            activeOrderTotal: undefined
          };
        }
        return t;
      })
    );

    // Update order object tableId
    setOrders(prev => {
      const ord = prev[source.currentOrderId!];
      if (!ord) return prev;
      return {
        ...prev,
        [ord.id]: {
          ...ord,
          tableId: targetTableId,
          tableNumber: target.tableNumber
        }
      };
    });

    posAudio.playBeep();
    return true;
  };

  const settleTableOrder = (tableId: string) => {
    setTables(prev =>
      prev.map(t => {
        if (t.id === tableId) {
          return {
            ...t,
            status: 'VACANT',
            currentOrderId: undefined,
            activeOrderTotal: undefined,
            waiterName: undefined
          };
        }
        return t;
      })
    );
  };

  return (
    <PosContext.Provider
      value={{
        tables,
        orders,
        kotTickets,
        salesHistory,
        tillSession,
        operatingMode,
        setOperatingMode,
        isOffline,
        toggleOffline,
        offlineQueueCount,
        activeTableId,
        setActiveTableId,
        createOrUpdateOrder,
        dispatchKot,
        bumpKotStatus,
        completeSale,
        transferTable,
        settleTableOrder
      }}
    >
      {children}
    </PosContext.Provider>
  );
};

export const usePos = () => {
  const ctx = useContext(PosContext);
  if (!ctx) throw new Error('usePos must be used within a PosProvider');
  return ctx;
};
