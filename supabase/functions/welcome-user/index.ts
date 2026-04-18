// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, email } = await req.json()
    
    // Pegar a chave do Resend das variáveis de ambiente do Supabase
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    if (!RESEND_API_KEY) {
      console.error("ERRO: RESEND_API_KEY não configurada no Supabase.")
      return new Response(JSON.stringify({ error: "Configuração de mail em falta." }), { status: 500, headers: corsHeaders })
    }

    // Chamada à API do Resend para enviar o mail real
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Nidush <onboarding@resend.dev>',
        to: [email],
        subject: 'Bem-vindo ao Nidush! 🌿',
        html: `
          <h1>Olá, ${name}!</h1>
          <p>Obrigado por te juntares ao <strong>Nidush</strong>.</p>
          <p>A partir de agora, a tua casa é o teu safe space. Explora as nossas atividades e começa a tua jornada de bem-estar.</p>
          <br/>
          <p>Equipa Nidush</p>
        `,
      }),
    })

    const resData = await res.json()

    return new Response(
      JSON.stringify({ message: "Email enviado!", id: resData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
