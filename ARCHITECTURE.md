# DEMIPOS System Architecture Document

## 1. Product Architecture & Tiered UX Philosophy

### 1.1 The Progressive Complexity Paradigm
Frontline hospitality and retail staff in Kenya frequently face high staff turnover, peak-hour rush stress, and varying technical literacy. Exposing traditional ERP accounting matrices or multi-level stock ledgers to a waiter or cashier results in fatal user errors, slow queues, and cashier burnout.

DEMIPOS enforces a strict role-based progressive visibility model:

```
+-----------------------------------------------------------------------+
| SUPER ADMINISTRATOR  -> Multi-Tenant Provisioning, Platform Telemetry  |
+-----------------------------------------------------------------------+
| BUSINESS OWNER       -> Consolidated Financial BI, Multi-Branch P&L    |
+-----------------------------------------------------------------------+
| GENERAL MANAGER      -> Cash Sessions, Stock Audits, Costing, Wastage  |
+-----------------------------------------------------------------------+
| CASHIER / TILL OP    -> Rapid Barcode Scan, Multi-Tender Pay, Receipts  |
+-----------------------------------------------------------------------+
| WAITER / FLOOR OP    -> Table Map, Seat Notes, KOT Routing, Split Bill |
+-----------------------------------------------------------------------+
| KITCHEN / BAR OP     -> Kitchen Display Station (KDS), Ticket Bump Bar |
+-----------------------------------------------------------------------+
```

### 1.2 Information Architecture
```
DEMIPOS Core
 ├── Tenant Layer (Company, Subscription, Regional Currency: KES, Tax Rules)
 │    └── Branch / Outlets (Nairobi West, Kilimani, Kisumu, etc.)
 │         ├── Operational Zones (Dine-in Floor, Bar Lounge, Drive-thru, Retail Tills)
 │         ├── Warehouse / Stock Locations (Main Store, Kitchen Dispense, Bar Cellar)
 │         ├── Hardware Terminals (Till 1, Waiter Tablet 1, Kitchen Display, Bar Printer)
 │         └── Staff Assignments & Cash Tills
```

---

## 2. Recommended Technology Architecture

### 2.1 Production Platform Topology
```
 [ Mobile POS / Waiter Tablets / Retail Tills / KDS Screens ]
                           │ (HTTPS / WSS)
                           ▼
                 [ Cloudflare Edge CDN & WAF ]
                           │
                           ▼
             [ Nginx Ingress Load Balancers ]
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
   [ Laravel API Cluster ]       [ Real-time WebSocket Node ]
   (Auth, Sales, eTIMS, POS)      (Table Locks, KOT Dispatch)
            │                             │
    ┌───────┼─────────────────────────────┤
    ▼       ▼                             ▼
[ Redis Queue & Cache ]             [ MySQL 8.0 Primary-Replica ]
  (M-Pesa STK, eTIMS Sync)            (Tenant Partitioned / Scoped)
```

### 2.2 Local Terminal Hardware Gateway (POS Agent)
For hardware peripherals (ESC/POS 80mm thermal receipt printers, network KOT printers, cash drawers, weight scales, customer displays), DEMIPOS utilizes a lightweight local background agent (or WebUSB/WebSerial/WebBluetooth APIs) supporting standard ESC/POS protocol without proprietary print drivers.

---

## 3. Flagship Restaurant & Bar Workflow

The restaurant POS workflow is optimized for speed, table turnover, and culinary order accuracy:

```
[FLOOR PLAN VIEW] 
   │ Select Section (e.g. Garden Terrace, VIP Lounge, Main Dining)
   ▼
[TABLE STATUS CHECK]
   ├── Vacant Table (Green)  ──> Tap to Open -> Select Guests / Waiter -> Open Order
   ├── Occupied (Blue)       ──> Tap to View Active Bill -> Add Rounds / Modifiers
   ├── Billed/Printed (Amber)──> Guest requested check -> Ready for payment
   └── Reserved (Purple)     ──> Guest arriving -> Check in
   │
   ▼
[ORDER BUILDER]
   ├── Categories & Quick-Select Touch Grid (Burgers, Nyama Choma, Cocktails, Beers)
   ├── Variant & Modifier Matrix (Well-done, Fries or Salad, Extra Chili, No Ice)
   ├── Item Notes & Complimentary Flag (Manager PIN required for 100% discount)
   └── Course Firing (Starters first, Mains on hold)
   │
   ▼
[KOT GENERATION & ROUTING]
   ├── Route Items by Station:
   │     • Hot Dishes / Grills -> Hot Kitchen Printer / KDS
   │     • Salads / Cold Foods -> Pantry Station
   │     • Beers, Cocktails, Spirits -> Main Bar Display / Bar Printer
   └── State Tracking: NEW -> ACCEPTED -> PREPARING -> READY -> SERVED
   │
   ▼
[BILL MANAGEMENT & SETTLEMENT]
   ├── Split Bill Options:
   │     • By Seat / Guest
   │     • By Selected Items
   │     • Equal Split (e.g., divide KES 8,400 by 4 guests = KES 2,100 each)
   │     • Table Transfer / Merge (e.g., Table 4 joined Table 5)
   ├── Bill Preview & Pre-settlement Print
   └── Multi-Tender Checkout (Cash + M-Pesa + Card)
```

