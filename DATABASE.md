# DEMIPOS Database Architecture & Domain Model

This document outlines the relational entity-relationship plan and table schemas designed for high-concurrency commercial POS, inventory, hospitality, retail, and tax compliance operations.

---

## 1. Domain Entities Overview

```
 [tenants]
    │ 1:M
    ├── [branches] ──1:M── [warehouses] ──1:M── [stock_ledgers]
    │      │ 1:M
    │      ├── [floor_sections] ──1:M── [tables]
    │      ├── [terminals] ──1:M── [till_sessions] ──1:M── [cash_movements]
    │      └── [orders] ──1:M── [order_items]
    │             │                  │
    │             ├──1:M── [kots] ──1:M── [kot_items]
    │             └──1:1── [sales] ──1:M── [sale_items]
    │                         │
    │                         ├──1:M── [payments] ──1:M── [mpesa_transactions]
    │                         └──1:1── [etims_transactions]
    │
    ├── [products] ──1:M── [product_variants]
    │      │ 1:M
    │      └──1:1── [recipes] ──1:M── [recipe_ingredients] ──> [inventory_items]
    │
    └── [users] ──M:N── [roles] ──M:N── [permissions]
```

---

## 2. Core Relational Schemas (MySQL 8.0 / MariaDB 10.11 / PostgreSQL)

### 2.1 Multi-Tenancy, Organizations & Security

#### `tenants`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID v4 |
| `name` | `VARCHAR(150)` | `NOT NULL` | Business name (e.g., "Carnivore Hospitality Group") |
| `slug` | `VARCHAR(60)` | `UNIQUE, NOT NULL` | URL subdomain or identifier |
| `kra_pin` | `VARCHAR(20)` | `NULLABLE` | Kenya Revenue Authority Tax PIN |
| `currency` | `VARCHAR(3)` | `DEFAULT 'KES'` | Default currency |
| `timezone` | `VARCHAR(40)` | `DEFAULT 'Africa/Nairobi'` | Regional timezone |
| `status` | `ENUM` | `'active','suspended','trial'` | Subscription state |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Audit timestamp |

#### `branches`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID v4 |
| `tenant_id` | `VARCHAR(36)` | `FOREIGN KEY -> tenants(id)` | Tenant isolation scope |
| `code` | `VARCHAR(20)` | `NOT NULL` | Branch code (e.g., `NB-CBD-01`) |
| `name` | `VARCHAR(100)` | `NOT NULL` | Branch display name (e.g., "Westlands Flagship") |
| `phone` | `VARCHAR(20)` | `NOT NULL` | Operational contact number |
| `address` | `TEXT` | `NULLABLE` | Physical location / building |
| `etims_device_id`| `VARCHAR(50)` | `NULLABLE` | Bound KRA eTIMS hardware/virtual device ID |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Audit timestamp |

#### `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `VARCHAR(36)` | `PRIMARY KEY` | UUID v4 |
| `tenant_id` | `VARCHAR(36)` | `FOREIGN KEY -> tenants(id)` | Tenant boundary |
| `name` | `VARCHAR(100)` | `NOT NULL` | Full legal name |
| `email` | `VARCHAR(150)` | `NULLABLE, INDEX` | Login identifier |
| `phone` | `VARCHAR(20)` | `NULLABLE, INDEX` | Kenyan phone number (254...) |
| `pin_hash` | `VARCHAR(255)` | `NOT NULL` | Hashed 4-6 digit quick login PIN for touch terminals |
| `password_hash`| `VARCHAR(255)` | `NULLABLE` | Hashed administrative password |
| `is_active` | `BOOLEAN` | `DEFAULT TRUE` | User enablement status |

#### `roles` & `permissions`
- `roles`: `id`, `tenant_id`, `name` (`SUPER_ADMIN`, `OWNER`, `MANAGER`, `CASHIER`, `WAITER`, `CHEF`, `BARTENDER`)
- `permissions`: `id`, `name`, `module` (e.g., `pos.apply_discount`, `reports.view_profit`, `kot.cancel_item`, `cash.open_drawer`)
- `role_permissions`: `role_id`, `permission_id`
- `user_branches`: `user_id`, `branch_id`

