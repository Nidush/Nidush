import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-sync-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const token = String(req.headers.get('x-device-sync-token') ?? '').trim()

    if (!token) throw new Error('Missing device sync token.')

    const payload = await req.json()
    const requestId = Number(payload?.requestId)
    const success = Boolean(payload?.success)
    const result = payload?.result ?? {}
    const errorMessage = payload?.errorMessage ? String(payload.errorMessage) : null

    if (!requestId) throw new Error('Missing request id.')

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: home, error: homeError } = await supabase
      .from('homes')
      .select('id')
      .eq('device_sync_token', token)
      .maybeSingle()

    if (homeError || !home) throw new Error('Invalid device sync token.')

    const { error: updateError } = await supabase
      .from('device_discovery_requests')
      .update({
        status: success ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
        result,
        error_message: errorMessage,
      })
      .eq('id', requestId)
      .eq('home_id', home.id)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ completed: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
