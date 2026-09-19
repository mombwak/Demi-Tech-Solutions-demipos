export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'OWNER' 
  | 'MANAGER' 
  | 'CASHIER' 
  | 'WAITER' 
  | 'CHEF' 
  | 'BARTENDER';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  pin: string; // 4-digit terminal quick login PIN
  avatar?: string;
  assignedBranchId: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  kraPin: string;
  currency: string;
  country: string;
  branches: Branch[];
}

export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  phone: string;
  address: string;
  etimsDeviceId?: string;
}

export type ProductDepartment = 'FOOD' | 'GRILL' | 'BAR' | 'RETAIL';

export interface ProductVariant {
  id: string;
  name: string;
  priceKes: number;
  barcode?: string;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  department: ProductDepartment;
  sku: string;
  barcode?: string;
  costPriceKes: number;
  sellingPriceKes: number;
  taxRatePercent: number; // e.g. 16 for standard VAT
  isWeighingScale?: boolean;
  unit?: string; // 'kg', 'portion', 'bottle', 'shot'
  image?: string;
  variants?: ProductVariant[];
  description?: string;
  isAvailable: boolean;
}

export interface Category {
  id: string;
  name: string;
  department: ProductDepartment;
  iconName: string;
  color: string;
}

export type TableStatus = 'VACANT' | 'OCCUPIED' | 'BILLED' | 'RESERVED';

export interface DiningTable {
  id: string;
  sectionId: string;
  tableNumber: string;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  waiterId?: string;
  waiterName?: string;
  guestCount?: number;
  activeOrderTotal?: number;
  occupiedSince?: string;
}

export interface FloorSection {
  id: string;
  branchId: string;
  name: string;
  displayOrder: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  department: ProductDepartment;
  unitPrice: number;
  quantity: number;
  notes?: string;
  seatNumber?: number;
  kotStatus: 'NEW' | 'SENT_TO_KITCHEN' | 'SERVED' | 'VOIDED';
}

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'BAR_TAB' | 'RETAIL';

export interface Order {
  id: string;
  tenantId: string;
  branchId: string;
  tableId?: string;
  tableNumber?: string;
  waiterId: string;
  waiterName: string;
  orderType: OrderType;
  guestCount: number;
  items: OrderItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  status: 'OPEN' | 'BILLED' | 'PAID' | 'CANCELLED';
  createdAt: string;
  notes?: string;
}

export type KotStatus = 'NEW' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';

export interface KotItem {
  id: string;
  orderItemId: string;
  productName: string;
  variantName?: string;
  quantity: number;
  notes?: string;
  seatNumber?: number;
}

export interface KotTicket {
  id: string;
  ticketNumber: number;
  orderId: string;
  tableNumber?: string;
  waiterName: string;
  station: ProductDepartment; // 'FOOD' | 'GRILL' | 'BAR'
  items: KotItem[];
  status: KotStatus;
  createdAt: string;
}

export type PaymentMethod = 'CASH' | 'MPESA' | 'CARD' | 'CREDIT';

export interface PaymentTender {
  id: string;
  method: PaymentMethod;
  amountTendered: number;
  amountApplied: number;
  changeGiven: number;
  transactionRef?: string;
  timestamp: string;
}

export interface Sale {
  id: string;
  orderId?: string;
  invoiceNumber: string;
  tableNumber?: string;
  waiterName: string;
  cashierName: string;
  items: OrderItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  payments: PaymentTender[];
  paymentStatus: 'PAID' | 'PARTIALLY_PAID';
  etimsInvoiceNumber: string;
  etimsQrUrl: string;
  mpesaReceiptCode?: string;
  createdAt: string;
}

export interface TillSession {
  id: string;
  cashierId: string;
  cashierName: string;
  branchId: string;
  openingFloat: number;
  openedAt: string;
  closedAt?: string;
  expectedCash: number;
  actualCashCount?: number;
  cashDiscrepancy?: number;
  totalMpesa: number;
  totalCard: number;
  totalSales: number;
  status: 'OPEN' | 'CLOSED';
}
