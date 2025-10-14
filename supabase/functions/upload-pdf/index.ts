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
    console.log('Starting PDF upload proxy...')

    if (req.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders
      })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return new Response('No file provided', {
        status: 400,
        headers: corsHeaders
      })
    }

    console.log(`Processing file: ${file.name}, size: ${file.size}`)

    const webhookUrl = 'https://n8n.necode.io/webhook/23154e6f-420b-4186-be36-8b7585da797a'

    const webhookFormData = new FormData()
    webhookFormData.append('file', file)

    console.log('Forwarding to n8n webhook...')

    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      body: webhookFormData,
    })

    if (!webhookResponse.ok) {
      console.error(`Webhook failed with status: ${webhookResponse.status}`)
      const errorText = await webhookResponse.text()
      console.error('Webhook error response:', errorText)
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }
})