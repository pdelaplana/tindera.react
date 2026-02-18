# Specification: Xendit GCash/Maya Integration

## Overview
Integrate Xendit GCash and Maya e-wallet payments into the Tindera POS checkout flow and provide a configuration interface in the Settings page. This enables merchants to accept digital payments directly within the app, providing a seamless experience for both staff and customers.

## Prerequisites
Before implementation and deployment, the following must be configured:
- **Xendit Merchant Account:** A valid Xendit account (Test mode for development, Live mode for production).
- **API Keys:**
    - `XENDIT_SECRET_KEY`: Required for server-side (Edge Function) authentication.
    - `XENDIT_PUBLIC_KEY`: Required for any potential client-side initialization.
- **Webhook Secret:** `XENDIT_WEBHOOK_VERIFICATION_TOKEN` to ensure incoming requests to the Supabase Edge Function are legitimate.
- **Supabase Configuration:** All Xendit keys and secrets must be stored securely in the Supabase Vault or as Edge Function environment variables.
- **Callback URL:** The Xendit Dashboard must be configured with the Tindera Supabase Edge Function URL to receive payment status updates.

## Functional Requirements
- **Payment Method Configuration (Settings):**
    - Add a new "Payment Methods" section in the Settings page.
    - Provide toggles to enable or disable each supported payment method: **Cash**, **GCash**, and **Maya**.
- **Dynamic Checkout Payment Options:**
    - The checkout screen must only display payment methods that are currently enabled in the Settings.
- **Xendit Charge Creation:**
    - When GCash or Maya is selected, an Edge Function will be called to create a Xendit charge for the specific e-wallet.
- **Payment Modal UI:**
    - Display a modal containing the Xendit-generated QR code or payment link.
    - Show the Transaction ID and total Order Amount clearly.
    - Include a visual countdown timer indicating the QR code's expiration time.
- **Webhook Integration:**
    - Implement a Supabase Edge Function to listen for Xendit webhooks (payment success).
    - The webhook handler must update the `order.paid` status to `true` in Supabase.
    - Upon payment confirmation, the system must automatically deduct the corresponding inventory items/ingredients based on the order details.
- **Real-time UI Updates:**
    - Use Supabase Realtime subscriptions to listen for changes to the order status.
    - The checkout modal should automatically close and navigate to the success/receipt screen once the payment is verified.

## Non-Functional Requirements
- **Security:** Ensure Xendit API keys and webhook secrets are stored securely.
- **Reliability:** Implement robust error handling for Xendit API failures, ensuring the staff is notified if a charge cannot be created.
- **Responsiveness:** The QR code modal must be mobile-friendly and easily readable in various lighting conditions.

## Acceptance Criteria
- [ ] Merchant can enable/disable Cash, GCash, and Maya in the Settings page.
- [ ] Checkout screen dynamically reflects the enabled payment methods.
- [ ] Staff can select GCash or Maya at checkout (if enabled).
- [ ] A modal appears with a valid QR code and order details for e-wallet payments.
- [ ] Completing the payment on a test GCash/Maya account triggers the webhook.
- [ ] The POS UI automatically updates to the success screen without manual intervention.
- [ ] Inventory counts are correctly updated in the database after the transaction.

## Out of Scope
- Integration of other Xendit payment methods (e.g., Credit Cards, Retail Outlets).
- Automated refund processing via Xendit (to be handled manually in this phase).
- Split payments between cash and e-wallets.
