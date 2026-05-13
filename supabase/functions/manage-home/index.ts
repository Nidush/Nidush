// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
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

    const supabaseClient = createClient(
      supabaseUrl,
      serviceRoleKey
    )

    const { action, joinCode } = await req.json()

    if (action === 'join-home') {
      const normalizedJoinCode = String(joinCode ?? '').trim().toUpperCase()
      if (!normalizedJoinCode) throw new Error('Código de casa obrigatório.')

      // 1. Procurar a casa pelo código
      const { data: home, error: homeError } = await supabaseClient
        .from('homes')
        .select('id, name')
        .eq('join_code', normalizedJoinCode)
        .single()

      if (homeError || !home) throw new Error('Código de casa inválido.')

      await supabaseClient
        .from('users')
        .upsert({
          auth_uid: user.id,
          email: user.email,
          first_name: user.user_metadata?.first_name ?? '',
          last_name: user.user_metadata?.last_name ?? '',
        }, { onConflict: 'auth_uid' })

      // 2. Verificar se o utilizador já lá está
      const { data: existing } = await supabaseClient
        .from('user_homes')
        .select('*')
        .eq('user_id', user.id)
        .eq('home_id', home.id)
        .maybeSingle()

      // 3. Adicionar utilizador
      if (!existing) {
        const { error: joinError } = await supabaseClient
          .from('user_homes')
          .insert({ user_id: user.id, home_id: home.id, role: 'resident' })

        if (joinError) throw joinError
      }

      return new Response(JSON.stringify({ message: "Sucesso!", home }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      })
    }

    throw new Error('Ação inválida.')

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 400 
    })
  }
})
