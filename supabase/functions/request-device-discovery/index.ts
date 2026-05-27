import { createClient } from '@supabase/supabase-js'
import { createFunctionLogger, jsonResponse } from '../_shared/observability.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

Deno.serve(async (req) => {
  const log = createFunctionLogger('request-device-discovery', req)
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const authHeader = req.headers.get('Authorization')

    if (!authHeader) throw new Error('Missing authorization header.')

    const authClient = createClient(
      supabaseUrl,
      anonKey,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) throw new Error('Invalid session.')

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: homeAssoc, error: homeError } = await supabase
      .from('user_homes')
      .select('home_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (homeError) throw homeError
    if (!homeAssoc?.home_id) throw new Error('No home connected to this user.')

    const { data: existingOpenRequest, error: existingError } = await supabase
      .from('device_discovery_requests')
      .select('id, status, requested_at')
      .eq('home_id', homeAssoc.home_id)
      .in('status', ['pending', 'running'])
      .order('requested_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingError) throw existingError

    if (existingOpenRequest) {
      log.info('Reused existing open discovery request.', {
        userId: user.id,
        homeId: homeAssoc.home_id,
        requestId: existingOpenRequest.id,
      })
      return jsonResponse({
          queued: false,
          reused: true,
          request: existingOpenRequest,
        }, 200, corsHeaders)
    }

    const { data: createdRequest, error: createError } = await supabase
      .from('device_discovery_requests')
      .insert({
        home_id: homeAssoc.home_id,
        requested_by: user.id,
        status: 'pending',
        requested_at: new Date().toISOString(),
      })
      .select('id, status, requested_at')
      .single()

    if (createError) throw createError
    log.info('Queued new device discovery request.', {
      userId: user.id,
      homeId: homeAssoc.home_id,
      requestId: createdRequest.id,
    })

    return jsonResponse({
        queued: true,
        reused: false,
        request: createdRequest,
      }, 200, corsHeaders)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log.error('Failed to queue device discovery request.', { error: message })
    return jsonResponse({ error: message, requestId: log.requestId }, 400, corsHeaders)
  }
})