---

### 2.2 Hospitality & Restaurant Operations

#### `floor_sections`
| Column | Type | Description |
|---|---|---|
| `id` | `VARCHAR(36) PRIMARY KEY` | UUID |
| `branch_id` | `VARCHAR(36) FK` | Outlets boundary |
| `name` | `VARCHAR(50)` | e.g., "Main Dining", "Garden Terrace", "Sports Bar", "VIP Lounge" |
| `display_order` | `INT DEFAULT 0` | Visual ordering tab sequence |

#### `tables`
| Column | Type | Description |
|---|---|---|
| `id` | `VARCHAR(36) PRIMARY KEY` | UUID |
| `section_id` | `VARCHAR(36) FK` | Assigned floor zone |
| `table_number` | `VARCHAR(20)` | Display label (e.g., "T-14", "Bar 02") |
| `capacity` | `INT DEFAULT 4` | Seating capacity |
| `status` | `ENUM` | `'VACANT', 'OCCUPIED', 'BILLED', 'RESERVED', 'CLEANING'` |
| `current_order_id`| `VARCHAR(36) FK NULLABLE`| Active open order reference |
| `pos_x`, `pos_y` | `INT` | 2D visual layout coordinates on floor plan |

#### `orders` & `order_items`
- `orders`: `id`, `tenant_id`, `branch_id`, `table_id`, `waiter_id`, `order_type` (`DINE_IN`, `TAKEAWAY`, `DELIVERY`, `BAR_TAB`), `guest_count`, `order_status` (`OPEN`, `HELD`, `BILLED`, `COMPLETED`, `CANCELLED`), `subtotal`, `tax_total`, `discount_total`, `tip_amount`, `grand_total`, `opened_at`, `closed_at`.
- `order_items`: `id`, `order_id`, `product_id`, `variant_id`, `quantity`, `unit_price`, `subtotal`, `item_notes` (e.g., "No onions, extra chili"), `kot_status` (`NEW`, `SENT_TO_KITCHEN`, `SERVED`, `VOIDED`), `seat_number`.

#### `kitchen_order_tickets (kots)` & `kot_items`
- `kots`: `id`, `branch_id`, `order_id`, `ticket_number` (sequential daily integer), `destination_station` (`KITCHEN`, `GRILL`, `BAR`, `COFFEE`), `status` (`NEW`, `ACCEPTED`, `PREPARING`, `READY`, `SERVED`, `CANCELLED`), `printed_at`.
- `kot_items`: `id`, `kot_id`, `order_item_id`, `quantity`, `special_instructions`.

---

### 2.3 Product Catalog, Inventory & Recipe Management

#### `products` & `categories`
- `categories`: `id`, `tenant_id`, `name`, `icon`, `color_code`, `department` (`FOOD`, `BEVERAGE`, `RETAIL`, `SERVICE`).
- `products`: `id`, `tenant_id`, `category_id`, `sku`, `barcode`, `name`, `description`, `product_type` (`STANDARD`, `RECIPE_BASED`, `VARIABLE_WEIGHT`, `COMBO`), `cost_price_kes`, `selling_price_kes`, `tax_rate_percent` (e.g., `16.0` standard VAT, `0.0` zero-rated, `8.0`), `is_available`, `image_url`.

#### `recipes` & `recipe_ingredients` (BOM)
- `recipes`: `id`, `product_id`, `yield_quantity`, `yield_unit` (e.g., 1 serving).
- `recipe_ingredients`: `id`, `recipe_id`, `ingredient_item_id`, `quantity_required`, `unit_of_measure` (e.g., 60 ml, 200 grams).

#### `inventory_items` & `stock_ledgers`
- `inventory_items`: Raw materials and non-menu supplies (e.g., Beef Fillet 1kg, Vodka 750ml, Tomato Paste, Cooking Gas).
- `stock_ledgers`: Immutable double-entry ledger tracking all movements (`SALE_DEPLETION`, `PURCHASE_RECEIPT`, `TRANSFER_IN`, `TRANSFER_OUT`, `WASTAGE`, `VARIANCE_ADJUSTMENT`).

