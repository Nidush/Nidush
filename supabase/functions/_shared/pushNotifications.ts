import { createClient } from '@supabase/supabase-js'

type PushPayload = {
  userId: string
  title: string
  body: string
  data?: Record<string, unknown>
}

type PushTokenRow = {
  expo_push_token: string
}

export const sendPushNotificationsForUser = async ({
  userId,
  title,
  body,
  data = {},
}: PushPayload) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase envs for push notifications.')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const { data: tokens, error } = await supabase
    .from('user_push_tokens')
    .select('expo_push_token')
    .eq('user_id', userId)

  if (error) throw error
  if (!tokens || tokens.length === 0) return { sent: 0 }

  const messages = (tokens as PushTokenRow[]).map((row) => ({
    to: row.expo_push_token,
    sound: 'default',
    title,
    body,
    data,
  }))

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(messages),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Expo push send failed: ${response.status} ${text}`)
  }

  return { sent: messages.length }
}
