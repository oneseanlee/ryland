import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { shopify_order_id, customer_email } = await req.json()

    if (!shopify_order_id) {
      return new Response(
        JSON.stringify({ error: 'shopify_order_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Fetch order including the email on file for identity verification
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        shopify_order_number,
        customer_name,
        email,
        created_at,
        order_items (
          id,
          product_title,
          download_token,
          downloaded_at
        )
      `)
      .eq('shopify_order_id', String(shopify_order_id))
      .maybeSingle()

    if (error) {
      console.error('Fetch order error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!data) {
      return new Response(
        JSON.stringify({ found: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Security: only return download tokens when the caller proves ownership
    // by supplying the correct customer email. Without this, anyone who knows
    // a Shopify order ID can download paid ebooks for free.
    const emailVerified =
      typeof customer_email === 'string' &&
      customer_email.trim().length > 0 &&
      data.email.toLowerCase().trim() === customer_email.toLowerCase().trim()

    const safeItems = (data.order_items ?? []).map((item: {
      id: string; product_title: string; download_token: string; downloaded_at: string | null
    }) => ({
      id:            item.id,
      product_title: item.product_title,
      downloaded_at: item.downloaded_at,
      // Only expose token after email ownership is confirmed
      ...(emailVerified ? { download_token: item.download_token } : {}),
    }))

    return new Response(
      JSON.stringify({
        found: true,
        email_verified: emailVerified,
        order: {
          id:                   data.id,
          shopify_order_number: data.shopify_order_number,
          customer_name:        data.customer_name,
          created_at:           data.created_at,
          order_items:          safeItems,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
