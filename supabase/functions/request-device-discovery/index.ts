import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      return new Response(
        JSON.stringify({
          queued: false,
          reused: true,
          request: existingOpenRequest,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
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

    return new Response(
      JSON.stringify({
        queued: true,
        reused: false,
        request: createdRequest,
      }),
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
