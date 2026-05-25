import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-sync-token, x-device-sync-secret',
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
    const expectedSharedSecret = Deno.env.get('DEVICE_SYNC_SHARED_SECRET') ?? ''
    const token = String(req.headers.get('x-device-sync-token') ?? '').trim()
    const providedSharedSecret = String(req.headers.get('x-device-sync-secret') ?? '').trim()

    if (!token) throw new Error('Missing device sync token.')
    if (expectedSharedSecret && providedSharedSecret !== expectedSharedSecret) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: home, error: homeError } = await supabase
      .from('homes')
      .select('id')
      .eq('device_sync_token', token)
      .maybeSingle()

    if (homeError || !home) throw new Error('Invalid device sync token.')

    const { data: pendingRequest, error: pendingError } = await supabase
      .from('device_discovery_requests')
      .select('id, home_id, status, requested_at')
      .eq('home_id', home.id)
      .eq('status', 'pending')
      .order('requested_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (pendingError) throw pendingError

    if (!pendingRequest) {
      return new Response(
        JSON.stringify({ request: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { data: claimedRequest, error: claimError } = await supabase
      .from('device_discovery_requests')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .eq('id', pendingRequest.id)
      .eq('status', 'pending')
      .select('id, home_id, status, requested_at, started_at')
      .maybeSingle()

    if (claimError) throw claimError

    return new Response(
      JSON.stringify({ request: claimedRequest ?? null }),
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
