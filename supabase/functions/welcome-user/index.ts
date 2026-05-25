import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = await req.json().catch(() => ({}))
    const name = String(
      payload?.name ??
      user.user_metadata?.first_name ??
      user.email?.split('@')[0] ??
      'utilizador',
    )

    // Pegar a chave do Resend das variáveis de ambiente do Supabase
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    // Sem domínio verificado no Resend, só é possível enviar para o email da conta.
    // Quando tiveres domínio próprio, muda TEST_MODE para false.
    const TEST_MODE = true
    const VERIFIED_EMAIL = 'nidush7@gmail.com'
    const recipient = TEST_MODE ? VERIFIED_EMAIL : user.email

    if (!RESEND_API_KEY || !recipient) {
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
        from: 'Nidush <nidush.pt>',
        to: [recipient],
        subject: 'Bem-vindo ao Nidush! ',
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F3F5EE; padding: 40px 20px; color: #3E545C;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
              <div style="background-color: #F8FDF8; padding: 40px 20px; text-align: center; border-bottom: 3px solid #5C8D58;">
                <img src="https://raw.githubusercontent.com/Nidush/Nidush/main/assets/images/Logo.png" alt="Nidush" style="width: 150px; height: auto;" />
                <p style="color: #3E545C; margin-top: 15px; font-size: 16px; font-weight: 500;">Welcome Home</p>
              </div>
              <div style="padding: 40px 30px;">
                <h2 style="color: #3E545C; font-size: 24px; margin-top: 0;">Olá, ${name}! </h2>
                <p style="font-size: 16px; line-height: 1.6; color: #5a737d;">Obrigado por te juntares ao <strong>Nidush</strong>.</p>
                <div style="background-color: #f8f9f5; border-left: 4px solid #5C8D58; padding: 20px; border-radius: 4px; margin: 25px 0;">
                  <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #3E545C;">A partir de agora, a tua casa é o teu safe space. Explora as nossas atividades, descobre novas rotinas sustentáveis e começa a tua jornada de bem-estar.</p>
                </div>
                <p style="font-size: 16px; line-height: 1.6; color: #5a737d;">Estamos muito felizes por fazeres parte da nossa comunidade.</p>
                <div style="margin-top: 40px; border-top: 1px solid #eaeaea; padding-top: 30px; text-align: center;">
                  <p style="font-size: 14px; color: #5C8D58; font-weight: 600; margin-bottom: 15px;">Acompanha a nossa comunidade nas redes:</p>
                  
                  <div style="margin-bottom: 30px;">
                    <a href="https://www.instagram.com/nidush_app/" target="_blank" style="display: inline-block; margin: 0 10px; text-decoration: none; background-color: #f0f5f0; color: #3E545C; padding: 10px 20px; border-radius: 20px; font-size: 14px; font-weight: bold;">📷 Instagram</a>
                    
                    <a href="https://linktr.ee/nidush_app" target="_blank" style="display: inline-block; margin: 0 10px; text-decoration: none; background-color: #f0f5f0; color: #3E545C; padding: 10px 20px; border-radius: 20px; font-size: 14px; font-weight: bold;">🔗 Linktree</a>
                  </div>

                  <p style="font-size: 14px; color: #88a0a8; margin: 0;">Com carinho,<br><strong>Equipa Nidush</strong></p>
                </div>
              </div>
            </div>
          </div>
        `,
      }),
    })

    const resData = await res.json()

    if (!res.ok) {
      console.error("Erro retornado pelo Resend:", resData)
      return new Response(
        JSON.stringify({ error: "Falha ao enviar email pelo Resend", details: resData }),
        { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ message: "Email enviado!", id: resData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)

    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
