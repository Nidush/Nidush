import { createClient } from '@supabase/supabase-js'
import { createFunctionLogger, jsonResponse } from '../_shared/observability.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-sync-token, x-device-sync-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

Deno.serve(async (req) => {
  const log = createFunctionLogger('claim-device-discovery', req)
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const expectedSharedSecret = Deno.env.get('DEVICE_SYNC_SHARED_SECRET') ?? ''
    const token = String(req.headers.get('x-device-sync-token') ?? '').trim()
    const providedSharedSecret = String(req.headers.get('x-device-sync-secret') ?? '').trim()

    if (!expectedSharedSecret) throw new Error('DEVICE_SYNC_SHARED_SECRET is not configured.')
    if (!token) throw new Error('Missing device sync token.')
    if (expectedSharedSecret && providedSharedSecret !== expectedSharedSecret) {
      log.warn('Rejected device discovery claim because the shared secret was invalid.')
      return jsonResponse({ error: 'Unauthorized', requestId: log.requestId }, 401, corsHeaders)
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: homeSecret, error: homeError } = await supabase
      .from('home_device_secrets')
      .select('home_id')
      .eq('device_sync_token', token)
      .maybeSingle()

    if (homeError || !homeSecret?.home_id) throw new Error('Invalid device sync token.')

    const { data: pendingRequest, error: pendingError } = await supabase
      .from('device_discovery_requests')
      .select('id, home_id, status, requested_at')
      .eq('home_id', homeSecret.home_id)
      .eq('status', 'pending')
      .order('requested_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (pendingError) throw pendingError

    if (!pendingRequest) {
      return jsonResponse({ request: null }, 200, corsHeaders)
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

    log.info('Claimed pending device discovery request.', {
      homeId: homeSecret.home_id,
      requestId: pendingRequest.id,
    })

    return jsonResponse({ request: claimedRequest ?? null }, 200, corsHeaders)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log.error('Failed to claim device discovery request.', { error: message })
    return jsonResponse({ error: message, requestId: log.requestId }, 400, corsHeaders)
  }
})
