# DEMIPOS: Local PC Deployment & Complete Testing Guide

This guide walks you step-by-step through setting up, running, and thoroughly testing DEMIPOS on your local PC (Windows, macOS, or Linux) before deploying to production.

---

## 🛠️ Step 1: Prerequisites

Make sure you have **Node.js** installed on your PC:
1. Download and install **Node.js LTS (v18, v20, or v22)** from [https://nodejs.org](https://nodejs.org).
2. Verify the installation by opening your Terminal (macOS/Linux) or Command Prompt / PowerShell (Windows) and typing:
   ```bash
   node -v
   npm -v
   ```
   *(You should see version numbers, e.g., `v20.x.x` and `10.x.x`)*.

---

## 📥 Step 2: Download or Clone the Project

If using Git:
```bash
git clone <your-repo-url>
cd demipos
```
Or simply download and extract the ZIP file of the project to a folder on your PC (e.g., `C:\demipos` or `~/demipos`).

---

## 📦 Step 3: Install Dependencies

Open your terminal or command prompt inside the project directory and run:

```bash
npm install
```

This will automatically install all required packages (`react`, `vite`, `tailwindcss`, `lucide-react`, `motion`, etc.).

---

## 🚀 Step 4: Run the Application & Automated Tests

### 4.1 Run the Automated Integration Test Suite (Phase 1)
To verify server-side authentication, multi-waiter token verification, RBAC permissions, and optimistic concurrency control without manual clicking:

```bash
npm run test
```

This runs `tests/phase1-backend.test.ts` across 22 test assertions and outputs:
```text
========================================
🧪 DEMIPOS PHASE 1 INTEGRATION TEST SUITE
========================================
Test Group 1: Staff Authentication & Individual Sessions (PASS)
Test Group 2: Role-Based Access Control (RBAC) (PASS)
Test Group 3: Optimistic Concurrency Control on Shared Orders (PASS)
Test Group 4: Automated Station Routing for KOT Tickets (PASS)
Test Group 5: Table Transfer & Bill Migration (PASS)
Test Group 6: Multi-Tender Sale & Till Session Balancing (PASS)
Test Group 7: Audit Trail Verification (PASS)
========================================
TEST RESULTS: 22 PASSED, 0 FAILED
========================================
```

### 4.2 Start the Full-Stack Server
Start the central Node.js/Express server with Vite middleware:

```bash
npm run dev
```

You will see output similar to:
```
  VITE v6.x.x  ready in 250 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.1.15:3000/
```

1. Open your browser (Google Chrome, Microsoft Edge, Brave, or Firefox).
2. Visit **`http://localhost:3000`**.
3. The DEMIPOS application will load immediately!

> 💡 **Tip for Multi-Device Testing on the Same Local Wi-Fi**:
> If you want to test waiter ordering on your mobile phone or tablet while running the server on your PC, simply connect both your PC and phone to the same Wi-Fi network, and open the **Network URL** (e.g., `http://192.168.1.15:3000`) in your phone's browser!

---

## 🧪 Step 5: Complete Step-by-Step Testing Checklist

Run through these 8 comprehensive testing workflows to evaluate every module:

### Test 1: Restaurant Floor Plan & Table Management
1. In the top navigation bar, ensure **Restaurant** mode is selected.
2. Switch between sections: **Garden Terrace**, **Main Dining Floor**, **Sports Bar & Lounge**, and **VIP Lounge**.
3. Notice the live occupancy counters updating (`Vacant: 14`, `Occupied: 4`, `Billed: 2`).
4. Click on a **Vacant Table** (e.g. Table `T-02`).
5. Select items from categories like **Nyama Choma**, **Traditional Sides**, and **Beers & Ciders**.
6. Tap **+ Special instructions / Note** on an item (e.g. enter *"Extra kachumbari, well done"*).
7. Assign seats using the **S1, S2, S3, S4** seat buttons in the order ticket header.
8. Click **Fire KOT (New)**:
   - Notice the audio bell chime.
   - The items are marked with blue `Sent` badges.
9. Click **Hold & Exit** to return to the floor plan.
10. Click the **Move** button on the occupied table to transfer the bill to another table.

### Test 2: Kitchen & Bar Display System (KDS)
1. In the top navigation bar, click **Kitchen KDS**.
2. Notice that orders fired from tables are automatically segregated by station:
   - Food and Grill orders route to the **GRILL / FOOD STATION** (Red/Blue headers).
   - Drinks (Tusker, Dawa Cocktail) route to the **BAR STATION** (Amber header).
3. Test station filters: Click **Grill**, **Food**, or **Bar** at the top right to filter by work station.
4. Advance a ticket through kitchen lifecycle:
   - Click **Accept Ticket** (`NEW` → `ACCEPTED`).
   - Click **Start Preparing** (`ACCEPTED` → `PREPARING`).
   - Click **Mark Ready** (`PREPARING` → `READY`).
   - Click **Bump / Served** (`READY` → ticket is fulfilled and removed).

### Test 3: Split Billing Workflows
1. Go back to **Restaurant** mode and open an active table.
2. Click the **Split Bill** button:
3. Test all 3 split modes:
   - **Equal Split**: Select 2, 3, 4, or 5 paying guests -> system calculates exact KES per person.
   - **Split by Seat**: Settle Seat 1 independently from Seat 2.
   - **Select Specific Items**: Check off specific beers or dishes that one guest wants to pay for right now.
4. Click **Pay 1 Guest's Share** to open checkout for only that portion!

### Test 4: Multi-Tender Payments & Kenyan Payment Rails
1. Click **Checkout / Pay** on any active table or retail order.
2. In the checkout modal:
   - **Cash Payment**:
     - Use the on-screen touch numeric keypad.
     - Tap denomination shortcut chips (`+KES 500`, `+KES 1,000`, `+KES 2,000`, `+KES 5,000`).
     - Enter an amount higher than the bill to test automatic change calculation.
     - Click **Apply Cash**.
   - **M-Pesa STK Push**:
     - Switch tender to **M-Pesa STK**.
     - Enter a Kenyan mobile number (e.g. `0712345678`).
     - Click **Send M-Pesa STK Prompt**.
     - Observe the 2.5-second simulated handset PIN prompt.
     - Listen to the authentic M-Pesa confirmation chime and note the Safaricom receipt code (`SBG...`).
   - **Card / PDQ Terminal**:
     - Switch tender to **Card / Visa** and record terminal approval.
3. Click **Issue eTIMS Receipt**:
   - Preview the 80mm ESC/POS thermal receipt.
   - Note the KRA PIN, eTIMS Invoice Number, 16% VAT breakdown, and QR code verification link.
   - Click the **Print** icon to test your thermal printer or save as PDF.

### Test 5: Retail Lane & Hardware Barcode Scanner
1. In the top navigation, switch mode to **Retail**.
2. Connect any physical USB barcode scanner to your PC.
3. The barcode input is auto-focused:
   - Scan any product barcode with your physical scanner.
   - Alternatively, test using the **Barcode Emulator chips** (e.g. `TUSKER500`, `MILK-BROOK-500`, `FLOUR-JOGOO-2KG`, `OIL-ELIANTO-1L`).
   - Or type a barcode in the top field and hit **Enter**.
4. Test rapid quantity adjustment (`+` / `-`) and 1-tap multi-tender checkout.

### Test 6: Shift Till Z-Report (End of Shift Balancing)
1. In the top navigation, click the **Till / Shift icon** (`Shift: Active • KES 5,000`).
2. Review the shift summary:
   - Cash Float (KES 5,000).
   - Cash collected at till.
   - M-Pesa collections.
   - Card transactions.
3. **Blind Cash Drawer Count**:
   - Enter your counted cash in the drawer (e.g. enter `18000`).
   - Notice the real-time variance calculation:
     - Exact match = Green banner (`Exact Balance`).
     - Surplus = Blue banner (`Cash Surplus / Over`).
     - Shortage = Red banner (`Cash Shortage / Deficit`).
4. Click **Print Z-Report** to test end-of-shift thermal printing.

### Test 7: Offline Mode Resilience
1. In the top navigation bar, click the **ONLINE** badge.
2. It toggles to **OFFLINE** mode.
3. Ring up sales, fire KOTs, and settle cash transactions.
4. Watch the **Queue: X pending** counter increment. Transactions are stored locally without failing.

### Test 8: Staff Role Switching & Security PINs
1. In the top right corner, click the user profile pill (**Fast PIN Switch**).
2. Enter any of the built-in staff PINs to test role permissions:
   - **Waiter (Amina Wanjiku)**: `1111`
   - **Cashier (Brian Ochieng)**: `2222`
   - **Bartender (Dennis Kiprop)**: `3333`
   - **Chef (Faith Mwangi)**: `4444`
   - **General Manager (Kevin Otieno)**: `5555`
   - **Business Owner (Demi Admin)**: `9999`

---

## 🏭 Production Build Test

To verify that the application compiles into an optimized production bundle:

```bash
# 1. Build optimized static assets
npm run build

# 2. Preview the production build locally
npm run preview
```

The preview server will launch at `http://localhost:4173` with zero build warnings and maximum runtime performance.