---

### 2.4 Sales, Multi-Tender Payments & Fiscal Tax

#### `sales`
| Column | Type | Description |
|---|---|---|
| `id` | `VARCHAR(36) PRIMARY KEY` | UUID |
| `tenant_id` | `VARCHAR(36) FK` | Organization boundary |
| `branch_id` | `VARCHAR(36) FK` | Outlet boundary |
| `order_id` | `VARCHAR(36) FK NULLABLE` | Associated restaurant order |
| `invoice_number` | `VARCHAR(50) UNIQUE`| Human-readable sequential reference (e.g., `INV-2026-00491`) |
| `total_amount_kes`| `DECIMAL(12,2)` | Gross payable amount |
| `tax_amount_kes` | `DECIMAL(12,2)` | Computed VAT (16%) |
| `discount_kes` | `DECIMAL(12,2)` | Total discounts applied |
| `payment_status` | `ENUM` | `'PENDING', 'PARTIALLY_PAID', 'PAID', 'REFUNDED', 'VOID'` |
| `created_at` | `TIMESTAMP` | Timestamp |

#### `payments` (Unified Tender Abstraction)
| Column | Type | Description |
|---|---|---|
| `id` | `VARCHAR(36) PRIMARY KEY` | UUID |
| `sale_id` | `VARCHAR(36) FK` | Related sale |
| `till_session_id`| `VARCHAR(36) FK` | Open cashier shift |
| `method` | `ENUM` | `'CASH', 'MPESA', 'CARD', 'BANK_TRANSFER', 'CUSTOMER_CREDIT'` |
| `amount_tendered`| `DECIMAL(12,2)` | Currency paid by customer |
| `amount_applied` | `DECIMAL(12,2)` | Deducted from invoice |
| `change_returned`| `DECIMAL(12,2)` | Cash change given back |
| `transaction_ref`| `VARCHAR(100)` | External reference (e.g., M-Pesa Code) |
| `status` | `ENUM` | `'PENDING', 'COMPLETED', 'FAILED', 'REVERSED'` |

#### `mpesa_transactions`
| Column | Type | Description |
|---|---|---|
| `id` | `VARCHAR(36) PRIMARY KEY` | UUID |
| `payment_id` | `VARCHAR(36) FK` | Linked tender |
| `merchant_request_id`| `VARCHAR(100)` | Daraja internal dispatch ID |
| `checkout_request_id`| `VARCHAR(100) UNIQUE`| Daraja STK Push session handle |
| `phone_number` | `VARCHAR(20)` | MSISDN format `2547XXXXXXXX` |
| `mpesa_receipt_number`| `VARCHAR(30) UNIQUE`| Safaricom code (e.g., `SBG71K990J`) |
| `result_code` | `INT` | `0` = Success, `1032` = Cancelled by user |
| `result_desc` | `TEXT` | Safaricom response message |
| `raw_callback_json`| `JSON` | Full cryptographic audit payload |

#### `etims_transactions`
| Column | Type | Description |
|---|---|---|
| `id` | `VARCHAR(36) PRIMARY KEY` | UUID |
| `sale_id` | `VARCHAR(36) FK` | Bound fiscal sale |
| `etims_invoice_number`| `VARCHAR(60)` | KRA designated electronic invoice number |
| `fiscal_device_serial`| `VARCHAR(50)` | Virtual or hardware device serial |
| `internal_data_hash`| `VARCHAR(255)` | SHA-256 integrity signature of transaction items |
| `kra_qr_url` | `TEXT` | Validation URL encoded in printable QR code |
| `sync_status` | `ENUM` | `'OFFLINE_QUEUED', 'SUBMITTED', 'VERIFIED', 'FAILED_RETRY'` |
| `submission_attempts`| `INT DEFAULT 0` | Retry counter |
