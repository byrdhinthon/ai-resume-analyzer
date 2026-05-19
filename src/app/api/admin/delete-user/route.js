import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    // Verify requesting user is admin
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!adminProfile || adminProfile.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 })
    }

    const { userId } = await request.json()
    if (!userId) {
      return Response.json({ error: 'Missing userId' }, { status: 400 })
    }

    // Prevent admin from deleting themselves
    if (userId === user.id) {
      return Response.json({ error: 'CANNOT_DELETE_SELF' }, { status: 400 })
    }

    // Check target user exists
    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .single()

    if (!targetProfile) {
      return Response.json({ error: 'USER_NOT_FOUND' }, { status: 404 })
    }

    // 1. Get all analyses to find storage files
    const { data: analyses } = await supabaseAdmin
      .from('analyses')
      .select('id, file_url')
      .eq('user_id', userId)

    // 2. Delete files from storage
    if (analyses && analyses.length > 0) {
      const filePaths = analyses
        .map(a => a.file_url)
        .filter(Boolean)

      if (filePaths.length > 0) {
        const { error: storageError } = await supabaseAdmin.storage
          .from('resumes')
          .remove(filePaths)

        if (storageError) {
          console.error('Storage delete error:', storageError.message)
          // Continue anyway — don't block user deletion for orphaned files
        }
      }
    }

    // 3. Delete analyses
    const { error: analysesError } = await supabaseAdmin
      .from('analyses')
      .delete()
      .eq('user_id', userId)

    if (analysesError) {
      console.error('Analyses delete error:', analysesError.message)
      return Response.json({ error: 'DELETE_ANALYSES_FAILED' }, { status: 500 })
    }

    // 4. Delete profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('Profile delete error:', profileError.message)
      return Response.json({ error: 'DELETE_PROFILE_FAILED' }, { status: 500 })
    }

    // 5. Delete auth user
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authDeleteError) {
      console.error('Auth delete error:', authDeleteError.message)
      return Response.json({ error: 'DELETE_AUTH_FAILED' }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error('Delete user error:', err)
    return Response.json({ error: 'DELETE_FAILED' }, { status: 500 })
  }
}