---

## 4. Bar Operations & Recipe/Beverage Depletion
Bar inventory represents the highest margin and highest leakage risk in Kenyan hospitality. DEMIPOS supports:
- **Bottle vs. Shot/Peg Unit Conversion**: A 750ml bottle of whisky tracks automatic depletion down to 25ml single shots or 50ml double pegs.
- **Cocktail Recipes (BOM)**: Ordering 1 "Dawa Cocktail" auto-deducts 60ml Vodka, 20ml Honey, and 1 Fresh Lime from Bar Inventory.
- **Bar Tabs**: Open running customer tabs assigned to names or card tokens, settled on departure.
- **Happy Hour Engine**: Automated rule-based price switching based on schedule and day of the week.

---

## 5. Retail & Supermarket POS Workflow

Retail mode minimizes taps through barcode-first input:
```
[SCANNER INPUT] ──> Barcode Event (USB/Bluetooth/Camera)
   │
   ├── Exact Match Found ──> Auto-increment quantity in active cart
   ├── Weighing Scale Item ──> Barcode 2XXXXX contains weight/price prefix -> Auto-decode Kgs & KES
   └── Multiple Variants Found ──> Modal quick-select
   │
   ▼
[CART MODIFIERS]
   ├── Instant Discount (Line item or Total Basket with permission check)
   ├── Customer Lookup / Loyalty Points Accrual & Redemption
   └── Fast Tender Hotkeys (Exact Cash, KES 1,000 note, KES 5,000 note, M-Pesa STK)
   │
   ▼
[CHECKOUT & TILL BALANCE]
   └── Kick Cash Drawer -> Trigger eTIMS Hash -> Print 80mm Receipt
```

---

## 6. Payment Architecture & Split Tender Handling

Payments are decoupled from orders to guarantee complete auditability, partial tenders, refunds, and chargebacks.

```
Sale Total: KES 10,000
 ├── Payment #1: CASH      KES 2,000  (Status: COMPLETED, Change Tendered: 0)
 ├── Payment #2: M-PESA    KES 5,000  (Status: COMPLETED, Ref: QGH47291KL)
 └── Payment #3: CARD      KES 3,000  (Status: COMPLETED, AuthCode: 981244)
=============================================================================
 Balance Due: KES 0 -> Sale State: PAID -> Issue Legal Invoice & Final Receipt
```

### Payment State Machine:
`PENDING` -> `AUTHORIZING` -> `COMPLETED` / `FAILED` / `REFUNDED` / `VOIDED`

---

## 7. Safaricom M-Pesa Daraja Integration Architecture

M-Pesa is Kenya's primary commerce rail. False positives or unverified requests create severe revenue leakage.

### 7.1 Flow Diagram:
```
[Terminal POS]              [DEMIPOS Backend]               [Safaricom Daraja]          [Customer Phone]
      │                             │                               │                           │
      │ 1. Initiate STK Push        │                               │                           │
      │    (Phone, KES Amount)      │                               │                           │
      ├────────────────────────────>│ 2. Generate Password & Nonce  │                           │
      │                             ├──────────────────────────────>│ 3. Push STK Prompt        │
      │                             │    (CheckoutRequestID)        ├──────────────────────────>│
      │ 4. Polling UI (Spinner)     │<──────────────────────────────┤                           │
      │<────────────────────────────┤                               │ 4. Enter M-Pesa PIN       │
      │                             │                               │<──────────────────────────┤
      │                             │ 5. Asynchronous Callback      │                           │
      │                             │<──────────────────────────────┤                           │
      │                             │    (ResultCode: 0, MpesaCode) │                           │
      │ 6. Push WebSocket Event     │                               │                           │
      │<────────────────────────────┤ 7. Verify Idempotency & Save  │                           │
      │ 8. Audio "Beep" & Print     │                               │                           │
```

### 7.2 Safety & Idempotency Rules:
1. **Never Trust Sent Status**: An STK request marked "Success" only means Safaricom received the push request, NOT that money moved. The transaction remains `PENDING` until the validated callback arrives or explicit status query completes.
2. **Double-Payment Lockout**: Once an STK request is active for a sale, concurrent STK pushes for the same amount/terminal are blocked until timeout (90s) or explicit cancellation.
3. **Manual Validation Fallback**: If customer network delays cause callback lag, cashiers with permission can input the 10-character M-Pesa code (e.g., `SBG12894JA`) for real-time background reversal/verification against Daraja B2C/C2B registers.

---

## 8. KRA eTIMS (Electronic Tax Invoice) Integration Architecture

The Kenya Revenue Authority mandates that all commercial sales transmit real-time cryptographic transaction hashes and invoices to eTIMS (Electronic Tax Invoice Management System).

### 8.1 Architectural Strategy
DEMIPOS provides an **Adapter / Gateway Pattern** (`EtimsDriverInterface`) so the system functions seamlessly regardless of whether the business uses:
- **eTIMS VSCU (Virtual Sales Control Unit - API/Server-to-Server)**
- **eTIMS OSCU (Online Sales Control Unit)**
- **Hardware Fiscal Devices (Type C/D ETR via Serial/Ethernet)**

