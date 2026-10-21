/**
 * DEMIPOS Automated Backend & Multi-Terminal Integration Tests
 * Validates Phase 1 deliverables:
 * - Multi-waiter individual authentication & tokens
 * - Server-side RBAC permission enforcement
 * - Optimistic concurrency control & conflict detection on shared orders
 * - Automated KOT station routing
 * - Multi-tender settlement & till session updates
 * - Table transfers with audit trails
 */

import { dbStore, hashPin } from '../server/db/store';
import { generateToken, verifyToken } from '../server/middleware/auth';
import { DbUser, DbOrder } from '../server/db/schema';

let testPassed = 0;
let testFailed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  PASS: ${testName}`);
    testPassed++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    testFailed++;
  }
}

async function runTests() {
  console.log('\n========================================');
  console.log('🧪 DEMIPOS PHASE 1 INTEGRATION TEST SUITE');
  console.log('========================================\n');

  // Test 1: PIN Hashing and Authentication
  console.log('Test Group 1: Staff Authentication & Individual Sessions');
  const waiterA = dbStore.getUserByPin('1234'); // Faith (Waiter)
  const manager = dbStore.getUserByPin('5566'); // Sarah (Manager)
  const cashier = dbStore.getUserByPin('2233'); // Brian (Cashier)

  assert(waiterA !== undefined && waiterA.role === 'WAITER', 'Waiter A identified by PIN [1234]');
  assert(manager !== undefined && manager.role === 'MANAGER', 'Manager identified by PIN [5566]');
  assert(cashier !== undefined && cashier.role === 'CASHIER', 'Cashier identified by PIN [2233]');

  // Test Token Generation & Verification
  const tokenA = generateToken(waiterA!);
  const verifiedA = verifyToken(tokenA);
  assert(verifiedA !== null && verifiedA.sub === waiterA!.id, 'Bearer token successfully signed and verified for Waiter A');

  // Test 2: Role-Based Permissions (Server-Enforced RBAC)
  console.log('\nTest Group 2: Role-Based Access Control (RBAC)');
  const waiterPermissions = waiterA!.permissions;
  const managerPermissions = manager!.permissions;

  assert(waiterPermissions.includes('orders.create'), 'Waiter has permission [orders.create]');
  assert(!waiterPermissions.includes('reports.financials.view'), 'Waiter is denied permission [reports.financials.view]');
  assert(managerPermissions.includes('reports.financials.view'), 'Manager possesses permission [reports.financials.view]');
  assert(managerPermissions.includes('discounts.approve'), 'Manager possesses permission [discounts.approve]');

  // Test 3: Shared Order Creation & Optimistic Concurrency Control
  console.log('\nTest Group 3: Optimistic Concurrency Control on Shared Orders');
  const orderId = `test-ord-${Date.now()}`;
  const initialOrder: DbOrder = {
    id: orderId,
    orderNumber: 'ORD-TEST-01',
    tenantId: 'tenant-simba-01',
    branchId: 'branch-kilimani',
    tableId: 'tbl-02',
    tableNumber: 'T-02',
    waiterId: waiterA!.id,
    waiterName: waiterA!.name,
    orderType: 'DINE_IN',
    guestCount: 2,
    subtotal: 1600,
    taxTotal: 256,
    discountTotal: 0,
    grandTotal: 1856,
    status: 'OPEN',
    version: 1,
    items: [
      {
        id: 'item-1',
        orderId,
        productId: 'prod-mbuzi-1kg',
        productName: 'Mbuzi Choma 1kg',
        department: 'GRILL',
        unitPrice: 1600,
        quantity: 1,
        kotStatus: 'NEW'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const createResult = dbStore.saveOrderWithConcurrency(initialOrder, undefined, {
    id: waiterA!.id,
    name: waiterA!.name,
    role: waiterA!.role
  });
  assert(createResult.success && createResult.order?.version === 1, 'Initial order created at version 1');

  // Waiter A adds Tusker (updates version from 1 -> 2)
  const updateA = dbStore.saveOrderWithConcurrency(
    {
      id: orderId,
      grandTotal: 2206,
      items: [
        ...initialOrder.items,
        {
          id: 'item-2',
          orderId,
          productId: 'prod-tusker-500',
          productName: 'Tusker Lager',
          department: 'BAR',
          unitPrice: 350,
          quantity: 1,
          kotStatus: 'NEW'
        }
      ]
    },
    1, // Expected version 1
    { id: waiterA!.id, name: waiterA!.name, role: waiterA!.role }
  );
  assert(updateA.success && updateA.order?.version === 2, 'Waiter A successfully updated order (bumped to version 2)');

  // Waiter B concurrently attempts to update based on stale version 1
  const staleUpdateB = dbStore.saveOrderWithConcurrency(
    {
      id: orderId,
      grandTotal: 2500,
      items: initialOrder.items
    },
    1, // STALE Expected version 1!
    { id: 'usr-waiter-b', name: 'Waiter B', role: 'WAITER' }
  );

  assert(!staleUpdateB.success && staleUpdateB.currentVersion === 2, 'Stale concurrent edit from Waiter B correctly rejected with 409 Conflict!');

  // Test 4: Automated Station Routing for KOT Tickets
  console.log('\nTest Group 4: Automated Station Routing for KOT Tickets');
  const kotItemsToFire = [
    {
      orderItemId: 'item-1',
      productId: 'prod-mbuzi-1kg',
      productName: 'Mbuzi Choma 1kg',
      department: 'GRILL' as const,
      quantity: 1
    },
    {
      orderItemId: 'item-2',
      productId: 'prod-tusker-500',
      productName: 'Tusker Lager',
      department: 'BAR' as const,
      quantity: 1
    }
  ];

  const tickets = dbStore.dispatchKotTickets(
    orderId,
    kotItemsToFire,
    'T-02',
    waiterA!.name,
    { id: waiterA!.id, name: waiterA!.name, role: waiterA!.role }
  );

  assert(tickets.length === 2, 'Fired items split into 2 separate station tickets (GRILL and BAR)');
  const grillTicket = tickets.find(t => t.station === 'GRILL');
  const barTicket = tickets.find(t => t.station === 'BAR');
  assert(grillTicket !== undefined && grillTicket.items[0].productName === 'Mbuzi Choma 1kg', 'Mbuzi Choma routed to GRILL station');
  assert(barTicket !== undefined && barTicket.items[0].productName === 'Tusker Lager', 'Tusker Lager routed to BAR station');

  // Test 5: Table Transfer
  console.log('\nTest Group 5: Table Transfer & Bill Migration');
  const transferSuccess = dbStore.transferTable('tbl-02', 'tbl-04', {
    id: waiterA!.id,
    name: waiterA!.name,
    role: waiterA!.role
  });
  assert(transferSuccess, 'Active order successfully transferred from Table T-02 to T-04');
  const oldTable = dbStore.getTableById('tbl-02');
  const newTable = dbStore.getTableById('tbl-04');
  assert(oldTable?.status === 'VACANT', 'Source table T-02 marked VACANT');
  assert(newTable?.status === 'OCCUPIED' && newTable.currentOrderId === orderId, 'Target table T-04 marked OCCUPIED with active order ID');

  // Test 6: Multi-Tender Payment & Till Session
  console.log('\nTest Group 6: Multi-Tender Sale & Till Session Balancing');
  const initialTill = dbStore.getActiveTillSession()!;
  const prevCash = initialTill.expectedCash;
  const prevSales = initialTill.totalSales;

  dbStore.completeSale(
    {
      id: `sale-${Date.now()}`,
      orderId,
      invoiceNumber: 'INV-TEST-001',
      tenantId: 'tenant-simba-01',
      branchId: 'branch-kilimani',
      tableNumber: 'T-04',
      waiterName: waiterA!.name,
      cashierId: cashier!.id,
      cashierName: cashier!.name,
      subtotal: 1900,
      taxTotal: 304,
      discountTotal: 0,
      grandTotal: 2204,
      payments: [
        {
          id: 'pay-1',
          saleId: `sale-${Date.now()}`,
          method: 'CASH',
          amountTendered: 1204,
          amountApplied: 1204,
          changeGiven: 0,
          status: 'SUCCESS',
          timestamp: new Date().toLocaleTimeString()
        },
        {
          id: 'pay-2',
          saleId: `sale-${Date.now()}`,
          method: 'MPESA',
          amountTendered: 1000,
          amountApplied: 1000,
          changeGiven: 0,
          transactionRef: 'SBG882910J',
          status: 'SUCCESS',
          timestamp: new Date().toLocaleTimeString()
        }
      ],
      paymentStatus: 'PAID',
      etimsInvoiceNumber: 'ETIMS-DEMI-TEST-001',
      etimsQrUrl: 'https://etims.kra.go.ke/verify?inv=ETIMS-DEMI-TEST-001&pin=P051982736Z',
      createdAt: new Date().toISOString()
    },
    { id: cashier!.id, name: cashier!.name, role: cashier!.role }
  );

  const updatedTill = dbStore.getActiveTillSession()!;
  assert(updatedTill.expectedCash === prevCash + 1204, 'Till expected cash correctly increased by KES 1,204');
  assert(updatedTill.totalSales === prevSales + 2204, 'Till gross sales correctly increased by KES 2,204');
  const vacatedTable = dbStore.getTableById('tbl-04');
  assert(vacatedTable?.status === 'VACANT', 'Settled Table T-04 automatically restored to VACANT');

  // Test 7: Audit Logging
  console.log('\nTest Group 7: Audit Trail Verification');
  const auditLogs = dbStore.getAuditLogs();
  assert(auditLogs.length >= 5, 'Comprehensive audit entries generated for all actions');
  const lastAudit = auditLogs[0];
  assert(lastAudit.action === 'SALE_COMPLETED' && lastAudit.actorName === cashier!.name, 'Last audit log correctly records SALE_COMPLETED by Cashier');

  // Test 8: Shift Lifecycle & Petty Cash Management
  console.log('\nTest Group 8: Shift Lifecycle, Float & Petty Cash Movements');
  const activeTillBeforeMovements = dbStore.getActiveTillSession()!;
  const expectedBefore = activeTillBeforeMovements.expectedCash;

  // Paid Out test
  const paidOutRes = dbStore.recordCashMovement(
    activeTillBeforeMovements.id,
    'PAID_OUT',
    450,
    'Kitchen lemons & ice emergency purchase',
    { id: cashier!.id, name: cashier!.name, role: cashier!.role }
  );
  assert(paidOutRes.success && paidOutRes.movement?.type === 'PAID_OUT', 'Petty Cash Paid-Out successfully recorded');
  
  // Paid In test
  const paidInRes = dbStore.recordCashMovement(
    activeTillBeforeMovements.id,
    'PAID_IN',
    1000,
    'Emergency cash float top-up from safe',
    { id: cashier!.id, name: cashier!.name, role: cashier!.role }
  );
  assert(paidInRes.success && paidInRes.movement?.type === 'PAID_IN', 'Cash Float Paid-In successfully recorded');

  const activeTillAfterMovements = dbStore.getActiveTillSession()!;
  assert(
    activeTillAfterMovements.expectedCash === expectedBefore - 450 + 1000,
    `Till expected cash updated precisely by net cash movements (expected: ${expectedBefore - 450 + 1000}, actual: ${activeTillAfterMovements.expectedCash})`
  );
  assert(
    (activeTillAfterMovements.cashMovements?.length ?? 0) >= 2,
    'Till session preserves complete cash movement history'
  );

  // Close shift (Z-Report with blind count)
  const blindCashCounted = activeTillAfterMovements.expectedCash - 50; // 50 KES short
  const closedSession = dbStore.closeTillSession(
    activeTillAfterMovements.id,
    blindCashCounted,
    'Evening shift closed. Minor KES 50 shortage due to coin change rounding.',
    { id: cashier!.id, name: cashier!.name, role: cashier!.role }
  );
  assert(closedSession !== undefined && closedSession.status === 'CLOSED', 'Shift successfully closed with Z-Report generated');
  assert(closedSession?.cashDiscrepancy === -50, 'Blind cash drawer variance precisely computed (-50 KES discrepancy)');

  // Open a new shift with fresh opening float
  const newShiftSession = dbStore.openTillSession(
    'POS-BAR-02',
    7500,
    { id: cashier!.id, name: cashier!.name, role: cashier!.role }
  );
  assert(newShiftSession !== undefined && newShiftSession.status === 'OPEN', 'New shift opened with status OPEN');
  assert(newShiftSession.openingFloat === 7500, 'New shift initialized with KES 7,500 opening float');
  assert(newShiftSession.expectedCash === 7500, 'Expected cash matches opening float on fresh shift');

  console.log('\n========================================');
  console.log(`TEST RESULTS: ${testPassed} PASSED, ${testFailed} FAILED`);
  console.log('========================================\n');

  if (testFailed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
