// @ts-nocheck
// Edge Function for Stripe webhooks - runs in Deno environment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe((Deno as any).env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
})

serve(async (req: any) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()
  const webhookSecret = (Deno as any).env.get('STRIPE_WEBHOOK_SECRET')

  if (!signature || !webhookSecret) {
    return new Response('Missing signature or webhook secret', { status: 400 })
  }

  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    // Create Supabase client with service role key for admin operations
    const supabaseClient = createClient(
      (Deno as any).env.get('SUPABASE_URL') ?? '',
      (Deno as any).env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Received webhook event:', event.type)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Update payment status to succeeded using the new function
        const { error: updateError } = await supabaseClient
          .rpc('update_payment_status', {
            stripe_payment_intent_id_param: session.payment_intent as string,
            new_status: 'succeeded',
            payment_method_param: session.payment_method_types?.[0] || 'card',
            stripe_session_id_param: session.id
          })

        if (updateError) {
          console.error('Error updating payment status:', updateError)
          throw updateError
        }

        console.log('Payment completed successfully:', session.payment_intent, 'Session ID:', session.id)
        break
      }

      case 'checkout.session.expired':
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Update payment status to failed/expired using the new function
        const { error: updateError } = await supabaseClient
          .rpc('update_payment_status', {
            stripe_payment_intent_id_param: paymentIntent.id,
            new_status: event.type === 'checkout.session.expired' ? 'canceled' : 'failed'
          })

        if (updateError) {
          console.error('Error updating payment status:', updateError)
          throw updateError
        }

        console.log('Payment failed/expired:', paymentIntent.id)
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Update payment status to succeeded using the new function
        const { error: updateError } = await supabaseClient
          .rpc('update_payment_status', {
            stripe_payment_intent_id_param: paymentIntent.id,
            new_status: 'succeeded'
          })

        if (updateError) {
          console.error('Error updating payment status:', updateError)
          throw updateError
        }

        console.log('Payment intent succeeded:', paymentIntent.id)
        break
      }

      case 'charge.succeeded': {
        const charge = event.data.object as Stripe.Charge
        
        // Update payment status to succeeded using the new function
        const { error: updateError } = await supabaseClient
          .rpc('update_payment_status', {
            stripe_payment_intent_id_param: charge.payment_intent as string,
            new_status: 'succeeded',
            payment_method_param: charge.payment_method_details?.type || 'card'
          })

        if (updateError) {
          console.error('Error updating payment status:', updateError)
          throw updateError
        }

        console.log('Charge succeeded:', charge.payment_intent)
        break
      }

      default:
        console.log('Unhandled event type:', event.type)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: 'Webhook handler failed' }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})