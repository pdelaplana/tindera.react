// Edge Function: create-xendit-charge
// Creates a Xendit e-wallet charge (GCash or Maya) for a given order.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const XENDIT_API_URL = 'https://api.xendit.co/ewallets/charges';

// Map our internal codes to Xendit's channel codes
const EWALLET_CHANNEL_MAP: Record<string, string> = {
  GCASH: 'GCASH',
  MAYA: 'PAYMAYA',
};

interface CreateChargeRequest {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: 'GCASH' | 'MAYA';
}

interface XenditEwalletCharge {
  id: string;
  status: string;
  channel_code: string;
  checkout_method: string;
  actions?: {
    desktop_web_checkout_url?: string;
    mobile_web_checkout_url?: string;
    mobile_deeplink_checkout_url?: string;
    qr_checkout_string?: string;
  };
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

    // Validate order exists and belongs to a shop the user can access
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

    // Call Xendit e-wallets charges API
    const xenditPayload = {
      reference_id: orderId,
      currency,
      amount,
      checkout_method: 'ONE_TIME_PAYMENT',
      channel_code: channelCode,
      channel_properties: {
        success_redirect_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/xendit-webhook`,
        failure_redirect_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/xendit-webhook`,
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
      const xenditError = await xenditResponse.json().catch(() => ({}));
      const message = (xenditError as Record<string, string>)?.message || 'Failed to create charge';
      return errorResponse(`Payment provider error: ${message}`, 502);
    }

    const charge: XenditEwalletCharge = await xenditResponse.json();

    return new Response(
      JSON.stringify({
        chargeId: charge.id,
        checkoutUrl:
          charge.actions?.mobile_web_checkout_url ||
          charge.actions?.desktop_web_checkout_url ||
          null,
        qrString: charge.actions?.qr_checkout_string || null,
        expirationTime,
        status: charge.status,
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
