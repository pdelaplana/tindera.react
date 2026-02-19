# Post-Implementation Notes: Xendit GCash/Maya Integration

**Date:** 2026-02-20
**Status:** Complete (all 3 phases + post-launch fixes)

---

## Summary

All three planned phases were implemented and verified. During manual testing, several production bugs were discovered and fixed. This document records every change made across both the planned implementation and the post-launch debug sessions.

---

## Phase 1 & 2 (Previous Session)

Completed per `plan.md`. No changes required post-launch.

---

## Phase 3 Changes & Post-Launch Fixes (This Session)

### Fix 1: Xendit Channel Code Corrections

**Problem:** Xendit's Payment Request API nested structure (`payment_method.ewallet.channel_code`) uses bare codes — not the `PH_`-prefixed codes used in other Xendit APIs.

| Code | Wrong | Correct |
|------|-------|---------|
| GCash | `PH_GCASH` | `GCASH` |
| Maya | `PH_PAYMAYA` | `PAYMAYA` |

**Files changed:**
- `supabase/functions/create-xendit-charge/index.ts` — `EWALLET_CHANNEL_MAP`
- `supabase/functions/create-xendit-charge/index.test.ts` — matching test fixtures

---

### Fix 2: Webhook JWT Bypass

**Problem:** Supabase Edge Functions require JWT authentication by default. Xendit's webhook calls are server-to-server and do not include a Supabase JWT.

**Error:** `{"code":401,"message":"Missing authorization header"}`

**Solution:**
- Deploy with `--no-verify-jwt` flag
- Add to `supabase/config.toml`:
  ```toml
  [functions.xendit-webhook]
  verify_jwt = false
  ```
- Security is maintained via `x-callback-token` header verification

**Files changed:**
- `supabase/config.toml`

---

### Fix 3: Return URLs vs Webhook URL

**Problem:** `success_return_url` / `failure_return_url` in the Xendit charge payload are **customer browser redirect URLs** — not the server-to-server webhook endpoint. The app was incorrectly pointing these at the webhook edge function, causing browsers to hit the webhook directly.

**Solution:**
- Server webhook must be registered separately in: **Xendit Dashboard → Developers → Webhooks**
- Return URLs point to dedicated in-app pages (see Fix 6)
- App URL configurable via `APP_URL` Supabase secret (falls back to `SUPABASE_URL`)

**Files changed:**
- `supabase/functions/create-xendit-charge/index.ts`

---

### Fix 4: Amount Decimal Precision

**Problem:** Xendit rejects amounts with more than 2 decimal places.
**Error:** `currency 'PHP' can only represent up to 2 decimal place(s), but got '255.255'`

**Solution:** Round to 2 decimal places before sending to Xendit.

```ts
const amount = Math.round(body.amount * 100) / 100;
```

**Files changed:**
- `supabase/functions/create-xendit-charge/index.ts`

---

### Fix 5: Realtime Subscription → Polling

**Problem:** Supabase `postgres_changes` Realtime subscription requires enabling replication per-table in the Supabase dashboard, which requires a paid plan tier not available for this project.

**Solution:** Replaced Realtime subscription with a 3-second polling interval using a direct `supabase.from('orders').select('payment_received')` query. Functionally equivalent for this use case.

**Behaviour:**
- Polls every 3 seconds while the QR modal is open
- Calls `onSuccess()` as soon as `payment_received === true` is detected
- Polling stops automatically when the modal closes (interval cleared on unmount)

**Tests updated:** `XenditPaymentModal.test.tsx` — replaced 5 Realtime tests with 5 polling tests using `vi.advanceTimersByTimeAsync`.

**Files changed:**
- `src/features/pos/components/checkout/XenditPaymentModal.tsx`
- `src/features/pos/components/checkout/XenditPaymentModal.test.tsx`

---

### Fix 6: Cancel Leaves Ghost Pending Order

