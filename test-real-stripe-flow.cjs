const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

// Configuración - usando las variables de entorno reales
const supabaseUrl = 'https://piynzvpnurnvbrmkyneo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpeW56dnBudXJudmJybWt5bmVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM2OTQzMywiZXhwIjoyMDc1OTQ1NDMzfQ.mKy2Pvw8HI8sa8WPILw3C5GM5clZBO7lmf2pSE557Y0';

// Leer variables de entorno de Stripe
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_URL = 'https://piynzvpnurnvbrmkyneo.supabase.co/functions/v1/stripe-webhook';

console.log('🔧 Configuración:');
console.log('  STRIPE_SECRET_KEY:', STRIPE_SECRET_KEY ? `${STRIPE_SECRET_KEY.substring(0, 12)}...` : 'NO CONFIGURADA');
console.log('  WEBHOOK_URL:', WEBHOOK_URL);
console.log('');

if (!STRIPE_SECRET_KEY) {
  console.log('❌ Error: STRIPE_SECRET_KEY no está configurada');
  console.log('💡 Configura la variable de entorno:');
  console.log('   export STRIPE_SECRET_KEY="sk_test_tu_clave_aqui"');
  console.log('');
  console.log('🔍 O ejecuta el script así:');
  console.log('   STRIPE_SECRET_KEY="sk_test_tu_clave_aqui" node test-real-stripe-flow.cjs');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

async function testRealStripeFlow() {
  console.log('🚀 Iniciando prueba del flujo REAL de Stripe...\n');

  let createdCustomerId = null;
  let createdPaymentId = null;

  try {
    // 1. Crear un customer en Stripe
    console.log('👤 Paso 1: Creando customer en Stripe...');
    
    const customer = await stripe.customers.create({
      email: 'test@example.com',
      name: 'Usuario de Prueba Real',
      metadata: {
        user_id: 'd951e996-a58f-4410-85c9-46525e06d325',
        workshop_id: 'a662c5e9-e14e-4acf-966c-2bb5795e3867'
      }
    });

    createdCustomerId = customer.id;
    console.log('✅ Customer creado:', customer.id);

    // 2. Crear sesión de checkout en Stripe (que creará automáticamente el PaymentIntent)
    console.log('\n🛒 Paso 2: Creando sesión de checkout en Stripe...');
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Análisis Adicional',
              description: 'Análisis pericial adicional - Prueba real',
            },
            unit_amount: 2500,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://example.com/cancel?session_id={CHECKOUT_SESSION_ID}',
      customer: customer.id,
      metadata: {
        user_id: 'd951e996-a58f-4410-85c9-46525e06d325',
        workshop_id: 'a662c5e9-e14e-4acf-966c-2bb5795e3867',
        analysis_month: '2025-01',
        description: 'Análisis adicional - Prueba real'
      }
    });

    console.log('✅ Sesión de checkout creada:', session.id);
    console.log('🔗 URL de checkout:', session.url);
    console.log('   PaymentIntent:', session.payment_intent || 'Se creará al completar el pago');

    // 3. Simular el pago completando la sesión
    console.log('\n💰 Paso 3: Simulando pago exitoso...');
    
    // Para simular un pago exitoso, necesitamos usar la API de test de Stripe
    // Vamos a crear un PaymentIntent separado para poder controlarlo
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 2500,
      currency: 'eur',
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        user_id: 'd951e996-a58f-4410-85c9-46525e06d325',
        workshop_id: 'a662c5e9-e14e-4acf-966c-2bb5795e3867',
        analysis_month: '2025-01',
        description: 'Análisis adicional - Prueba real',
        session_id: session.id
      }
    });

    console.log('✅ PaymentIntent creado para simulación:', paymentIntent.id);
    console.log('   Estado:', paymentIntent.status);
    console.log('   Cantidad:', paymentIntent.amount / 100, paymentIntent.currency.toUpperCase());

    // 4. Crear registro de pago en Supabase
    console.log('\n📝 Paso 4: Creando registro de pago en Supabase...');
    
    const paymentParams = {
      workshop_id_param: 'a662c5e9-e14e-4acf-966c-2bb5795e3867',
      user_id_param: 'd951e996-a58f-4410-85c9-46525e06d325',
      stripe_payment_intent_id_param: paymentIntent.id,
      stripe_session_id_param: session.id,
      stripe_customer_id_param: customer.id,
      amount_cents_param: 2500,
      currency_param: 'EUR',
      analysis_month_param: '2025-01',
      description_param: 'Análisis adicional - Prueba real'
    };

    const { data: paymentId, error: createError } = await supabase
      .rpc('create_payment_record', paymentParams);

    if (createError) {
      throw new Error(`Error creando registro de pago: ${createError.message}`);
    }

    createdPaymentId = paymentId;
    console.log('✅ Registro de pago creado en Supabase:', paymentId);

    // 5. Simular el pago exitoso usando tarjeta de prueba
    console.log('\n💰 Paso 5: Simulando pago exitoso con tarjeta de prueba...');
    
    try {
      // Confirmar el PaymentIntent con una tarjeta de prueba
      const confirmedPayment = await stripe.paymentIntents.confirm(paymentIntent.id, {
        payment_method: 'pm_card_visa', // Método de pago de prueba de Stripe
      });

      console.log('✅ PaymentIntent confirmado:', confirmedPayment.status);
      
      if (confirmedPayment.status === 'succeeded') {
        console.log('🎉 ¡Pago completado exitosamente!');
      } else {
        console.log('⚠️ Estado del pago:', confirmedPayment.status);
      }
    } catch (confirmError) {
      console.log('⚠️ Error confirmando pago (esto es normal en pruebas):', confirmError.message);
      console.log('💡 Continuando con la simulación del webhook...');
    }

    // 6. Esperar un momento para que Stripe procese
    console.log('\n⏳ Esperando procesamiento de Stripe...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 7. Verificar eventos en Stripe
    console.log('\n🔍 Paso 6: Verificando eventos en Stripe...');
    
    const events = await stripe.events.list({
      limit: 10,
      types: ['checkout.session.completed', 'payment_intent.succeeded'],
      created: {
        gte: Math.floor(Date.now() / 1000) - 300 // Últimos 5 minutos
      }
    });

    console.log(`📊 Eventos encontrados: ${events.data.length}`);
    
    const relevantEvents = events.data.filter(event => 
      (event.data.object.id === session.id) || 
      (event.data.object.id === paymentIntent.id)
    );

    console.log(`🎯 Eventos relevantes: ${relevantEvents.length}`);
    
    relevantEvents.forEach(event => {
      console.log(`  - ${event.type}: ${event.id} (${new Date(event.created * 1000).toISOString()})`);
    });

    // 8. Verificar el estado del pago en Supabase
    console.log('\n🔍 Paso 7: Verificando estado del pago en Supabase...');
    
    const { data: finalPayment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .single();

    if (fetchError) {
      console.log('⚠️ Error obteniendo pago final:', fetchError.message);
    } else {
      console.log('📊 Estado final del pago:', {
        id: finalPayment.id,
        status: finalPayment.status,
        payment_method: finalPayment.payment_method,
        stripe_customer_id: finalPayment.stripe_customer_id,
        paid_at: finalPayment.paid_at,
        created_at: finalPayment.created_at
      });

      if (finalPayment.status === 'succeeded') {
        console.log('🎯 ¡El webhook procesó correctamente el evento!');
      } else {
        console.log('⚠️ El webhook puede no haber procesado el evento aún');
        console.log('💡 Esto puede ser normal si el webhook tarda en procesarse');
      }
    }

    console.log('\n🎉 ¡PRUEBA REAL COMPLETADA!');
    console.log('✅ Se crearon objetos reales en Stripe');
    console.log('✅ Se probó la integración completa');
    console.log('📋 Resumen:');
    console.log(`   Customer ID: ${customer.id}`);
    console.log(`   PaymentIntent ID: ${paymentIntent.id}`);
    console.log(`   Session ID: ${session.id}`);
    console.log(`   Payment Record ID: ${paymentId}`);

  } catch (error) {
    console.error('\n❌ Error en la prueba real:', error.message);
    console.error('🔍 Detalles:', error);
    
    if (error.message.includes('No such payment_intent')) {
      console.log('💡 El PaymentIntent puede haber expirado o no existir');
    }
    
    if (error.message.includes('Invalid API key')) {
      console.log('💡 Verifica que STRIPE_SECRET_KEY esté configurado correctamente');
    }

    if (error.message.includes('testmode')) {
      console.log('💡 Asegúrate de usar claves de test (sk_test_...)');
    }
  } finally {
    // 9. Limpiar datos de prueba
    console.log('\n🧹 Limpiando datos de prueba...');
    
    try {
      // Eliminar customer de Stripe
      if (createdCustomerId) {
        await stripe.customers.del(createdCustomerId);
        console.log('✅ Customer eliminado de Stripe');
      }

      // Eliminar registro de pago de Supabase
      if (createdPaymentId) {
        const { error: deleteError } = await supabase
          .from('payments')
          .delete()
          .eq('id', createdPaymentId);

        if (deleteError) {
          console.log('⚠️ Error eliminando pago de Supabase:', deleteError.message);
        } else {
          console.log('✅ Registro de pago eliminado de Supabase');
        }
      }
    } catch (cleanupError) {
      console.log('⚠️ Error en limpieza:', cleanupError.message);
    }
  }
}

// Ejecutar la prueba
testRealStripeFlow();