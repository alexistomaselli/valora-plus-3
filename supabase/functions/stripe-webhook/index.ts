// @ts-nocheck
// Edge Function for Stripe webhooks - runs in Deno environment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe((Deno as any).env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
})

serve(async (req: any) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const signature = req.headers.get('stripe-signature')
  const webhookSecret = (Deno as any).env.get('STRIPE_WEBHOOK_SECRET')

  console.log('🔍 Webhook request received:', {
    method: req.method,
    hasSignature: !!signature,
    hasSecret: !!webhookSecret,
    contentType: req.headers.get('content-type')
  })

  if (!signature) {
    console.error('❌ Missing Stripe signature header')
    return new Response('Missing Stripe signature', { status: 400 })
  }

  if (!webhookSecret) {
    console.error('❌ Missing webhook secret environment variable')
    return new Response('Webhook not configured', { status: 500 })
  }

  let body: string
  try {
    body = await req.text()
    console.log('📥 Request body length:', body.length)
  } catch (error) {
    console.error('❌ Error reading request body:', error)
    return new Response('Invalid request body', { status: 400 })
  }

  let event: Stripe.Event
  try {
    // Verify webhook signature
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
    console.log('✅ Webhook signature verified successfully')
  } catch (error) {
    console.error('❌ Webhook signature verification failed:', error)
    return new Response('Invalid signature', { status: 400 })
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseClient = createClient(
      (Deno as any).env.get('SUPABASE_URL') ?? '',
      (Deno as any).env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('📨 Processing webhook event:', event.type)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        console.log('🎯 Processing checkout.session.completed:', {
          payment_intent: session.payment_intent,
          session_id: session.id,
          customer: session.customer,
          metadata: session.metadata
        })
        
        // Validate required fields
        if (!session.payment_intent) {
          console.error('❌ Missing payment_intent in session:', session.id)
          throw new Error('Missing payment_intent in checkout session')
        }
        
        // Try to get customer ID - it might be a string ID or null
        let customerId: string | null = null
        
        if (session.customer) {
          // If customer is a string, it's the customer ID
          if (typeof session.customer === 'string') {
            customerId = session.customer
            console.log('✅ Customer ID found in session:', customerId)
          } else {
            // If it's an object, get the ID from it
            customerId = (session.customer as any).id
            console.log('✅ Customer ID extracted from object:', customerId)
          }
        } else {
          console.log('⚠️ No customer ID in session - this might be a guest checkout')
          
          // Try to retrieve the session with expanded customer data
          try {
            const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
              expand: ['customer']
            })
            
            if (expandedSession.customer) {
              if (typeof expandedSession.customer === 'string') {
                customerId = expandedSession.customer
              } else {
                customerId = (expandedSession.customer as any).id
              }
              console.log('✅ Customer ID retrieved from expanded session:', customerId)
            }
          } catch (expandError) {
            console.error('❌ Error expanding session customer:', expandError)
          }
        }
        
        // Update payment status to succeeded using the new function
        const updateParams: any = {
          stripe_payment_intent_id_param: session.payment_intent as string,
          new_status: 'succeeded',
          payment_method_param: session.payment_method_types?.[0] || 'card',
          stripe_session_id_param: session.id
        }
        
        // Only add customer ID if it exists
        if (customerId) {
          updateParams.stripe_customer_id_param = customerId
          console.log('✅ Adding customer ID to params:', customerId)
        } else {
          console.log('⚠️ Final customer ID is still null - proceeding without it')
        }
        
        console.log('📤 Calling update_payment_status with params:', updateParams)
        
        const { data: updateResult, error: updateError } = await supabaseClient
          .rpc('update_payment_status', updateParams)

        if (updateError) {
          console.error('❌ Error updating payment status:', updateError)
          console.error('📋 Update params were:', updateParams)
          console.error('🔍 Error details:', {
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint,
            code: updateError.code
          })
          throw updateError
        }

        console.log('✅ Payment completed successfully:', session.payment_intent, 'Session ID:', session.id, 'Customer ID:', session.customer)
        console.log('📊 Update result:', updateResult)
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
        
        console.log('Processing charge.succeeded:', {
          payment_intent: charge.payment_intent,
          customer: charge.customer,
          charge_id: charge.id
        })
        
        // Update payment status to succeeded using the new function
        const updateParams: any = {
          stripe_payment_intent_id_param: charge.payment_intent as string,
          new_status: 'succeeded',
          payment_method_param: charge.payment_method_details?.type || 'card'
        }
        
        // Only add customer ID if it exists
        if (charge.customer) {
          updateParams.stripe_customer_id_param = charge.customer as string
        }
        
        const { error: updateError } = await supabaseClient
          .rpc('update_payment_status', updateParams)

        if (updateError) {
          console.error('Error updating payment status:', updateError)
          console.error('Customer ID:', charge.customer)
          throw updateError
        }

        console.log('Charge succeeded:', charge.payment_intent, 'Customer ID:', charge.customer)
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
    console.error('❌ Webhook processing error:', error)
    
    // Return detailed error information for debugging
    const errorDetails = {
      error: 'Webhook handler failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : String(error),
      timestamp: new Date().toISOString(),
      event_type: event?.type || 'unknown'
    }
    
    console.error('🔍 Error details being returned:', errorDetails)
    
    return new Response(
      JSON.stringify(errorDetails),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500, // Changed from 400 to 500 for processing errors
      }
    )
  }
})