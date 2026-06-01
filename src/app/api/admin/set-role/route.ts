import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SUPER_ADMIN_EMAIL = 'info@modernicastudios.com'
const ROLES = new Set(['super_admin', 'admin', 'manager', 'client'])

// Alleen super admins mogen rollen wijzigen (incl. iemand super admin maken).
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const admin = createAdminClient()
  const { data: me } = await admin.from('user_profiles').select('role').eq('id', user.id).single()
  const isSuper = me?.role === 'super_admin' || user.email?.toLowerCase() === SUPER_ADMIN_EMAIL
  if (!isSuper) return NextResponse.json({ error: 'Alleen super admins mogen rollen wijzigen' }, { status: 403 })

  const { userId, role } = await req.json()
  if (typeof userId !== 'string' || !ROLES.has(role)) {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 })
  }

  // Voorkom dat de laatste super admin zichzelf degradeert (lock-out bescherming).
  if (userId === user.id && me?.role === 'super_admin' && role !== 'super_admin') {
    const { count } = await admin.from('user_profiles')
      .select('id', { count: 'exact', head: true }).eq('role', 'super_admin')
    if ((count || 0) <= 1) {
      return NextResponse.json({ error: 'Je bent de enige super admin — maak eerst iemand anders super admin.' }, { status: 400 })
    }
  }

  const { error } = await admin.from('user_profiles').update({ role }).eq('id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, role })
}
