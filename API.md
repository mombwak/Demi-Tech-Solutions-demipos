# DEMIPOS REST API & Integration Specification

Version: `v1`  
Base URL: `https://api.demipos.co.ke/api/v1`  
Auth Protocol: Laravel Sanctum Bearer Token / Fast Terminal PIN Exchange  
Header Requirements:
```http
Authorization: Bearer <SANCTUM_TOKEN>
X-Tenant-ID: <TENANT_UUID>
X-Branch-ID: <BRANCH_UUID>
X-Terminal-ID: <TERMINAL_UUID>
Idempotency-Key: <UNIQUE_UUID_V4>
Content-Type: application/json
Accept: application/json
```

---

## 1. Authentication & Cashier Session Endpoints

### 1.1 Terminal Quick PIN Login
Fast switch between waiters and cashiers on shared touch terminals without full email/password re-entry.
```http
POST /api/v1/auth/pin-login
```
**Request:**
```json
{
  "terminal_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "pin": "4819"
}
```
**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "u-9912",
      "name": "Faith Mwende",
      "role": "WAITER",
      "permissions": ["pos.create_order", "kot.view_station", "pos.split_bill"]
    },
    "token": "1|s8fkdjshf9832749823749823",
    "active_till_session": {
      "id": "till-session-401",
      "status": "OPEN",
      "opened_at": "2026-09-19T08:00:00Z"
    }
  }
}
```

---

## 2. Hospitality & Floor Plan Endpoints

### 2.1 Get Floor Plan & Table Matrix
```http
GET /api/v1/hospitality/floor-sections
```
**Response (200 OK):** Returns all sections, tables with active status, current bill summary, and waiter assignment.

### 2.2 Transfer Table / Merge Tables
```http
POST /api/v1/hospitality/tables/transfer
```
```json
{
  "source_table_id": "tbl-04",
  "target_table_id": "tbl-12",
  "reason": "Guest moved to non-smoking terrace",
  "transfer_mode": "FULL_MERGE"
}
```

---

## 3. Order & Kitchen Order Ticket (KOT) Endpoints

### 3.1 Dispatch Items to Kitchen / Bar
```http
POST /api/v1/orders/{order_id}/dispatch-kot
```
**Request:**
```json
{
  "items": [
    { "product_id": "prod-steak", "variant_id": "var-500g", "quantity": 2, "notes": "Medium-rare, extra mushroom sauce" },
    { "product_id": "prod-tusker", "quantity": 4, "notes": "Cold" }
  ]
}
```
**Backend Action:**  
Automatically analyzes items by product department:
- `prod-steak` -> Generates KOT ticket destined for `KITCHEN` (printed on thermal kitchen printer or displayed on KDS screen).
- `prod-tusker` -> Generates KOT ticket destined for `BAR`.

### 3.2 KDS Ticket Bump (Status Progression)
```http
PATCH /api/v1/kot/tickets/{ticket_id}/status
```
```json
{
  "status": "READY"
}
```
*Valid states: `NEW` -> `ACCEPTED` -> `PREPARING` -> `READY` -> `SERVED`*

---

## 4. Safaricom M-Pesa Daraja Integration

### 4.1 Initiate M-Pesa STK Push
```http
POST /api/v1/integrations/mpesa/stk-push
```
**Request:**
```json
{
  "sale_id": "sale-uuid-7718",
  "phone_number": "254712345678",
  "amount_kes": 2450.00,
  "account_reference": "DEMIPOS-T14",
  "transaction_desc": "Table 14 Dinner"
}
```
**Response (200 OK):**
```json
{
  "status": "PENDING",
  "checkout_request_id": "ws_CO_1909202605274591823",
  "customer_message": "STK prompt sent to customer phone. Awaiting PIN entry."
}
```

### 4.2 Safaricom Webhook Callback (Public Ingress)
```http
POST /api/v1/integrations/mpesa/callback
```
**Payload from Safaricom:**
```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "29123-992120-1",
      "CheckoutRequestID": "ws_CO_1909202605274591823",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          { "Name": "Amount", "Value": 2450.00 },
          { "Name": "MpesaReceiptNumber", "Value": "SBG71K990J" },
          { "Name": "TransactionDate", "Value": 20260919172810 },
          { "Name": "PhoneNumber", "Value": 254712345678 }
        ]
      }
    }
  }
}
```
**Security Logic:**
1. Validates webhook signature / whitelisted Safaricom IP ranges.
2. Checks transaction idempotency against `mpesa_transactions`.
3. Marks linked `payments` row as `COMPLETED`.
4. Emits real-time WebSocket event `order.payment_received` to terminal UI.

---

## 5. KRA eTIMS Fiscal Compliance API

### 5.1 Sign and Register Tax Invoice
```http
POST /api/v1/integrations/etims/sign-invoice
```
**Request:**
```json
{
  "sale_id": "sale-uuid-7718",
  "taxpayer_pin": "P051234567Z",
  "buyer_pin": "P059998881A",
  "items": [
    { "item_name": "Tusker Lager 500ml", "qty": 4, "unit_price": 350.00, "tax_rate": 0.16, "hs_code": "22030000" }
  ]
}
```
**Response (200 OK):**
```json
{
  "status": "SUCCESS",
  "etims_invoice_number": "ETIMS-DEMI-2026-000412",
  "fiscal_device_signature": "MEQCIFz8...KRAHASH...",
  "qr_code_url": "https://etims.kra.go.ke/verify?inv=ETIMS-DEMI-2026-000412&sig=MEQCIFz8",
  "offline_buffered": false
}
```
