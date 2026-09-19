# Contributing to DEMIPOS

Welcome to the DEMIPOS development team at Demi Tech Solutions. This repository contains the commercial codebase for the DEMIPOS point of sale and business operations platform.

---

## 1. Development Principles
1. **Never Break Frontline Speed**: Cashiers and waiters cannot wait 3 seconds for a button response. UI interactions on the POS screen must render in under 50ms.
2. **Never Hide Real Fiscal & Payment States**: An M-Pesa transaction is never marked successful until verified. Offline receipts must explicitly state their pending status.
3. **Strict TypeScript & Domain Integrity**: Avoid `any` types. Define all money calculations using integer cents or explicitly bounded two-decimal floating numbers with rounding safeguards.

---

## 2. Git Workflow & Branching Strategy
- `main`: Production-ready, deployable code.
- `develop`: Primary integration branch for sprint features.
- Feature branches: `feat/hospitality-split-bill`, `feat/mpesa-stk-push`, `feat/etims-adapter`.
- Bugfix branches: `fix/kot-printer-timeout`, `fix/till-variance-rounding`.

---

## 3. Code Standards & Linting
- **Frontend**:
  - React 19, functional components, custom hooks.
  - Styling via Tailwind CSS utility classes.
  - Icons strictly imported from `lucide-react`.
  - Animations via `motion/react`.
- **Backend**:
  - PSR-12 coding standard for PHP / Laravel.
  - Thin controllers, dedicated Service and Repository layers.
  - Form Requests for all input validations.

---

## 4. Testing Requirements
- Unit tests for all tax calculations (16% VAT, zero-rated, exemptions, catering levy).
- Integration tests for M-Pesa callback handlers and idempotency guards.
- Offline queue serialization and deserialization validation tests.
