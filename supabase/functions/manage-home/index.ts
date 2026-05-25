import { createClient } from '@supabase/supabase-js'
import { createFunctionLogger, jsonResponse } from '../_shared/observability.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

Deno.serve(async (req) => {
  const log = createFunctionLogger('manage-home', req)
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const authHeader = req.headers.get('Authorization')

    if (!authHeader) throw new Error('Sessão não encontrada.')

    const authClient = createClient(
      supabaseUrl,
      anonKey,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) throw new Error('Sessão inválida.')

    const { action, joinCode } = await req.json()

    if (action === 'join-home') {
      const normalizedJoinCode = String(joinCode ?? '').trim().toUpperCase()
      if (!normalizedJoinCode) throw new Error('Código de casa obrigatório.')

      const { data: joinedHomeId, error: joinError } = await authClient
        .rpc('join_home_by_code', { p_join_code: normalizedJoinCode })

      if (joinError || !joinedHomeId) {
        throw joinError ?? new Error('Código de casa inválido.')
      }

      const { data: home, error: homeError } = await authClient
        .from('homes')
        .select('id, name')
        .eq('id', joinedHomeId)
        .maybeSingle()

      if (homeError || !home) throw new Error('Casa não encontrada após o join.')

      log.info('User joined home successfully.', {
        userId: user.id,
        homeId: home.id,
        action,
      })
      return jsonResponse({ message: "Sucesso!", home, requestId: log.requestId }, 200, corsHeaders)
    }

    throw new Error('Ação inválida.')

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log.error('Failed to manage home request.', { error: message })
    return jsonResponse({ error: message, requestId: log.requestId }, 400, corsHeaders)
  }
})
