# DEMIPOS Security & Compliance Architecture

## 1. Zero Frontend Secrets Policy
- **Strict Prohibition**: No M-Pesa Daraja Consumer Keys, Consumer Secrets, Passkeys, Shortcodes, or eTIMS cryptographic private keys or certificates may ever be bundled in client-side code, `.env` files exposed to Vite, or terminal memory.
- **Server Gateway Proxy**: All payment integrations, Daraja token requests, and eTIMS signature calls are dispatched exclusively from protected server-side workers.

---

## 2. Multi-Tenant Data Isolation
1. **Row-Level Tenant Scoping**: Every operational entity holds a foreign key to `tenant_id`.
2. **Global Repository Scoping**: At the framework query layer (e.g., Laravel Global Scopes / Eloquent Middleware), every database query is automatically injected with `WHERE tenant_id = :authenticated_tenant`.
3. **Cross-Tenant Breach Prevention**: Path parameters in REST endpoints (e.g., `/api/v1/orders/{id}`) undergo strict boundary verification:
   ```php
   if ($order->tenant_id !== auth()->user()->tenant_id) {
       abort(403, "Unauthorized tenant resource access attempt logged.");
   }
   ```
4. **Isolated Storage**: Tenant attachments (receipt logos, staff ID photos, inventory delivery notes) are stored in partitioned S3 buckets: `s3://demipos-storage/tenants/{tenant_id}/...`.

---

## 3. Frontline Terminal Authentication & Fast PIN Security
- **Dual Credential Architecture**:
  - **Administrative Password**: Used for web back-office, financial reports, user provisioning, system configuration. Standard Argon2id/Bcrypt hashing with 12+ character complexity and optional 2FA.
  - **Fast Terminal PIN (4-6 digits)**: Used by floor staff (waiters, bartenders, cashiers) on shared hardware touch terminals to quickly unlock sessions without typing complex passwords.
- **PIN Brute-Force Rate Limiting**:
  - 5 incorrect PIN attempts locks the terminal for 3 minutes and dispatches an audit alert to the Branch Manager.
- **Manager Override Authorization**:
  - Actions with high financial leakage risk (Item Voids after KOT print, Cash Drawer Manual Kick, Line Discounts > 10%, Complimentary 100% bills) strictly require an in-person Manager PIN override popup.

---

## 4. Payment Integrity & Idempotency
- **Idempotency Keys**: All financial transactions submit an `Idempotency-Key` HTTP header. Duplicate requests within a 24-hour window return the cached initial transaction result without charging again.
- **M-Pesa Double-Payment Prevention**:
  - Webhook callbacks verify `MpesaReceiptNumber` uniqueness with a database unique index constraint.
  - Concurrent STK pushes for a single order are locked in Redis until the active prompt resolves or expires.

---

## 5. Fraud Prevention & Immutable Audit Trails
DEMIPOS records an append-only audit log table (`audit_logs`) tracking:
- Cash drawer manual open events without sale
- Order item cancellations and cancellations after KOT has already printed
- Bill reprint counts (preventing bill reuse fraud)
- Cashier till variance (expected cash vs counted cash at shift close)
- Price overrides and manual discounts
- eTIMS submission failures and resubmissions
