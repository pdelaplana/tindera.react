# Implementation Plan: Xendit GCash/Maya Integration

## Phase 1: Environment & Settings Configuration
- [ ] Task: Configure Xendit environment variables in Supabase
    - [ ] Add `XENDIT_SECRET_KEY` to Supabase secrets
    - [ ] Add `XENDIT_PUBLIC_KEY` to Supabase secrets
    - [ ] Add `XENDIT_WEBHOOK_VERIFICATION_TOKEN` to Supabase secrets
- [ ] Task: Implement Payment Methods Settings UI
    - [ ] Write tests for `PaymentMethodsSettings` component
    - [ ] Create `PaymentMethodsSettings` component with toggles for Cash, GCash, and Maya
    - [ ] Integrate `PaymentMethodsSettings` into the main Settings page
- [ ] Task: Update Shop Schema/Service for Payment Method Preferences
    - [ ] Write tests for updating shop payment preferences
    - [ ] Update `shop.service.ts` to handle saving/loading enabled payment methods
    - [ ] Ensure preferences are persisted in the `shops` table in Supabase
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Environment & Settings Configuration' (Protocol in workflow.md)

## Phase 2: Checkout UI & Payment Initiation
- [ ] Task: Dynamic Payment Method Selection in Checkout
    - [ ] Write tests for `PaymentSelection` component filtering
    - [ ] Update Checkout/POS UI to only show enabled payment methods from Shop settings
- [ ] Task: Create 'Create Xendit Charge' Edge Function
    - [ ] Write unit tests for the Edge Function logic (mocking Xendit API)
    - [ ] Implement Supabase Edge Function to call Xendit API for GCash/Maya charge creation
    - [ ] Handle error responses from Xendit and return user-friendly errors
- [ ] Task: Implement QR Code Payment Modal
    - [ ] Write tests for `XenditPaymentModal` (QR display, timer logic)
    - [ ] Create `XenditPaymentModal` component with QR code, Order ID, and countdown timer
    - [ ] Trigger modal display when GCash/Maya is selected at checkout
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Checkout UI & Payment Initiation' (Protocol in workflow.md)

## Phase 3: Webhook & Real-time Fulfillment
- [ ] Task: Implement Xendit Webhook Handler
    - [ ] Write unit tests for webhook signature verification and order update logic
    - [ ] Implement Supabase Edge Function to receive and verify Xendit webhooks
    - [ ] Update `orders` table (set `paid = true`, `payment_method`, `external_id`) upon success
- [ ] Task: Implement Real-time Order Tracking in POS
    - [ ] Write tests for real-time subscription handling in the checkout flow
    - [ ] Update POS UI to subscribe to changes in the current order's `paid` status
    - [ ] Automatically transition to Success/Receipt screen when `paid` becomes `true`
- [ ] Task: Inventory Deduction on Payment Success
    - [ ] Write tests for inventory deduction trigger logic
    - [ ] Ensure inventory is deducted only after a successful payment (Cash or verified E-wallet)
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Webhook & Real-time Fulfillment' (Protocol in workflow.md)
