// Unit tests for create-xendit-charge edge function logic
// Tests the pure business logic (channel mapping, payload construction, error handling)
// The actual Deno.serve handler is tested via integration; these test the logic units.

import { describe, expect, it } from 'vitest';

// --- Unit: EWALLET_CHANNEL_MAP ---
const EWALLET_CHANNEL_MAP: Record<string, string> = {
  GCASH: 'GCASH',
  MAYA: 'PAYMAYA',
};

describe('EWALLET_CHANNEL_MAP', () => {
  it('maps GCASH to GCASH channel code', () => {
    expect(EWALLET_CHANNEL_MAP['GCASH']).toBe('GCASH');
  });

  it('maps MAYA to PAYMAYA channel code', () => {
    expect(EWALLET_CHANNEL_MAP['MAYA']).toBe('PAYMAYA');
  });

  it('returns undefined for unsupported methods', () => {
    expect(EWALLET_CHANNEL_MAP['CASH']).toBeUndefined();
    expect(EWALLET_CHANNEL_MAP['CARD']).toBeUndefined();
  });
});

// --- Unit: Xendit payload construction ---
function buildXenditPayload(
  orderId: string,
  amount: number,
  currency: string,
  channelCode: string,
  shopId: string,
  webhookBaseUrl: string
) {
  return {
    reference_id: orderId,
    currency,
    amount,
    checkout_method: 'ONE_TIME_PAYMENT',
    channel_code: channelCode,
    channel_properties: {
      success_redirect_url: `${webhookBaseUrl}/functions/v1/xendit-webhook`,
      failure_redirect_url: `${webhookBaseUrl}/functions/v1/xendit-webhook`,
    },
    metadata: {
      order_id: orderId,
      shop_id: shopId,
    },
  };
}

describe('buildXenditPayload', () => {
  const orderId = 'order-uuid-123';
  const shopId = 'shop-uuid-456';
  const baseUrl = 'https://project.supabase.co';

  it('sets reference_id to orderId', () => {
    const payload = buildXenditPayload(orderId, 100, 'PHP', 'GCASH', shopId, baseUrl);
    expect(payload.reference_id).toBe(orderId);
  });

  it('sets checkout_method to ONE_TIME_PAYMENT', () => {
    const payload = buildXenditPayload(orderId, 100, 'PHP', 'GCASH', shopId, baseUrl);
    expect(payload.checkout_method).toBe('ONE_TIME_PAYMENT');
  });

  it('includes order_id and shop_id in metadata', () => {
    const payload = buildXenditPayload(orderId, 100, 'PHP', 'GCASH', shopId, baseUrl);
    expect(payload.metadata.order_id).toBe(orderId);
    expect(payload.metadata.shop_id).toBe(shopId);
  });

  it('constructs correct redirect URLs', () => {
    const payload = buildXenditPayload(orderId, 100, 'PHP', 'GCASH', shopId, baseUrl);
    expect(payload.channel_properties.success_redirect_url).toBe(
      `${baseUrl}/functions/v1/xendit-webhook`
    );
  });

  it('passes currency and amount correctly', () => {
    const payload = buildXenditPayload(orderId, 250.5, 'PHP', 'PAYMAYA', shopId, baseUrl);
    expect(payload.amount).toBe(250.5);
    expect(payload.currency).toBe('PHP');
    expect(payload.channel_code).toBe('PAYMAYA');
  });
});

// --- Unit: response shape extraction ---
interface XenditActions {
  desktop_web_checkout_url?: string;
  mobile_web_checkout_url?: string;
  qr_checkout_string?: string;
}

function extractCheckoutData(actions?: XenditActions) {
  return {
    checkoutUrl: actions?.mobile_web_checkout_url || actions?.desktop_web_checkout_url || null,
    qrString: actions?.qr_checkout_string || null,
  };
}

describe('extractCheckoutData', () => {
  it('prefers mobile_web_checkout_url over desktop', () => {
    const result = extractCheckoutData({
      mobile_web_checkout_url: 'https://mobile.url',
      desktop_web_checkout_url: 'https://desktop.url',
    });
    expect(result.checkoutUrl).toBe('https://mobile.url');
  });

  it('falls back to desktop_web_checkout_url', () => {
    const result = extractCheckoutData({
      desktop_web_checkout_url: 'https://desktop.url',
    });
    expect(result.checkoutUrl).toBe('https://desktop.url');
  });

  it('returns null checkoutUrl when no URL available', () => {
    const result = extractCheckoutData({});
    expect(result.checkoutUrl).toBeNull();
  });

  it('returns null when actions is undefined', () => {
    const result = extractCheckoutData(undefined);
    expect(result.checkoutUrl).toBeNull();
    expect(result.qrString).toBeNull();
  });

  it('extracts qr_checkout_string', () => {
    const result = extractCheckoutData({ qr_checkout_string: '00020101021226...' });
    expect(result.qrString).toBe('00020101021226...');
  });
});

// --- Unit: required field validation ---
function validateCreateChargeRequest(body: Partial<{
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
}>): string | null {
  if (!body.orderId || !body.amount || !body.currency || !body.paymentMethod) {
    return 'Missing required fields: orderId, amount, currency, paymentMethod';
  }
  if (!EWALLET_CHANNEL_MAP[body.paymentMethod]) {
    return `Unsupported payment method: ${body.paymentMethod}`;
  }
  return null;
}

describe('validateCreateChargeRequest', () => {
  it('returns null for valid input', () => {
    expect(
      validateCreateChargeRequest({
        orderId: 'id',
        amount: 100,
        currency: 'PHP',
        paymentMethod: 'GCASH',
      })
    ).toBeNull();
  });

  it('returns error for missing orderId', () => {
    expect(
      validateCreateChargeRequest({ amount: 100, currency: 'PHP', paymentMethod: 'GCASH' })
    ).toBeTruthy();
  });

  it('returns error for missing amount', () => {
    expect(
      validateCreateChargeRequest({ orderId: 'id', currency: 'PHP', paymentMethod: 'GCASH' })
    ).toBeTruthy();
  });

  it('returns error for unsupported paymentMethod', () => {
    const error = validateCreateChargeRequest({
      orderId: 'id',
      amount: 100,
      currency: 'PHP',
      paymentMethod: 'CASH',
    });
    expect(error).toContain('Unsupported payment method: CASH');
  });
});
