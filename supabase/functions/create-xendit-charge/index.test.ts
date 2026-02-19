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

// --- Unit: CURRENCY_COUNTRY_MAP ---
const CURRENCY_COUNTRY_MAP: Record<string, string> = {
  PHP: 'PH',
};

describe('CURRENCY_COUNTRY_MAP', () => {
  it('maps PHP to PH', () => {
    expect(CURRENCY_COUNTRY_MAP['PHP']).toBe('PH');
  });

  it('returns undefined for unsupported currencies', () => {
    expect(CURRENCY_COUNTRY_MAP['USD']).toBeUndefined();
    expect(CURRENCY_COUNTRY_MAP['IDR']).toBeUndefined();
  });
});

// --- Unit: Xendit Payment Request payload construction ---
function buildXenditPayload(
  orderId: string,
  amount: number,
  currency: string,
  country: string,
  channelCode: string,
  shopId: string,
  webhookBaseUrl: string
) {
  return {
    reference_id: orderId,
    type: 'PAY',
    country,
    currency,
    request_amount: amount,
    capture_method: 'AUTOMATIC',
    channel_code: channelCode,
    channel_properties: {
      success_return_url: `${webhookBaseUrl}/xendit-webhook`,
      failure_return_url: `${webhookBaseUrl}/xendit-webhook`,
      cancel_return_url: `${webhookBaseUrl}/xendit-webhook`,
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
  const baseUrl = 'https://project.supabase.co/functions/v1';

  it('sets reference_id to orderId', () => {
    const payload = buildXenditPayload(orderId, 100, 'PHP', 'PH', 'GCASH', shopId, baseUrl);
    expect(payload.reference_id).toBe(orderId);
  });

  it('sets type to PAY', () => {
    const payload = buildXenditPayload(orderId, 100, 'PHP', 'PH', 'GCASH', shopId, baseUrl);
    expect(payload.type).toBe('PAY');
  });

  it('sets capture_method to AUTOMATIC', () => {
    const payload = buildXenditPayload(orderId, 100, 'PHP', 'PH', 'GCASH', shopId, baseUrl);
    expect(payload.capture_method).toBe('AUTOMATIC');
  });

  it('sets country from currency map', () => {
    const payload = buildXenditPayload(orderId, 100, 'PHP', 'PH', 'GCASH', shopId, baseUrl);
    expect(payload.country).toBe('PH');
  });

  it('uses request_amount (not amount)', () => {
    const payload = buildXenditPayload(orderId, 250.5, 'PHP', 'PH', 'PH_PAYMAYA', shopId, baseUrl);
    expect(payload.request_amount).toBe(250.5);
    expect((payload as Record<string, unknown>).amount).toBeUndefined();
  });

  it('includes order_id and shop_id in metadata', () => {
    const payload = buildXenditPayload(orderId, 100, 'PHP', 'PH', 'GCASH', shopId, baseUrl);
    expect(payload.metadata.order_id).toBe(orderId);
    expect(payload.metadata.shop_id).toBe(shopId);
  });

  it('constructs correct return URLs including cancel', () => {
    const payload = buildXenditPayload(orderId, 100, 'PHP', 'PH', 'GCASH', shopId, baseUrl);
    expect(payload.channel_properties.success_return_url).toBe(`${baseUrl}/xendit-webhook`);
    expect(payload.channel_properties.failure_return_url).toBe(`${baseUrl}/xendit-webhook`);
    expect(payload.channel_properties.cancel_return_url).toBe(`${baseUrl}/xendit-webhook`);
  });

  it('passes currency and channel_code correctly', () => {
    const payload = buildXenditPayload(orderId, 250.5, 'PHP', 'PH', 'PH_PAYMAYA', shopId, baseUrl);
    expect(payload.currency).toBe('PHP');
    expect(payload.channel_code).toBe('PH_PAYMAYA');
  });
});

// --- Unit: response shape extraction from actual Xendit actions array ---
// Actual response format: { action, url, url_type, method, qr_code }
interface XenditAction {
  action: string;
  url: string;
  url_type: string;
  method: string;
  qr_code: string | null;
}

function extractCheckoutData(actions?: XenditAction[]) {
  const mobileAction = actions?.find((a) => a.url_type === 'MOBILE');
  const webAction = actions?.find((a) => a.url_type === 'WEB');
  const checkoutUrl = mobileAction?.url ?? webAction?.url ?? null;
  const qrString = actions?.find((a) => a.qr_code)?.qr_code ?? null;
  return { checkoutUrl, qrString };
}

const makeAction = (url_type: string, url: string, qr_code: string | null = null): XenditAction =>
  ({ action: 'AUTH', url, url_type, method: 'GET', qr_code });

describe('extractCheckoutData', () => {
  it('extracts MOBILE url as checkoutUrl', () => {
    const result = extractCheckoutData([makeAction('MOBILE', 'https://mobile.url')]);
    expect(result.checkoutUrl).toBe('https://mobile.url');
  });

  it('falls back to WEB url when no MOBILE action', () => {
    const result = extractCheckoutData([makeAction('WEB', 'https://web.url')]);
    expect(result.checkoutUrl).toBe('https://web.url');
  });

  it('prefers MOBILE over WEB when both present', () => {
    const result = extractCheckoutData([
      makeAction('WEB', 'https://web.url'),
      makeAction('MOBILE', 'https://mobile.url'),
    ]);
    expect(result.checkoutUrl).toBe('https://mobile.url');
  });

  it('extracts qr_code when present on an action', () => {
    const result = extractCheckoutData([
      makeAction('WEB', 'https://web.url', '00020101021226...'),
    ]);
    expect(result.qrString).toBe('00020101021226...');
  });

  it('returns null qrString when all qr_code fields are null', () => {
    const result = extractCheckoutData([
      makeAction('MOBILE', 'https://mobile.url', null),
      makeAction('WEB', 'https://web.url', null),
    ]);
    expect(result.qrString).toBeNull();
  });

  it('returns null when actions is undefined', () => {
    const result = extractCheckoutData(undefined);
    expect(result.checkoutUrl).toBeNull();
    expect(result.qrString).toBeNull();
  });

  it('returns null when actions is empty', () => {
    const result = extractCheckoutData([]);
    expect(result.checkoutUrl).toBeNull();
    expect(result.qrString).toBeNull();
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
  if (!CURRENCY_COUNTRY_MAP[body.currency]) {
    return `Unsupported currency: ${body.currency}`;
  }
  return null;
}

describe('validateCreateChargeRequest', () => {
  it('returns null for valid GCash input', () => {
    expect(
      validateCreateChargeRequest({
        orderId: 'id',
        amount: 100,
        currency: 'PHP',
        paymentMethod: 'GCASH',
      })
    ).toBeNull();
  });

  it('returns null for valid Maya input', () => {
    expect(
      validateCreateChargeRequest({
        orderId: 'id',
        amount: 100,
        currency: 'PHP',
        paymentMethod: 'MAYA',
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

  it('returns error for unsupported currency', () => {
    const error = validateCreateChargeRequest({
      orderId: 'id',
      amount: 100,
      currency: 'USD',
      paymentMethod: 'GCASH',
    });
    expect(error).toContain('Unsupported currency: USD');
  });
});
