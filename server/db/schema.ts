/**
 * DEMIPOS Server-side Database Schema & Relational Models
 * Defines all tables, primary keys, foreign keys, constraints, and audit entities.
 */

export interface DbTenant {
  id: string;
  name: string;
  slug: string;
  kraPin: string;
  currency: string;
  country: string;
  createdAt: string;
}

export interface DbBranch {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  phone: string;
  address: string;
  etimsDeviceId: string;
  createdAt: string;
}

export interface DbTerminal {
  id: string;
  branchId: string;
  name: string;
  terminalCode: string; // e.g. WAITER-TAB-01, CASHIER-01, KITCHEN-KDS-01
  terminalType: 'WAITER_TABLET' | 'CASHIER_TILL' | 'KITCHEN_KDS' | 'BAR_KDS' | 'MANAGER_PC';
  station?: string; // FOOD, GRILL, BAR
  activeUserId?: string;
  lastSeenAt: string;
  isEnrolled: boolean;
  status: 'ONLINE' | 'OFFLINE';
  createdAt: string;
}

export interface DbUser {
  id: string;
  tenantId: string;
  branchId: string;
  name: string;
  phone: string;
  email: string;
  role: 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'SUPERVISOR' | 'CASHIER' | 'WAITER' | 'CHEF' | 'BARTENDER' | 'STOREKEEPER' | 'ACCOUNTANT';
  pinHash: string; // SHA-256 hashed 4-digit PIN
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

export interface DbFloorSection {
  id: string;
  branchId: string;
  name: string;
  displayOrder: number;
}

export interface DbDiningTable {
  id: string;
  branchId: string;
  sectionId: string;
  tableNumber: string;
  capacity: number;
  status: 'VACANT' | 'OCCUPIED' | 'BILLED' | 'RESERVED';
  currentOrderId?: string;
  waiterId?: string;
  waiterName?: string;
  guestCount?: number;
  activeOrderTotal?: number;
  occupiedSince?: string;
  updatedAt: string;
}

export interface DbOrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  department: 'FOOD' | 'GRILL' | 'BAR' | 'RETAIL';
  unitPrice: number;
  quantity: number;
  notes?: string;
  seatNumber?: number;
  kotStatus: 'NEW' | 'SENT_TO_KITCHEN' | 'SERVED' | 'VOIDED';
  firedAt?: string;
}

export interface DbOrder {
  id: string;
  orderNumber: string; // e.g. ORD-2026-1001
  tenantId: string;
  branchId: string;
  tableId?: string;
  tableNumber?: string;
  waiterId: string;
  waiterName: string;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'BAR_TAB' | 'RETAIL';
  guestCount: number;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  status: 'OPEN' | 'BILLED' | 'PAID' | 'CANCELLED';
  version: number; // Optimistic locking sequence
  items: DbOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface DbKotItem {
  id: string;
  orderItemId: string;
  productName: string;
  quantity: number;
  notes?: string;
  seatNumber?: number;
}

export interface DbKotTicket {
  id: string;
  ticketNumber: number;
  orderId: string;
  tableNumber: string;
  waiterName: string;
  station: 'FOOD' | 'GRILL' | 'BAR' | 'RETAIL';
  items: DbKotItem[];
  status: 'NEW' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface DbPaymentTender {
  id: string;
  saleId: string;
  method: 'CASH' | 'MPESA' | 'CARD' | 'CREDIT';
  amountTendered: number;
  amountApplied: number;
  changeGiven: number;
  transactionRef?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED';
  timestamp: string;
}

export interface DbSale {
  id: string;
  orderId?: string;
  invoiceNumber: string;
  tenantId: string;
  branchId: string;
  tableNumber?: string;
  waiterName: string;
  cashierId: string;
  cashierName: string;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  payments: DbPaymentTender[];
  paymentStatus: 'PAID' | 'PARTIALLY_PAID';
  etimsInvoiceNumber: string;
  etimsQrUrl: string;
  mpesaReceiptCode?: string;
  createdAt: string;
}

export interface DbTillSession {
  id: string;
  branchId: string;
  terminalId: string;
  cashierId: string;
  cashierName: string;
  openingFloat: number;
  expectedCash: number;
  actualCashCount?: number;
  cashDiscrepancy?: number;
  totalMpesa: number;
  totalCard: number;
  totalSales: number;
  status: 'OPEN' | 'CLOSED';
  openedAt: string;
  closedAt?: string;
}

export interface DbAuditEvent {
  id: string;
  tenantId: string;
  branchId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface DbMpesaTransaction {
  id: string;
  orderId: string;
  phone: string;
  amount: number;
  merchantRequestId: string;
  checkoutRequestId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT';
  mpesaReceiptNumber?: string;
  resultDesc?: string;
  environment: 'SIMULATED' | 'SANDBOX' | 'PRODUCTION';
  createdAt: string;
  updatedAt: string;
}
