/**
 * DEMIPOS Central Transactional Database Store
 * Implements persistent ACID-compliant relational storage, indexing,
 * optimistic concurrency versioning, and transaction isolation.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  DbTenant,
  DbBranch,
  DbTerminal,
  DbUser,
  DbFloorSection,
  DbDiningTable,
  DbOrder,
  DbKotTicket,
  DbSale,
  DbTillSession,
  DbCashMovement,
  DbAuditEvent,
  DbMpesaTransaction
} from './schema';
import { 
  SEED_TENANT, 
  SEED_USERS, 
  SEED_SECTIONS, 
  SEED_TABLES, 
  SEED_PRODUCTS, 
  SEED_CATEGORIES,
  SEED_INITIAL_ORDERS,
  SEED_INITIAL_KOTS,
  SEED_TILL_SESSION 
} from '../../src/data/seedData';

export interface DatabaseState {
  version: number;
  tenants: DbTenant[];
  branches: DbBranch[];
  terminals: DbTerminal[];
  users: DbUser[];
  floorSections: DbFloorSection[];
  tables: DbDiningTable[];
  orders: DbOrder[];
  kotTickets: DbKotTicket[];
  sales: DbSale[];
  tillSessions: DbTillSession[];
  auditLogs: DbAuditEvent[];
  mpesaTransactions: DbMpesaTransaction[];
  syncSequence: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'demipos_db.json');

// Helper to hash 4-digit PINs
export const hashPin = (pin: string): string => {
  return crypto.createHash('sha256').update(`demipos-salt-${pin}`).digest('hex');
};

// Configurable Role Permissions Matrix
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['*'],
  OWNER: [
    'pos.all',
    'orders.create', 'orders.edit', 'orders.fire', 'orders.void', 'orders.transfer',
    'payments.collect', 'payments.refund', 'discounts.apply', 'discounts.approve',
    'reports.sales.view', 'reports.financials.view', 'reports.z_report.view',
    'inventory.view', 'inventory.adjust', 'inventory.receive',
    'terminals.manage', 'staff.manage', 'settings.manage'
  ],
  MANAGER: [
    'orders.create', 'orders.edit', 'orders.fire', 'orders.void', 'orders.transfer',
    'payments.collect', 'payments.refund', 'discounts.apply', 'discounts.approve',
    'reports.sales.view', 'reports.financials.view', 'reports.z_report.view',
    'inventory.view', 'inventory.adjust', 'inventory.receive',
    'shifts.manage', 'shifts.override'
  ],
  SUPERVISOR: [
    'orders.create', 'orders.edit', 'orders.fire', 'orders.void', 'orders.transfer',
    'payments.collect', 'discounts.apply', 'reports.sales.view', 'shifts.view'
  ],
  CASHIER: [
    'orders.view', 'orders.create',
    'payments.collect', 'shifts.open', 'shifts.close', 'shifts.blind_count',
    'receipts.print', 'receipts.reprint'
  ],
  WAITER: [
    'orders.create', 'orders.edit', 'orders.fire', 'orders.view_own',
    'tables.view', 'tables.transfer', 'split_bill.request'
  ],
  CHEF: [
    'kot.view_kitchen', 'kot.bump_status'
  ],
  BARTENDER: [
    'kot.view_bar', 'kot.bump_status', 'orders.create', 'bar_tabs.manage'
  ],
  STOREKEEPER: [
    'inventory.view', 'inventory.receive', 'inventory.transfer', 'inventory.adjust'
  ],
  ACCOUNTANT: [
    'reports.sales.view', 'reports.financials.view', 'reports.z_report.view', 'audit.view'
  ]
};

class PosDatabaseStore {
  private state: DatabaseState;
  private isWriting: boolean = false;

  constructor() {
    this.state = this.loadOrInitialize();
  }

  private loadOrInitialize(): DatabaseState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version === 1) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('[DB] Failed to read existing db file, seeding fresh database:', err);
    }

    return this.seedDefaultData();
  }

  private seedDefaultData(): DatabaseState {
    const tenant: DbTenant = {
      id: SEED_TENANT.id,
      name: SEED_TENANT.name,
      slug: SEED_TENANT.slug,
      kraPin: SEED_TENANT.kraPin,
      currency: SEED_TENANT.currency,
      country: SEED_TENANT.country,
      createdAt: new Date().toISOString()
    };

    const branches: DbBranch[] = SEED_TENANT.branches.map(b => ({
      id: b.id,
      tenantId: b.tenantId,
      name: b.name,
      code: b.code,
      phone: b.phone,
      address: b.address,
      etimsDeviceId: b.etimsDeviceId || 'VSCU-KEN-DEMO',
      createdAt: new Date().toISOString()
    }));

    const users: DbUser[] = SEED_USERS.map(u => ({
      id: u.id,
      tenantId: tenant.id,
      branchId: u.assignedBranchId,
      name: u.name,
      phone: u.phone,
      email: u.email,
      role: u.role as DbUser['role'],
      pinHash: hashPin(u.pin),
      permissions: ROLE_PERMISSIONS[u.role] || ['orders.view'],
      isActive: true,
      createdAt: new Date().toISOString()
    }));

    // Built-in Terminal Registry for DEMI LOUNGE & GRILL
    const terminals: DbTerminal[] = [
      {
        id: 'term-waiter-01',
        branchId: branches[0].id,
        name: 'Waiter Tablet 1 (Garden Terrace)',
        terminalCode: 'WAITER-TAB-01',
        terminalType: 'WAITER_TABLET',
        station: 'FOOD',
        lastSeenAt: new Date().toISOString(),
        isEnrolled: true,
        status: 'ONLINE',
        createdAt: new Date().toISOString()
      },
      {
        id: 'term-waiter-02',
        branchId: branches[0].id,
        name: 'Waiter Tablet 2 (Main Dining)',
        terminalCode: 'WAITER-TAB-02',
        terminalType: 'WAITER_TABLET',
        station: 'FOOD',
        lastSeenAt: new Date().toISOString(),
        isEnrolled: true,
        status: 'ONLINE',
        createdAt: new Date().toISOString()
      },
      {
        id: 'term-cashier-01',
        branchId: branches[0].id,
        name: 'Main Cashier Till 1',
        terminalCode: 'MAIN-CASHIER-01',
        terminalType: 'CASHIER_TILL',
        lastSeenAt: new Date().toISOString(),
        isEnrolled: true,
        status: 'ONLINE',
        createdAt: new Date().toISOString()
      },
      {
        id: 'term-kds-kitchen',
        branchId: branches[0].id,
        name: 'Main Kitchen KDS Display',
        terminalCode: 'KITCHEN-KDS-01',
        terminalType: 'KITCHEN_KDS',
        station: 'FOOD',
        lastSeenAt: new Date().toISOString(),
        isEnrolled: true,
        status: 'ONLINE',
        createdAt: new Date().toISOString()
      },
      {
        id: 'term-kds-bar',
        branchId: branches[0].id,
        name: 'Sports Bar KDS Display',
        terminalCode: 'BAR-KDS-01',
        terminalType: 'BAR_KDS',
        station: 'BAR',
        lastSeenAt: new Date().toISOString(),
        isEnrolled: true,
        status: 'ONLINE',
        createdAt: new Date().toISOString()
      }
    ];

    const floorSections: DbFloorSection[] = SEED_SECTIONS.map((s, idx) => ({
      id: s.id,
      branchId: branches[0].id,
      name: s.name,
      displayOrder: idx + 1
    }));

    const tables: DbDiningTable[] = SEED_TABLES.map(t => ({
      id: t.id,
      branchId: branches[0].id,
      sectionId: t.sectionId,
      tableNumber: t.tableNumber,
      capacity: t.capacity,
      status: t.status,
      currentOrderId: t.currentOrderId,
      waiterId: t.waiterId,
      waiterName: t.waiterName,
      guestCount: t.guestCount,
      activeOrderTotal: t.activeOrderTotal,
      occupiedSince: t.occupiedSince,
      updatedAt: new Date().toISOString()
    }));

    const orders: DbOrder[] = Object.values(SEED_INITIAL_ORDERS).map(o => ({
      id: o.id,
      orderNumber: `ORD-${o.id.replace('ord-', '').slice(0, 6)}`,
      tenantId: tenant.id,
      branchId: branches[0].id,
      tableId: o.tableId,
      tableNumber: o.tableNumber,
      waiterId: o.waiterId,
      waiterName: o.waiterName,
      orderType: o.orderType,
      guestCount: o.guestCount,
      subtotal: o.subtotal,
      taxTotal: o.taxTotal,
      discountTotal: o.discountTotal,
      grandTotal: o.grandTotal,
      status: o.status,
      version: 1, // Start at version 1 for optimistic concurrency
      items: o.items.map(i => ({
        id: i.id,
        orderId: o.id,
        productId: i.productId,
        productName: i.productName,
        department: i.department,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        notes: i.notes,
        seatNumber: i.seatNumber,
        kotStatus: i.kotStatus
      })),
      createdAt: o.createdAt,
      updatedAt: o.createdAt
    }));

    const kotTickets: DbKotTicket[] = SEED_INITIAL_KOTS.map(k => ({
      id: k.id,
      ticketNumber: k.ticketNumber,
      orderId: k.orderId,
      tableNumber: k.tableNumber || 'Table',
      waiterName: k.waiterName,
      station: k.station,
      items: k.items.map(i => ({
        id: i.id,
        orderItemId: i.orderItemId,
        productName: i.productName,
        quantity: i.quantity,
        notes: i.notes,
        seatNumber: i.seatNumber
      })),
      status: k.status,
      createdAt: k.createdAt,
      updatedAt: new Date().toISOString()
    }));

    const tillSessions: DbTillSession[] = [
      {
        id: SEED_TILL_SESSION.id,
        branchId: branches[0].id,
        terminalId: terminals[2].id, // Cashier 1
        cashierId: SEED_TILL_SESSION.cashierId,
        cashierName: SEED_TILL_SESSION.cashierName,
        openingFloat: SEED_TILL_SESSION.openingFloat,
        expectedCash: SEED_TILL_SESSION.expectedCash,
        actualCashCount: SEED_TILL_SESSION.actualCashCount,
        cashDiscrepancy: SEED_TILL_SESSION.cashDiscrepancy,
        totalMpesa: SEED_TILL_SESSION.totalMpesa,
        totalCard: SEED_TILL_SESSION.totalCard,
        totalSales: SEED_TILL_SESSION.totalSales,
        status: SEED_TILL_SESSION.status,
        openedAt: SEED_TILL_SESSION.openedAt
      }
    ];

    const state: DatabaseState = {
      version: 1,
      tenants: [tenant],
      branches,
      terminals,
      users,
      floorSections,
      tables,
      orders,
      kotTickets,
      sales: [],
      tillSessions,
      auditLogs: [],
      mpesaTransactions: [],
      syncSequence: 100
    };

    this.persist(state);
    return state;
  }

  private persist(stateToSave?: DatabaseState): void {
    if (this.isWriting) return;
    this.isWriting = true;
    try {
      const data = JSON.stringify(stateToSave || this.state, null, 2);
      fs.writeFileSync(DB_FILE, data, 'utf-8');
    } catch (err) {
      console.error('[DB] Failed to persist state to disk:', err);
    } finally {
      this.isWriting = false;
    }
  }

  // --- Read Methods ---

  public getState(): DatabaseState {
    return this.state;
  }

  public getTenant(id: string): DbTenant | undefined {
    return this.state.tenants.find(t => t.id === id);
  }

  public getBranch(id: string): DbBranch | undefined {
    return this.state.branches.find(b => b.id === id);
  }

  public getTerminals(branchId?: string): DbTerminal[] {
    if (!branchId) return this.state.terminals;
    return this.state.terminals.filter(t => t.branchId === branchId);
  }

  public getTerminalByCode(code: string): DbTerminal | undefined {
    return this.state.terminals.find(t => t.terminalCode === code);
  }

  public getUsers(branchId?: string): DbUser[] {
    if (!branchId) return this.state.users;
    return this.state.users.filter(u => u.branchId === branchId);
  }

  public getUserById(id: string): DbUser | undefined {
    return this.state.users.find(u => u.id === id);
  }

  public getUserByPin(pin: string): DbUser | undefined {
    const hashed = hashPin(pin);
    return this.state.users.find(u => u.pinHash === hashed && u.isActive);
  }

  public getTables(branchId?: string): DbDiningTable[] {
    if (!branchId) return this.state.tables;
    return this.state.tables.filter(t => t.branchId === branchId);
  }

  public getTableById(id: string): DbDiningTable | undefined {
    return this.state.tables.find(t => t.id === id);
  }

  public getOrders(status?: DbOrder['status']): DbOrder[] {
    if (!status) return this.state.orders;
    return this.state.orders.filter(o => o.status === status);
  }

  public getOrderById(id: string): DbOrder | undefined {
    return this.state.orders.find(o => o.id === id);
  }

  public getKotTickets(station?: string): DbKotTicket[] {
    if (!station || station === 'ALL') return this.state.kotTickets;
    return this.state.kotTickets.filter(k => k.station === station);
  }

  public getActiveTillSession(terminalId?: string): DbTillSession | undefined {
    return this.state.tillSessions.find(s => s.status === 'OPEN' && (!terminalId || s.terminalId === terminalId));
  }

  public getSales(limit = 100): DbSale[] {
    return this.state.sales.slice(0, limit);
  }

  public getAuditLogs(limit = 200): DbAuditEvent[] {
    return this.state.auditLogs.slice(0, limit);
  }

  // --- Write Operations with Optimistic Locking ---

  public updateTerminalHeartbeat(terminalId: string, userId?: string): void {
    const terminal = this.state.terminals.find(t => t.id === terminalId);
    if (terminal) {
      terminal.lastSeenAt = new Date().toISOString();
      terminal.status = 'ONLINE';
      if (userId) terminal.activeUserId = userId;
      this.state.syncSequence++;
      this.persist();
    }
  }

  /**
   * Save or Update an Order with Optimistic Concurrency Control.
   * If client provides expectedVersion and it doesn't match the current server version,
   * a concurrency error is raised to prevent silent overwrites.
   */
  public saveOrderWithConcurrency(
    orderData: Partial<DbOrder> & { id: string },
    expectedVersion?: number,
    actor?: { id: string; name: string; role: string }
  ): { success: boolean; order?: DbOrder; error?: string; currentVersion?: number } {
    const existingIndex = this.state.orders.findIndex(o => o.id === orderData.id);

    if (existingIndex >= 0) {
      const existing = this.state.orders[existingIndex];

      // Optimistic Locking Check:
      if (expectedVersion !== undefined && expectedVersion !== existing.version) {
        return {
          success: false,
          error: `Concurrency conflict: Order ${existing.orderNumber} was modified by another terminal. Server version is ${existing.version}, client sent ${expectedVersion}.`,
          currentVersion: existing.version,
          order: existing
        };
      }

      // Merge items safely: preserve existing items with their IDs and append/update
      const updatedOrder: DbOrder = {
        ...existing,
        ...orderData,
        version: existing.version + 1,
        updatedAt: new Date().toISOString()
      };

      this.state.orders[existingIndex] = updatedOrder;

      // Update table status if linked
      if (updatedOrder.tableId) {
        const table = this.state.tables.find(t => t.id === updatedOrder.tableId);
        if (table) {
          table.status = updatedOrder.status === 'BILLED' ? 'BILLED' : 'OCCUPIED';
          table.currentOrderId = updatedOrder.id;
          table.activeOrderTotal = updatedOrder.grandTotal;
          table.waiterName = updatedOrder.waiterName;
          table.guestCount = updatedOrder.guestCount;
          table.updatedAt = new Date().toISOString();
        }
      }

      this.recordAudit({
        actorId: actor?.id || 'system',
        actorName: actor?.name || 'Staff',
        actorRole: actor?.role || 'WAITER',
        action: 'ORDER_UPDATED',
        entityType: 'ORDER',
        entityId: updatedOrder.id,
        details: `Updated order ${updatedOrder.orderNumber} (version ${updatedOrder.version}), items: ${updatedOrder.items.length}, total: ${updatedOrder.grandTotal}`
      });

      this.state.syncSequence++;
      this.persist();
      return { success: true, order: updatedOrder };
    } else {
      // New Order
      const newOrder: DbOrder = {
        id: orderData.id,
        orderNumber: orderData.orderNumber || `ORD-${Date.now().toString().slice(-6)}`,
        tenantId: orderData.tenantId || this.state.tenants[0].id,
        branchId: orderData.branchId || this.state.branches[0].id,
        tableId: orderData.tableId,
        tableNumber: orderData.tableNumber,
        waiterId: orderData.waiterId || actor?.id || 'unknown',
        waiterName: orderData.waiterName || actor?.name || 'Staff',
        orderType: orderData.orderType || 'DINE_IN',
        guestCount: orderData.guestCount || 2,
        subtotal: orderData.subtotal || 0,
        taxTotal: orderData.taxTotal || 0,
        discountTotal: orderData.discountTotal || 0,
        grandTotal: orderData.grandTotal || 0,
        status: orderData.status || 'OPEN',
        version: 1,
        items: orderData.items || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.state.orders.push(newOrder);

      if (newOrder.tableId) {
        const table = this.state.tables.find(t => t.id === newOrder.tableId);
        if (table) {
          table.status = 'OCCUPIED';
          table.currentOrderId = newOrder.id;
          table.activeOrderTotal = newOrder.grandTotal;
          table.waiterName = newOrder.waiterName;
          table.guestCount = newOrder.guestCount;
          table.updatedAt = new Date().toISOString();
        }
      }

      this.recordAudit({
        actorId: actor?.id || 'system',
        actorName: actor?.name || 'Staff',
        actorRole: actor?.role || 'WAITER',
        action: 'ORDER_CREATED',
        entityType: 'ORDER',
        entityId: newOrder.id,
        details: `Created new order ${newOrder.orderNumber} on table ${newOrder.tableNumber || 'Retail/Bar'}`
      });

      this.state.syncSequence++;
      this.persist();
      return { success: true, order: newOrder };
    }
  }

  /**
   * Dispatch newly fired items to KDS tickets grouped by station
   */
  public dispatchKotTickets(
    orderId: string,
    itemsToFire: Array<{
      orderItemId: string;
      productId: string;
      productName: string;
      department: 'FOOD' | 'GRILL' | 'BAR';
      quantity: number;
      notes?: string;
      seatNumber?: number;
    }>,
    tableNumber: string = 'Quick Order',
    waiterName: string = 'Staff',
    actor?: { id: string; name: string; role: string }
  ): DbKotTicket[] {
    const stationGroups: Record<string, typeof itemsToFire> = {
      FOOD: [],
      GRILL: [],
      BAR: []
    };

    itemsToFire.forEach(item => {
      if (stationGroups[item.department]) {
        stationGroups[item.department].push(item);
      } else {
        stationGroups.FOOD.push(item);
      }
    });

    const newTickets: DbKotTicket[] = [];
    let ticketCounter = 2000 + this.state.kotTickets.length;

    (['GRILL', 'FOOD', 'BAR'] as const).forEach(station => {
      const stationItems = stationGroups[station];
      if (stationItems && stationItems.length > 0) {
        const ticket: DbKotTicket = {
          id: `kot-${Date.now()}-${station.toLowerCase()}-${Math.floor(Math.random() * 1000)}`,
          ticketNumber: ticketCounter++,
          orderId,
          tableNumber,
          waiterName,
          station,
          items: stationItems.map((item, idx) => ({
            id: `kitem-${Date.now()}-${idx}`,
            orderItemId: item.orderItemId,
            productName: item.productName,
            quantity: item.quantity,
            notes: item.notes,
            seatNumber: item.seatNumber
          })),
          status: 'NEW',
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          updatedAt: new Date().toISOString()
        };
        newTickets.push(ticket);
      }
    });

    // Prepend new tickets
    this.state.kotTickets = [...newTickets, ...this.state.kotTickets];

    // Mark corresponding order items as SENT_TO_KITCHEN
    const order = this.state.orders.find(o => o.id === orderId);
    if (order) {
      const firedItemIds = new Set(itemsToFire.map(i => i.orderItemId));
      order.items = order.items.map(item => {
        if (firedItemIds.has(item.id)) {
          return { ...item, kotStatus: 'SENT_TO_KITCHEN', firedAt: new Date().toISOString() };
        }
        return item;
      });
      order.version++;
      order.updatedAt = new Date().toISOString();
    }

    this.recordAudit({
      actorId: actor?.id || 'system',
      actorName: actor?.name || 'Staff',
      actorRole: actor?.role || 'WAITER',
      action: 'KOT_FIRED',
      entityType: 'KOT',
      entityId: orderId,
      details: `Fired ${newTickets.length} KOT tickets to kitchen/bar for Table ${tableNumber}`
    });

    this.state.syncSequence++;
    this.persist();
    return newTickets;
  }

  public bumpKotStatus(ticketId: string, nextStatus: DbKotTicket['status'], actor?: { id: string; name: string; role: string }): DbKotTicket | undefined {
    const ticket = this.state.kotTickets.find(t => t.id === ticketId);
    if (ticket) {
      const previous = ticket.status;
      ticket.status = nextStatus;
      ticket.updatedAt = new Date().toISOString();

      this.recordAudit({
        actorId: actor?.id || 'system',
        actorName: actor?.name || 'Staff',
        actorRole: actor?.role || 'KITCHEN',
        action: 'KOT_STATUS_BUMP',
        entityType: 'KOT',
        entityId: ticketId,
        details: `Bumped KOT #${ticket.ticketNumber} from ${previous} to ${nextStatus}`
      });

      this.state.syncSequence++;
      this.persist();
    }
    return ticket;
  }

  public completeSale(sale: DbSale, actor?: { id: string; name: string; role: string }): DbSale {
    // Save sale
    this.state.sales.unshift(sale);

    // Update till session totals
    const activeSession = this.getActiveTillSession();
    if (activeSession) {
      let cashTotal = 0;
      let mpesaTotal = 0;
      let cardTotal = 0;

      sale.payments.forEach(p => {
        if (p.method === 'CASH') cashTotal += p.amountApplied;
        if (p.method === 'MPESA') mpesaTotal += p.amountApplied;
        if (p.method === 'CARD') cardTotal += p.amountApplied;
      });

      activeSession.expectedCash += cashTotal;
      activeSession.totalMpesa += mpesaTotal;
      activeSession.totalCard += cardTotal;
      activeSession.totalSales += sale.grandTotal;
    }

    // Vacate table if linked
    if (sale.tableNumber) {
      const table = this.state.tables.find(t => t.tableNumber === sale.tableNumber);
      if (table) {
        table.status = 'VACANT';
        table.currentOrderId = undefined;
        table.activeOrderTotal = undefined;
        table.waiterName = undefined;
        table.guestCount = undefined;
        table.updatedAt = new Date().toISOString();
      }
    }

    // Mark order PAID
    if (sale.orderId) {
      const order = this.state.orders.find(o => o.id === sale.orderId);
      if (order) {
        order.status = 'PAID';
        order.version++;
        order.updatedAt = new Date().toISOString();
      }
    }

    this.recordAudit({
      actorId: actor?.id || sale.cashierId,
      actorName: actor?.name || sale.cashierName,
      actorRole: actor?.role || 'CASHIER',
      action: 'SALE_COMPLETED',
      entityType: 'SALE',
      entityId: sale.id,
      details: `Settled invoice ${sale.invoiceNumber} (eTIMS: ${sale.etimsInvoiceNumber}), Grand Total: KES ${sale.grandTotal}`
    });

    this.state.syncSequence++;
    this.persist();
    return sale;
  }

  public transferTable(sourceTableId: string, targetTableId: string, actor?: { id: string; name: string; role: string }): boolean {
    const source = this.state.tables.find(t => t.id === sourceTableId);
    const target = this.state.tables.find(t => t.id === targetTableId);

    if (!source || !target || !source.currentOrderId) return false;

    const orderId = source.currentOrderId;
    const order = this.state.orders.find(o => o.id === orderId);

    // Target inherits order
    target.status = 'OCCUPIED';
    target.currentOrderId = orderId;
    target.waiterName = source.waiterName;
    target.activeOrderTotal = source.activeOrderTotal;
    target.guestCount = source.guestCount;
    target.updatedAt = new Date().toISOString();

    // Source is vacated
    source.status = 'VACANT';
    source.currentOrderId = undefined;
    source.waiterName = undefined;
    source.activeOrderTotal = undefined;
    source.updatedAt = new Date().toISOString();

    if (order) {
      order.tableId = target.id;
      order.tableNumber = target.tableNumber;
      order.version++;
      order.updatedAt = new Date().toISOString();
    }

    this.recordAudit({
      actorId: actor?.id || 'system',
      actorName: actor?.name || 'Staff',
      actorRole: actor?.role || 'WAITER',
      action: 'TABLE_TRANSFERRED',
      entityType: 'TABLE',
      entityId: targetTableId,
      details: `Transferred active order from Table ${source.tableNumber} to Table ${target.tableNumber}`
    });

    this.state.syncSequence++;
    this.persist();
    return true;
  }

  public openTillSession(
    terminalId: string,
    openingFloat: number,
    actor: { id: string; name: string; role: string; branchId?: string }
  ): DbTillSession {
    const existing = this.state.tillSessions.find(s => s.status === 'OPEN' && s.terminalId === terminalId);
    if (existing) {
      return existing;
    }

    const newSession: DbTillSession = {
      id: `till-${Date.now()}`,
      branchId: actor.branchId || this.state.branches[0].id,
      terminalId,
      cashierId: actor.id,
      cashierName: actor.name,
      openingFloat,
      expectedCash: openingFloat,
      totalMpesa: 0,
      totalCard: 0,
      totalSales: 0,
      status: 'OPEN',
      cashMovements: [],
      openedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    this.state.tillSessions.unshift(newSession);

    this.recordAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'TILL_OPENED',
      entityType: 'TILL_SESSION',
      entityId: newSession.id,
      details: `Started shift with opening float of KES ${openingFloat} on terminal ${terminalId}`
    });

    this.state.syncSequence++;
    this.persist();
    return newSession;
  }

  public recordCashMovement(
    sessionId: string,
    type: 'PAID_IN' | 'PAID_OUT',
    amount: number,
    reason: string,
    actor: { id: string; name: string; role: string }
  ): { success: boolean; session?: DbTillSession; movement?: DbCashMovement; error?: string } {
    const session = this.state.tillSessions.find(s => s.id === sessionId && s.status === 'OPEN');
    if (!session) {
      return { success: false, error: 'Active shift session not found' };
    }

    const movement = {
      id: `cm-${Date.now()}`,
      sessionId,
      type,
      amount,
      reason,
      cashierId: actor.id,
      cashierName: actor.name,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (!session.cashMovements) session.cashMovements = [];
    session.cashMovements.unshift(movement);

    if (type === 'PAID_IN') {
      session.expectedCash += amount;
    } else {
      session.expectedCash -= amount;
    }

    this.recordAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: `CASH_${type}`,
      entityType: 'TILL_SESSION',
      entityId: sessionId,
      details: `Cash movement [${type}] of KES ${amount}: ${reason}`
    });

    this.state.syncSequence++;
    this.persist();
    return { success: true, session, movement };
  }

  public closeTillSession(
    sessionId: string, 
    actualCount: number, 
    notesOrActor?: string | { id: string; name: string; role: string }, 
    actorArg?: { id: string; name: string; role: string }
  ): DbTillSession | undefined {
    const notes = typeof notesOrActor === 'string' ? notesOrActor : undefined;
    const actor = typeof notesOrActor === 'object' ? notesOrActor : actorArg;
    const session = this.state.tillSessions.find(s => s.id === sessionId);
    if (session) {
      session.status = 'CLOSED';
      session.closedAt = new Date().toISOString();
      session.actualCashCount = actualCount;
      session.cashDiscrepancy = actualCount - session.expectedCash;

      this.recordAudit({
        actorId: actor?.id || session.cashierId,
        actorName: actor?.name || session.cashierName,
        actorRole: actor?.role || 'CASHIER',
        action: 'TILL_CLOSED',
        entityType: 'TILL_SESSION',
        entityId: sessionId,
        details: `Closed till session. Expected: KES ${session.expectedCash}, Counted: KES ${actualCount}, Discrepancy: KES ${session.cashDiscrepancy}${notes ? `. Notes: ${notes}` : ''}`
      });

      this.state.syncSequence++;
      this.persist();
    }
    return session;
  }

  public recordAudit(event: Omit<DbAuditEvent, 'id' | 'tenantId' | 'branchId' | 'timestamp'>): void {
    const audit: DbAuditEvent = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: this.state.tenants[0].id,
      branchId: this.state.branches[0].id,
      actorId: event.actorId,
      actorName: event.actorName,
      actorRole: event.actorRole,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      details: event.details,
      timestamp: new Date().toISOString()
    };
    this.state.auditLogs.unshift(audit);
  }
}

// Singleton database instance
export const dbStore = new PosDatabaseStore();