### 8.2 Resilience & Offline Operation
When KRA eTIMS servers experience downtime or connectivity issues:
1. The POS generates a cryptographically signed internal receipt with an offline status stamp (`ETIMS_PENDING`).
2. Sale is finalized locally; customers are not stranded at the till.
3. Transactions are placed in an **Idempotent eTIMS Retry Queue**.
4. The background queue worker periodically dispatches batches with exponential backoff.
5. Upon confirmation, the KRA Fiscal Device Signature (FDS) and QR verification URL are persisted to the audit log.

---

## 9. Multi-Tenant & Multi-Branch Architecture

### 9.1 Tenant Isolation Model
DEMIPOS implements **Logical Multi-Tenancy with Global Tenant Scoping**:
- Every operational table contains `tenant_id` and `branch_id`.
- Database queries are automatically scoped at the ORM/repository level via tenant middleware.
- Cross-tenant data leakage is physically prevented through strict authorization gates.
- Super Admins can manage platform tenant subscriptions without accessing proprietary operational sales data.

### 9.2 Multi-Branch Data Flow
- **Centralized Catalog**: Products and base recipes can be pushed from Head Office to all branches or customized per branch (different cost of living / pricing in Nairobi vs. Kisumu).
- **Inter-Branch Stock Transfer**: Branch A issues a Transfer Order -> Branch B receives and performs a physical count verification before stock is incremented.

---

## 10. Offline Architecture & Synchronization

Hospitality and retail environments in Kenya frequently experience Wi-Fi drops and cellular congestion.

1. **Client-Side Storage**: Products, active floor maps, and cashier sessions are synchronized to IndexedDB.
2. **Local Order Generation**: When offline, the POS generates UUID-v4 order references prefixed with the terminal ID (e.g., `TILL1-LOCAL-883921`).
3. **Receipt Generation**: Thermal printers print receipts with an explicit watermark: `"OFFLINE RECORD - SYNC PENDING"`.
4. **Conflict Resolution Strategy**:
   - **Sales & Payments**: Append-only event sourcing prevents overwrites.
   - **Stock Adjustments**: Calculated on cloud receipt rather than local negative decrements to prevent race conditions across parallel terminals.
   - **Table Merges**: If two waiters assign orders to the same table while disconnected, the cloud sync engine automatically creates a merged guest tab.

---

## 11. Project Folder Structure

```
demipos/
├── ARCHITECTURE.md          # Complete architectural blueprint
├── DATABASE.md              # Database entity relationships and schemas
├── API.md                   # REST API and webhook specifications
├── SECURITY.md              # Security hardening and compliance controls
├── ROADMAP.md               # Implementation phases from MVP to Enterprise
├── CONTRIBUTING.md          # Development setup, branching, testing standards
├── README.md                # Project landing documentation
├── public/
│   └── favicon.svg
├── src/
│   ├── api/                 # Mock & Real API drivers (Laravel REST bridge)
│   │   ├── etimsDriver.ts   # eTIMS compliance abstraction & adapter
│   │   ├── mpesaDriver.ts   # Safaricom Daraja STK push & callback adapter
│   │   └── posClient.ts     # Central HTTP client with offline queue
│   ├── components/          # Reusable, accessible UI components
│   │   ├── common/          # Modals, Badges, TouchKeypad, Buttons
│   │   ├── layout/          # TopNav, Sidebar, RoleSwitchBanner, StatusIndicator
│   │   ├── pos/             # Cart, ProductGrid, TableSelector, QuickTender
│   │   ├── restaurant/      # FloorPlan, TableCard, KotTicketView, SplitBillModal
│   │   ├── retail/          # BarcodeScannerInput, WeightScaleModal, RapidSearch
│   │   ├── kitchen/         # KDSStationDisplay, KotBumpBar
│   │   ├── payments/        # MultiTenderModal, MpesaStkDialog, ReceiptPreview
│   │   └── reports/         # Z-Report, SalesCharts, InventoryAuditView
│   ├── context/             # Global React State & Context Providers
│   │   ├── AuthContext.tsx  # Multi-tenant Auth, Current Role & Permissions
│   │   ├── CartContext.tsx  # Active POS order, split bills, modifiers
│   │   └── PosContext.tsx   # Branch, Till session, offline sync status
│   ├── data/                # Seed fixtures (Kenyan menus, products, branches)
│   ├── types/               # Strict TypeScript domain interfaces
│   │   ├── auth.ts
│   │   ├── business.ts      # Tenant, Branch, Terminal
│   │   ├── inventory.ts     # Products, Recipes, Stock movements
│   │   ├── orders.ts        # Tables, Orders, KOTs, Bill Splits
│   │   └── payments.ts      # M-Pesa, eTIMS, Split tenders
│   ├── utils/               # Currency (KES) formatters, tax calculations, receipt builders
│   ├── App.tsx              # Root container with progressive role router
│   ├── main.tsx
│   └── index.css            # Tailwind CSS directives & high-contrast touch styling
```
