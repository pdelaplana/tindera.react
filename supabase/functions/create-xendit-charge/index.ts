// Edge Function: create-xendit-charge
// Creates a Xendit e-wallet payment request (GCash or Maya) for a given order.
// Uses Xendit Payment Request API: POST /payment_requests

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const XENDIT_API_URL = 'https://api.xendit.co/payment_requests';

// Map our internal codes to Xendit's Payment Request API channel codes
// GCash uses PH_GCASH (country-prefixed); Maya uses PAYMAYA (no prefix) in the nested payment_method structure
const EWALLET_CHANNEL_MAP: Record<string, string> = {
  GCASH: 'PH_GCASH',
  MAYA: 'PAYMAYA',
};

// ISO 3166-1 alpha-2 country code inferred from currency
const CURRENCY_COUNTRY_MAP: Record<string, string> = {
  PHP: 'PH',
};

interface CreateChargeRequest {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: 'GCASH' | 'MAYA';
}

interface XenditPaymentAction {
  action: string;
  url: string;
  url_type: string; // 'WEB' | 'MOBILE' | 'DEEPLINK' | 'SDK'
  method: string;
  qr_code: string | null;
}

interface XenditPaymentResponse {
  id: string;
  status: string;
  actions?: XenditPaymentAction[];
  failure_code?: string;
  metadata?: Record<string, unknown>;
}

function errorResponse(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Missing Authorization header', 401);
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    // Parse request body
    const body: CreateChargeRequest = await req.json();
    const { orderId, amount, currency, paymentMethod } = body;

    if (!orderId || !amount || !currency || !paymentMethod) {
      return errorResponse('Missing required fields: orderId, amount, currency, paymentMethod');
    }

    const channelCode = EWALLET_CHANNEL_MAP[paymentMethod];
    if (!channelCode) {
      return errorResponse(`Unsupported payment method: ${paymentMethod}`);
    }

    const country = CURRENCY_COUNTRY_MAP[currency];
    if (!country) {
      return errorResponse(`Unsupported currency: ${currency}`);
    }

    // Validate order exists
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, shop_id, total_sale')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return errorResponse('Order not found', 404);
    }

    // Retrieve Xendit secret key
    const xenditSecretKey = Deno.env.get('XENDIT_SECRET_KEY');
    if (!xenditSecretKey) {
      return errorResponse('Payment provider not configured', 500);
    }

    // Expiration: 15 minutes from now
    const expirationTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const webhookBaseUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1`;

    // Xendit Payment Request API payload (POST /payment_requests)
    const xenditPayload = {
      reference_id: orderId,
      amount,
      currency,
      country,
      payment_method: {
        type: 'EWALLET',
        reusability: 'ONE_TIME_USE',
        ewallet: {
          channel_code: channelCode,
          channel_properties: {
            success_return_url: `${webhookBaseUrl}/xendit-webhook`,
            failure_return_url: `${webhookBaseUrl}/xendit-webhook`,
            cancel_return_url: `${webhookBaseUrl}/xendit-webhook`,
          },
        },
      },
      metadata: {
        order_id: orderId,
        shop_id: order.shop_id,
      },
    };

    const xenditResponse = await fetch(XENDIT_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${xenditSecretKey}:`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(xenditPayload),
    });

    if (!xenditResponse.ok) {
      const xenditError = await xenditResponse.json().catch(() => ({})) as Record<string, unknown>;
      const message = (xenditError?.message as string) || 'Failed to create payment request';
      const errors = xenditError?.errors;
      const detail = Array.isArray(errors) && errors.length > 0
        ? ` (${errors.map((e: Record<string, string>) => `${e.path ?? e.field ?? '?'}: ${e.message}`).join(', ')})`
        : '';
      console.error('Xendit error:', JSON.stringify(xenditError));
      return errorResponse(`Payment provider error: ${message}${detail}`, 502);
    }

    const payment: XenditPaymentResponse = await xenditResponse.json();
    console.log('Xendit payment response:', JSON.stringify({ id: payment.id, status: payment.status, actions: payment.actions }));

    // Extract checkout URL: prefer MOBILE, fall back to WEB
    const mobileAction = payment.actions?.find((a) => a.url_type === 'MOBILE');
    const webAction = payment.actions?.find((a) => a.url_type === 'WEB');
    const checkoutUrl = mobileAction?.url ?? webAction?.url ?? null;

    // Extract QR code string if any action provides one
    const qrString = payment.actions?.find((a) => a.qr_code)?.qr_code ?? null;

    return new Response(
      JSON.stringify({
        chargeId: payment.id,
        checkoutUrl,
        qrString,
        expirationTime,
        status: payment.status,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return errorResponse(message, 500);
  }
});
