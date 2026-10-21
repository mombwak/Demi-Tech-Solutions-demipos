import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
import { api } from '../services/apiClient';

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
  createOrUpdateOrder: (order: Order, expectedVersion?: number) => void;
  dispatchKot: (orderId: string, itemsToDispatch: OrderItem[], tableNumber?: string, waiterName?: string) => void;
  bumpKotStatus: (ticketId: string, nextStatus: KotStatus) => void;
  completeSale: (sale: Sale) => void;
  transferTable: (sourceTableId: string, targetTableId: string) => boolean;
  settleTableOrder: (tableId: string) => void;
  openShift: (openingFloat: number, terminalId?: string) => Promise<void>;
  recordCashMovement: (sessionId: string, type: 'PAID_IN' | 'PAID_OUT', amount: number, reason: string) => Promise<void>;
  closeShift: (sessionId: string, actualCashCount: number) => Promise<TillSession>;
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

  const lastSyncSequence = useRef<number>(0);

  // Background Sync Loop: Polling central server every 3s when online
  useEffect(() => {
    if (isOffline) return;

    let isMounted = true;
    const syncWithServer = async () => {
      try {
        const response = await api.syncState(lastSyncSequence.current);
        if (!response || !isMounted) return;

        if (response.sequence) {
          lastSyncSequence.current = response.sequence;
        }

        if (!response.upToDate && response.data) {
          if (response.data.tables) setTables(response.data.tables);
          if (response.data.orders) {
            const orderMap: Record<string, Order> = {};
            response.data.orders.forEach((o: Order) => {
              orderMap[o.id] = o;
            });
            setOrders(orderMap);
          }
          if (response.data.kotTickets) {
            setKotTickets(response.data.kotTickets);
          }
          if (response.data.activeTillSession) {
            setTillSession(response.data.activeTillSession);
          }
        }
      } catch {
        // Network dropout
      }
    };

    syncWithServer();
    const interval = setInterval(syncWithServer, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOffline]);

  const toggleOffline = () => {
    setIsOffline(prev => !prev);
  };

  const createOrUpdateOrder = (order: Order, expectedVersion?: number) => {
    // 1. Optimistic Local Update for instant touch feedback
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

    // 2. Dispatch to central backend if online
    if (!isOffline) {
      api.saveOrder(order, expectedVersion).catch(err => {
        if (err.message && err.message.includes('CONCURRENCY_CONFLICT')) {
          alert('⚠️ Concurrency Notice: This order was updated by another terminal. Your screen has been synchronized with the latest version.');
        } else {
          setOfflineQueueCount(c => c + 1);
        }
      });
    } else {
      setOfflineQueueCount(c => c + 1);
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

    if (!isOffline) {
      api.fireKot(
        orderId,
        itemsToDispatch.map(i => ({
          orderItemId: i.id,
          productId: i.productId,
          productName: i.productName,
          department: i.department,
          quantity: i.quantity,
          notes: i.notes,
          seatNumber: i.seatNumber
        })),
        tableNumber
      ).catch(() => {
        setOfflineQueueCount(c => c + newTickets.length);
      });
    } else {
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

    if (!isOffline) {
      api.bumpKotStatus(ticketId, nextStatus).catch(() => {});
    }
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

    if (!isOffline) {
      api.settleSale(sale).catch(() => {
        setOfflineQueueCount(c => c + 1);
      });
    } else {
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

    if (!isOffline) {
      api.transferTable(sourceTableId, targetTableId).catch(() => {});
    }

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
            waiterName: undefined,
            activeOrderTotal: undefined
          };
        }
        return t;
      })
    );
  };

  const openShift = async (openingFloat: number, terminalId?: string) => {
    try {
      const session = await api.openShift(openingFloat, terminalId);
      setTillSession(session);
    } catch {
      // Offline fallback
      setTillSession(prev => ({
        ...prev,
        openingFloat,
        expectedCash: openingFloat,
        totalMpesa: 0,
        totalCard: 0,
        totalSales: 0,
        status: 'OPEN',
        openedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
    }
  };

  const recordCashMovement = async (sessionId: string, type: 'PAID_IN' | 'PAID_OUT', amount: number, reason: string) => {
    try {
      const session = await api.recordCashMovement(sessionId, type, amount, reason);
      setTillSession(session);
    } catch {
      // Offline fallback
      setTillSession(prev => ({
        ...prev,
        expectedCash: type === 'PAID_IN' ? prev.expectedCash + amount : prev.expectedCash - amount
      }));
    }
  };

  const closeShift = async (sessionId: string, actualCashCount: number): Promise<TillSession> => {
    try {
      const closed = await api.closeShift(sessionId, actualCashCount);
      setTillSession(closed);
      return closed;
    } catch {
      const closed: TillSession = {
        ...tillSession,
        status: 'CLOSED',
        actualCashCount,
        cashDiscrepancy: actualCashCount - tillSession.expectedCash,
        closedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setTillSession(closed);
      return closed;
    }
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
        settleTableOrder,
        openShift,
        recordCashMovement,
        closeShift,
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
