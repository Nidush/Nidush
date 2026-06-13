import { createClient } from '@supabase/supabase-js'
import { createFunctionLogger, jsonResponse } from '../_shared/observability.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

type MembershipRow = {
  home_id: number
  role: string | null
  created_at: string | null
}

Deno.serve(async (req) => {
  const log = createFunctionLogger('delete-account', req)
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const authHeader = req.headers.get('Authorization')

    if (!authHeader) throw new Error('Missing authorization header.')
    if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured.')

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) throw new Error('Invalid session.')

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: memberships, error: membershipsError } = await supabase
      .from('user_homes')
      .select('home_id, role, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (membershipsError) throw membershipsError

    for (const membership of ((memberships ?? []) as MembershipRow[])) {
      if (membership.role !== 'admin') continue

      const { data: replacementAdmin, error: replacementError } = await supabase
        .from('user_homes')
        .select('user_id')
        .eq('home_id', membership.home_id)
        .neq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (replacementError) throw replacementError

      if (replacementAdmin?.user_id) {
        const { error: demoteCurrentAdminError } = await supabase
          .from('user_homes')
          .update({ role: 'resident' })
          .eq('home_id', membership.home_id)
          .eq('user_id', user.id)

        if (demoteCurrentAdminError) throw demoteCurrentAdminError

        const { error: promoteError } = await supabase
          .from('user_homes')
          .update({ role: 'admin' })
          .eq('home_id', membership.home_id)
          .eq('user_id', replacementAdmin.user_id)

        if (promoteError) throw promoteError

        const { error: homeOwnerError } = await supabase
          .from('homes')
          .update({ creator_user_id: replacementAdmin.user_id })
          .eq('id', membership.home_id)

        if (homeOwnerError) throw homeOwnerError
      } else {
        const { error: clearHomeOwnerError } = await supabase
          .from('homes')
          .update({ creator_user_id: null })
          .eq('id', membership.home_id)

        if (clearHomeOwnerError) throw clearHomeOwnerError
      }
    }

    const deleteOwnRows = async (table: string, column: string = 'user_id') => {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq(column, user.id)

      if (error) throw error
    }

    await deleteOwnRows('activities')
    await deleteOwnRows('routines')
    await deleteOwnRows('shortcuts')
    await deleteOwnRows('devices')
    await deleteOwnRows('biometric_readings')
    await deleteOwnRows('notifications')
    await deleteOwnRows('user_consents')
    await deleteOwnRows('user_homes')

    const { data: avatarFiles, error: avatarListError } = await supabase.storage
      .from('avatars')
      .list(user.id, { limit: 100 })

    if (avatarListError) {
      log.warn('Could not list avatar files during account deletion.', {
        userId: user.id,
        error: avatarListError.message,
      })
    } else if (avatarFiles && avatarFiles.length > 0) {
      const avatarPaths = avatarFiles.map((file) => `${user.id}/${file.name}`)
      const { error: avatarRemoveError } = await supabase.storage
        .from('avatars')
        .remove(avatarPaths)

      if (avatarRemoveError) {
        log.warn('Could not remove avatar files during account deletion.', {
          userId: user.id,
          error: avatarRemoveError.message,
        })
      }
    }

    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id)
    if (deleteUserError) throw deleteUserError

    const { error: cleanupHomesError } = await supabase.rpc('cleanup_orphan_homes')
    if (cleanupHomesError) {
      log.warn('cleanup_orphan_homes failed after deleting account.', {
        userId: user.id,
        error: cleanupHomesError.message,
      })
    }

    log.info('Deleted account and related data.', { userId: user.id })
    return jsonResponse({ success: true, requestId: log.requestId }, 200, corsHeaders)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log.error('Failed to delete account.', { error: message })
    return jsonResponse({ error: message, requestId: log.requestId }, 400, corsHeaders)
  }
})
