# DEMIPOS Engineering & Release Roadmap

This roadmap establishes the phased deployment schedule for Demi Tech Solutions' commercial rollout across Kenyan hospitality and retail businesses.

---

## 🏁 Phase 1: MVP Core (Flagship Restaurant & Bar POS)
- [x] Multi-Tenant & Multi-Branch data models
- [x] Progressive Role-Based Access Control (Super Admin, Owner, Manager, Cashier, Waiter, Chef, Bartender)
- [x] Category & Product Catalog with variant modifiers and pricing in KES
- [x] Floor Plan Visualizer with real-time table statuses (Vacant, Occupied, Billed, Reserved)
- [x] Touch-optimized Order Builder with seat notes, guest counts, item options
- [x] Kitchen Order Ticket (KOT) station routing (Food to Kitchen, Drinks to Bar)
- [x] Bill Splitting Engine (Split by seat, equal divide, item selection)
- [x] Multi-Tender Checkout (Cash with change calculation, M-Pesa reference, Card)
- [x] ESC/POS Compliant 80mm Receipt Builder with KRA fiscal placeholders
- [x] Terminal Quick PIN Switch for high-turnover shift staff

---

## 📦 Phase 2: Operations, Cash Control & Inventory
- [ ] Shift / Till Session Management (Opening float, blind cash count, drop cash, shift variance Z-Report)
- [ ] Raw Ingredient Catalog & Stock Unit Conversions (e.g., Kgs to Grams, Liters to Milliliters)
- [ ] Supplier Master & Purchase Orders (PO generation, Goods Received Notes / GRN)
- [ ] Stock Movement Ledger (Wastage logging, spoilage, inter-store transfers)
- [ ] Customer Directory & Credit Accounts (Pay later corporate tabs)
- [ ] Operational Reports: Daily X-Report, Daily Z-Report, Sales by Waiter, Hourly Sales Heatmap

---

## 🇰🇪 Phase 3: Kenyan Fiscal, Digital Payments & Kitchen Display (KDS)
- [ ] Safaricom Daraja M-Pesa Integration (STK Push, C2B Paybill/Till, webhook callback listener, status polling fallback)
- [ ] KRA eTIMS Compliance Engine (VSCU/OSCU adapter, digital signature hashing, printable QR verification URL, offline queue buffer)
- [ ] Kitchen Display System (KDS) Interactive Bump Screen (Touch tickets with preparation timers and priority alerts)
- [ ] Bar Dispense & Cocktail BOM Auto-Depletion (Track 750ml bottles down to 25ml/50ml shot sales)
- [ ] Real-time WebSocket table locking (Prevents two waiters ordering on Table 4 simultaneously)

---

## 🛒 Phase 4: Retail, Supermarket & Hardware Peripheral Scale
- [ ] Rapid Barcode Scanner Interface (USB HID, Bluetooth, and device camera scanning)
- [ ] Supermarket Weighing Scale Barcode Parser (EAN-13 price/weight embedded prefix decoding)
- [ ] Multi-Lane Cashier Tills with hardware cash drawer kick triggers
- [ ] Batch & Expiry Date Management with FIFO inventory rotation alerts
- [ ] Customer-Facing Pole Display (VFD / Secondary LCD order summary)

---

## 🌐 Phase 5: Multi-Branch Enterprise, BI & Offline Synchronization
- [ ] Multi-Branch Cloud Data Consolidation (Head Office Executive Dashboard)
- [ ] Central Warehouse Distribution & Automated Reorder Suggestions
- [ ] Customer Loyalty & Points Redemption Engine (Tiered discounts, SMS notifications)
- [ ] Local Offline PWA Engine with IndexedDB Cache & Conflict-Free Event Replay
- [ ] Public Developer REST API & Webhooks for accounting exports (QuickBooks, Zoho, Xero)
