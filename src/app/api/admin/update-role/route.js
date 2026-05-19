import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    // Get the requesting user's token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    // Verify the requesting user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check that requesting user is admin
    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!adminProfile || adminProfile.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 })
    }

    // Get the target user and new role from request body
    const { userId, newRole } = await request.json()

    if (!userId || !newRole) {
      return Response.json({ error: 'Missing userId or newRole' }, { status: 400 })
    }

    const validRoles = ['member', 'professor', 'admin']
    if (!validRoles.includes(newRole)) {
      return Response.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Prevent admin from changing their own role
    if (userId === user.id) {
      return Response.json({ error: 'Cannot change your own role' }, { status: 400 })
    }

    // Update the user's role using service role (bypasses RLS)
    const { data, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return Response.json({ error: updateError.message }, { status: 500 })
    }

    return Response.json({ success: true, profile: data })
  } catch (err) {
    console.error('Server error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
