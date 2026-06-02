import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AdminClient from './AdminClient'

const SUPER_ADMIN_EMAIL = 'info@modernicastudios.com'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Service-role client: super admin moet álle agencies/gebruikers zien (RLS zou dit op de eigen agency beperken).
  const admin = createAdminClient()
  const { data: me } = await admin.from('user_profiles').select('role').eq('id', user.id).single()
  const isSuper = me?.role === 'super_admin' || user.email?.toLowerCase() === SUPER_ADMIN_EMAIL
  if (!isSuper) redirect('/dashboard')
  const [
    { data: agencies, count: agencyCount },
    { data: recentUsers },
    { data: recentSignups },
  ] = await Promise.all([
    admin.from('agencies').select('*', { count: 'exact' }).order('created_at', { ascending: false }),
    admin.from('user_profiles').select('*, agencies(name)').order('created_at', { ascending: false }).limit(20),
    admin.from('agencies').select('*').order('created_at', { ascending: false }).limit(10),
  ])

  // AI-verbruik deze maand per agency (USD). Faalt stil als de tabel nog niet bestaat.
  const aiSpend: Record<string, number> = {}
  try {
    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const { data: usage } = await admin
      .from('ai_usage').select('agency_id, cost_usd').gte('created_at', firstOfMonth)
    for (const u of usage || []) {
      aiSpend[u.agency_id] = (aiSpend[u.agency_id] || 0) + Number(u.cost_usd)
    }
  } catch { /* migratie nog niet toegepast */ }
  const aiDefaultLimit = Number(process.env.AI_MONTHLY_LIMIT_USD) || 50

  return (
    <AdminClient
      agencies={agencies || []}
      agencyCount={agencyCount || 0}
      recentUsers={recentUsers || []}
      recentSignups={recentSignups || []}
      aiSpend={aiSpend}
      aiDefaultLimit={aiDefaultLimit}
    />
  )
}