**Problem:** When the cashier cancelled the QR modal, the pending order (`payment_received: false`) was left in the database. If the Xendit payment later succeeded (e.g. customer scanned and paid after cashier cancelled), the webhook would still process it and mark it as paid.

**Solution:**
- On cancel, do a final DB check for `payment_received`
- If still unpaid → delete the order using `.eq('payment_received', false)` guard
- If paid (race condition) → treat as success instead of deleting

```ts
const handleXenditClose = async () => {
  if (xenditModal) {
    const { data } = await supabase.from('orders')
      .select('payment_received').eq('id', xenditModal.orderId).single();

    if (data?.payment_received) {
      handleXenditSuccess();
      return;
    }
    await deletePendingOrderMutation.mutateAsync(xenditModal.orderId);
  }
  setXenditModal(null);
};
```

**New service method:** `orderService.deletePendingOrder(orderId)` — deletes order only if `payment_received = false`.
**New hook:** `useDeletePendingOrder()`

**Files changed:**
- `src/services/order.service.ts` — added `deletePendingOrder()`
- `src/hooks/useOrder.ts` — added `useDeletePendingOrder()`
- `src/features/pos/components/checkout/CheckoutModal.tsx`

---

### Fix 7: Payment Redirect Pages

**Problem:** After completing payment on the e-wallet mock/app, the customer's browser was redirected to a blank or error page (`{"error":"requested path is invalid"}`).

**Solution:** Created two public (unauthenticated) pages:

| Route | Page | Shown when |
|-------|------|------------|
| `/payment/success` | `PaymentSuccessPage` | `success_return_url` redirect |
| `/payment/failed` | `PaymentFailedPage` | `failure_return_url` / `cancel_return_url` redirect |

Both pages:
- Use `IonPage` / `IonContent` for proper mobile rendering
- Show a clear icon (green checkmark / red X) and message
- Include a "Close this page" button (`window.close()`)
- Require no authentication

`PaymentFailedPage` also reads URL query params (`?status=cancelled`) to distinguish cancelled vs failed and adjusts the heading/copy accordingly.

**Files changed:**
- `src/features/payment/PaymentSuccessPage.tsx` (new)
- `src/features/payment/PaymentFailedPage.tsx` (new)
- `src/App.tsx` — added two public routes

---

### Test Mode Feature

**Feature:** In development mode, a "Copy URL" button appears on the QR modal so the cashier can copy the checkout URL and open it in a browser for manual testing (without needing a real GCash/Maya app).

- Controlled by `testMode?: boolean` prop on `XenditPaymentModal`
- `CheckoutModal` passes `testMode={import.meta.env.DEV}` — only visible in dev builds
- Clicking copies to clipboard and briefly shows "Copied!" confirmation

**Files changed:**
- `src/features/pos/components/checkout/XenditPaymentModal.tsx`
- `src/features/pos/components/checkout/XenditPaymentModal.test.tsx` — 4 new tests
- `src/features/pos/components/checkout/CheckoutModal.tsx`

---

## Supabase Secrets Required

| Secret | Purpose |
|--------|---------|
| `XENDIT_SECRET_KEY` | Xendit API authentication |
| `XENDIT_WEBHOOK_VERIFICATION_TOKEN` | Webhook callback verification |
| `APP_URL` | Base URL for payment redirect pages (e.g. `https://your-app.com`) |

---

## Xendit Dashboard Configuration Required

1. **Webhooks** → Add URL: `https://<project-ref>.supabase.co/functions/v1/xendit-webhook`
   - Event: `payment.succeeded` (and optionally `payment.failed`)
   - Copy the verification token → set as `XENDIT_WEBHOOK_VERIFICATION_TOKEN` secret

---

## Test Count

| File | Tests |
|------|-------|
| `create-xendit-charge/index.test.ts` | 27 |
| `XenditPaymentModal.test.tsx` | 23 |
| **Total new tests** | **50** |
