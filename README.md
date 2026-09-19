# DEMIPOS: Commercial Multi-Tenant POS Platform for Kenya

> **"Simple enough for a beginner. Powerful enough for a growing business."**

DEMIPOS is an enterprise-grade, multi-tenant, cloud-and-offline Point of Sale and business operations platform built by **Demi Tech Solutions** specifically engineered for the Kenyan commercial ecosystem.

---

## 🎯 Flagship & Target Verticals
1. **Restaurants & Bars (Flagship)**: Table layout management, KOT generation & routing (Food/Grill/Bar), bottle-to-shot recipe tracking, split bills, customer tabs, waiter handhelds, kitchen display systems (KDS).
2. **Cafes & Quick-Service Restaurants (QSR)**: Lightning-fast queue ordering, combo items, dynamic modifier popups, buzzer/token calling.
3. **Retail Shops & Boutiques**: Rapid barcode lookups, customer store credit, supplier purchase returns.
4. **Supermarkets**: Multi-till lanes, weighing scale integration, batch & expiry management, high-concurrency barcode scanning, bulk stock movements.
5. **Multi-Branch Enterprises**: Centralized catalog, inter-branch stock transfers, consolidated financial BI, warehouse distribution.

---

## 🚀 Key Value Propositions
- **Zero Frontline Overwhelm**: Progressive complexity ensures cashiers and waiters interact only with oversized touch buttons, clean order builders, and 1-tap checkout. Back-office ERP complexity (journal entries, inventory variances, taxes) is reserved strictly for managers, admins, and accountants.
- **Deep Kenyan Localization**:
  - **Safaricom M-Pesa Daraja Integration**: Native STK Push, Till/Paybill support, background polling, asynchronous callbacks, and strict idempotency checks to prevent double billing.
  - **KRA eTIMS Integration**: Standardized compliance adapter supporting electronic tax invoice signatures, QR code generation, offline queuing, and automatic background reconciliation.
  - **Multi-Tender Payments**: Seamless split payments across Cash (KES), M-Pesa, Debit/Credit Card, Bank Transfer, and Customer Credit Tabs.
- **Offline-First Resilience**: Full operational continuity on network dropout. Local IndexedDB cache on client terminals with conflict-free queue replay upon reconnect.

---

## 📚 Technical Documentation Directory
- [System Architecture (ARCHITECTURE.md)](./ARCHITECTURE.md)
- [Database Schema & ERD (DATABASE.md)](./DATABASE.md)
- [REST API & Webhooks Specification (API.md)](./API.md)
- [Security & Compliance Architecture (SECURITY.md)](./SECURITY.md)
- [Engineering Roadmap & Release Phases (ROADMAP.md)](./ROADMAP.md)
- [Contributing Guidelines & Coding Standards (CONTRIBUTING.md)](./CONTRIBUTING.md)

---

## 🏗️ Core Technology Stack
- **Frontend / Terminal Tier**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion, Progressive Web App (PWA) offline service workers.
- **Backend / API Tier (Production Specification)**: Laravel 11 (PHP 8.3+), MySQL 8.0 / MariaDB 10.11, Redis (Cache, Queues, PubSub), Nginx.
- **Micro-Adapters**: Node.js/Go local printer & hardware gateway service for thermal ESC/POS and weighing scales.

---
© 2025–2026 Demi Tech Solutions. All rights reserved.
