// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user from the request
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'No user found' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get request body
    const body = await req.json()
    const { amount, currency = 'eur', description = 'Payment' } = body

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Initialize Stripe
    const stripe = new (await import('https://esm.sh/stripe@14.21.0')).default(
      Deno.env.get('STRIPE_SECRET_KEY') ?? '',
      {
        apiVersion: '2023-10-16',
      }
    )

    // Get success and cancel URLs from system settings
    const { data: settings } = await supabaseClient
      .from('system_settings')
      .select('stripe_success_url, stripe_cancel_url')
      .single()

    const baseSuccessUrl = settings?.stripe_success_url || `${req.headers.get('origin')}/payment-success`
    const baseCancelUrl = settings?.stripe_cancel_url || `${req.headers.get('origin')}/payment-cancel`
    
    // Add session_id parameter to URLs so Stripe can send it back
    const successUrl = `${baseSuccessUrl}?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseCancelUrl}?session_id={CHECKOUT_SESSION_ID}`

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: description,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        workshop_id: profile.workshop_id || '',
        description: description,
      },
    })

    // Store payment record
    const { error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        user_id: user.id,
        workshop_id: profile.workshop_id || '00000000-0000-0000-0000-000000000000', // Default UUID if no workshop
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent || session.id, // Use session.id as fallback
        amount_cents: Math.round(amount * 100), // Convert to cents
        currency: currency,
        status: 'pending',
        analysis_month: new Date().toISOString().slice(0, 7), // YYYY-MM format
        analyses_purchased: 1, // Default to 1 analysis
        unit_price_cents: Math.round(amount * 100), // Same as amount_cents for now
        description: description,
      })

    if (paymentError) {
      console.error('Error storing payment record:', paymentError)
      // Continue anyway, as the Stripe session was created successfully
    }

    return new Response(
      JSON.stringify({ 
        url: session.url,
        session_id: session.id 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in payment-session function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})