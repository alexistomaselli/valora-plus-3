// Definimos los headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Exportamos la función handler según la documentación de Supabase Edge Functions
export const handler = async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting PDF upload proxy...')
    
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      })
    }

    // Get the form data from the request
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return new Response('No file provided', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    console.log(`Processing file: ${file.name}, size: ${file.size}`)

    // Forward the request to the n8n webhook
    const webhookUrl = 'https://bot-bitrix-n8n.uhcoic.easypanel.host/webhook/23154e6f-420b-4186-be36-8b7585da797a'
    
    // Create new FormData for the webhook request
    const webhookFormData = new FormData()
    webhookFormData.append('file', file)
    
    console.log('Forwarding to n8n webhook...')
    
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      body: webhookFormData,
    })

    if (!webhookResponse.ok) {
      console.error(`Webhook failed with status: ${webhookResponse.status}`)
      return new Response('Webhook processing failed', { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    const result = await webhookResponse.json()
    console.log('Webhook response received:', result)

    return new Response(JSON.stringify(result), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    })

  } catch (error) {
    console.error('Error in upload-pdf function:', error)
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    })
  }
}