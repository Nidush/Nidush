// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, joinCode, userId } = await req.json()

    if (action === 'join-home') {
      // 1. Procurar a casa pelo código
      const { data: home, error: homeError } = await supabaseClient
        .from('homes')
        .select('id, name')
        .eq('join_code', joinCode)
        .single()

      if (homeError || !home) throw new Error('Código de casa inválido.')

      // 2. Verificar se o utilizador já lá está
      const { data: existing } = await supabaseClient
        .from('user_homes')
        .select('*')
        .eq('user_id', userId)
        .eq('home_id', home.id)
        .maybeSingle()

      if (existing) throw new Error('Já és membro desta casa!')

      // 3. Adicionar utilizador
      const { error: joinError } = await supabaseClient
        .from('user_homes')
        .insert({ user_id: userId, home_id: home.id, role: 'resident' })

      if (joinError) throw joinError

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
