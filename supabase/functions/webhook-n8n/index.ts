import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    console.log('Processing n8n webhook data...')

    if (req.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const webhookData = await req.json()
    console.log('Received webhook data:', webhookData)

    const { analysisId, metadata, totales } = webhookData

    if (!analysisId) {
      return new Response('Analysis ID is required', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    const { error: analysisUpdateError } = await supabase
      .from('analysis')
      .update({ status: 'completed' })
      .eq('id', analysisId)

    if (analysisUpdateError) {
      console.error('Error updating analysis status:', analysisUpdateError)
      return new Response('Failed to update analysis status', { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    if (metadata) {
      const vehicleData = {
        analysis_id: analysisId,
        license_plate: metadata.matricula || metadata.license_plate,
        vin: metadata.bastidor || metadata.vin,
        manufacturer: metadata.marca || metadata.manufacturer,
        model: metadata.modelo || metadata.model,
        internal_reference: metadata.referencia_interna || metadata.internal_reference,
        system: metadata.sistema || metadata.system,
        hourly_price: metadata.precio_hora ? parseFloat(metadata.precio_hora) : null
      }

      const { error: vehicleError } = await supabase
        .from('vehicle_data')
        .insert(vehicleData)

      if (vehicleError) {
        console.error('Error inserting vehicle data:', vehicleError)
        return new Response('Failed to insert vehicle data', { 
          status: 500, 
          headers: corsHeaders 
        })
      }
    }

    if (totales) {
      // Solo actualizar los campos que vienen de n8n, preservando los calculados
      const updateData = {
        total_spare_parts_eur: totales.total_repuestos ? parseFloat(totales.total_repuestos) : null,
        bodywork_labor_ut: totales.mo_carroceria_ut ? parseFloat(totales.mo_carroceria_ut) : null,
        bodywork_labor_eur: totales.mo_carroceria_eur ? parseFloat(totales.mo_carroceria_eur) : null,
        painting_labor_ut: totales.mo_pintura_ut ? parseFloat(totales.mo_pintura_ut) : null,
        painting_labor_eur: totales.mo_pintura_eur ? parseFloat(totales.mo_pintura_eur) : null,
        paint_material_eur: totales.material_pintura ? parseFloat(totales.material_pintura) : null,
        // NO incluimos net_subtotal, iva_amount, total_with_iva para preservar los valores calculados
      }

      console.log('Updating insurance_amounts with data from n8n:', updateData)

      const { error: insuranceError } = await supabase
        .from('insurance_amounts')
        .update(updateData)
        .eq('analysis_id', analysisId)

      if (insuranceError) {
        console.error('Error updating insurance amounts:', insuranceError)
        return new Response('Failed to update insurance amounts', { 
          status: 500, 
          headers: corsHeaders 
        })
      }
    }

    console.log('Successfully processed webhook data for analysis:', analysisId)

    return new Response(JSON.stringify({
      success: true,
      message: 'Data processed successfully',
      analysisId
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
    })

  } catch (error) {
    console.error('Error in webhook-n8n function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }
})