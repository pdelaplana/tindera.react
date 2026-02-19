# Implementation Plan: Xendit GCash/Maya Integration

## Phase 1: Environment & Settings Configuration
- [x] Task: Configure Xendit environment variables in Supabase
    - [x] Add `XENDIT_SECRET_KEY` to Supabase secrets
    - [x] Add `XENDIT_PUBLIC_KEY` to Supabase secrets
    - [x] Add `XENDIT_WEBHOOK_VERIFICATION_TOKEN` to Supabase secrets
- [x] Task: Implement Payment Methods Settings UI
    - [x] Write tests for `PaymentMethodsSettings` component (8 tests, all passing)
    - [x] Create `PaymentMethodsSettingsPage` with toggles for Cash, GCash, and Maya
    - [x] Integrate into Settings page (new nav item + route `/settings/pos/payment-methods`)
- [x] Task: Update Shop Schema/Service for Payment Method Preferences
    - [x] Add `getAllPaymentTypes()` and `upsertPaymentType()` to `order.service.ts`
    - [x] Add `useAllPaymentTypes()` and `useUpsertPaymentType()` hooks to `useOrder.ts`
    - [x] Preferences persisted via existing `payment_types` table (CASH/GCASH/MAYA records with `is_active`)
- [x] Task: Conductor - User Manual Verification 'Phase 1: Environment & Settings Configuration' (Protocol in workflow.md)

## Phase 2: Checkout UI & Payment Initiation
- [x] Task: Dynamic Payment Method Selection in Checkout
    - [x] `usePaymentTypes()` already filters by `is_active` — dynamic selection already working
    - [x] Added `isEwalletPayment` detection (GCASH/MAYA codes) in CheckoutModal
    - [x] Added `createEwalletOrder` + `createXenditCharge` service methods + hooks
    - [x] CheckoutModal branches: Cash → immediate completion, E-wallet → pending order + Xendit flow
- [x] Task: Create 'Create Xendit Charge' Edge Function
    - [x] Unit tests for channel mapping, payload construction, response extraction, validation (17 tests)
    - [x] `supabase/functions/create-xendit-charge/index.ts` implemented
    - [x] Validates auth, order ownership; calls Xendit ewallets API; returns checkoutUrl/qrString/expirationTime
    - [x] Returns user-friendly errors for all failure paths
- [x] Task: Implement QR Code Payment Modal
    - [x] Tests for QR display, countdown timer, cancel, payment method label (12 tests)
    - [x] `XenditPaymentModal` with QRCodeSVG, countdown timer, order details, cancel button
    - [x] Triggered from CheckoutModal when GCASH/MAYA selected and order created
- [x] Task: Conductor - User Manual Verification 'Phase 2: Checkout UI & Payment Initiation' (Protocol in workflow.md)

## Phase 3: Webhook & Real-time Fulfillment
- [x] Task: Implement Xendit Webhook Handler
    - [x] Unit tests for token verification, payload parsing, event routing, inventory record building (21 tests)
    - [x] `supabase/functions/xendit-webhook/index.ts` — verifies x-callback-token, handles payment.succeeded
    - [x] Updates `orders.payment_received = true` upon success (idempotent)
    - [x] Deducts inventory (product items, modifiers, addons) via direct Supabase admin queries
- [x] Task: Implement Real-time Order Tracking in POS
    - [x] Tests for Realtime subscription (subscribes on open, calls onSuccess on payment_received=true, cleans up on unmount) — 5 tests
    - [x] `XenditPaymentModal` subscribes to `postgres_changes` UPDATE on `orders` filtered by orderId
    - [x] Automatically calls `onSuccess()` when webhook sets `payment_received = true`
- [x] Task: Inventory Deduction on Payment Success
    - [x] Deduction runs inside xendit-webhook edge function after payment confirmation
    - [x] Handles product recipe components (product_items), modifiers, and addons
    - [x] Idempotent: skips if order.payment_received is already true
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Webhook & Real-time Fulfillment' (Protocol in workflow.md)
