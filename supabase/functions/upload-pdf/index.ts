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

    const webhookUrl = 'https://bot-bitrix-n8n.uhcoic.easypanel.host/webhook/23154e6f-420b-4186-be36-8b7585da797a'

    const webhookFormData = new FormData()
    webhookFormData.append('file', file)

    console.log('Forwarding to n8n webhook...')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minutes timeout

    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        body: webhookFormData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      console.log(`Webhook responded with status: ${webhookResponse.status}`)

      if (!webhookResponse.ok) {
        console.error(`Webhook failed with status: ${webhookResponse.status}`)
        const errorText = await webhookResponse.text()
        console.error('Webhook error response:', errorText)
        return new Response(JSON.stringify({
          error: 'Webhook processing failed',
          status: webhookResponse.status,
          details: errorText
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        })
      }

      const contentType = webhookResponse.headers.get('content-type')
      let result

      if (contentType?.includes('application/json')) {
        result = await webhookResponse.json()
      } else {
        const text = await webhookResponse.text()
        result = { message: text }
      }

      console.log('Webhook response received:', result)
    } catch (fetchError) {
      clearTimeout(timeoutId)

      if (fetchError.name === 'AbortError') {
        console.error('Webhook request timed out after 2 minutes')
        return new Response(JSON.stringify({
          error: 'Webhook request timed out',
          message: 'The webhook took too long to respond'
        }), {
          status: 504,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        })
      }

      console.error('Fetch error:', fetchError)
      throw fetchError
    }

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