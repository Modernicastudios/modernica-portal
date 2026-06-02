import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import StatusBoard from './StatusBoard'

const ADMIN_ROLES = new Set(['admin', 'manager', 'super_admin'])

// Server-side check: we lezen alléén of een sleutel/instelling AANWEZIG is.
// De waarde zelf verlaat de server nooit.
export default async function StatusPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('user_profiles').select('agency_id, role').eq('id', user.id).single()
  if (!profile?.agency_id || !ADMIN_ROLES.has(profile.role)) redirect('/dashboard')

  const has = (v: string | undefined | null) => Boolean(v && String(v).trim())

  // Database-verbinding testen met een lichte telling.
  let dbOk = false
  try {
    const { error } = await admin.from('agencies').select('id', { count: 'exact', head: true })
    dbOk = !error
  } catch { dbOk = false }

  const checks = {
    db: dbOk,
    supabaseUrl: has(process.env.NEXT_PUBLIC_SUPABASE_URL),
    serviceRole: has(process.env.SUPABASE_SERVICE_ROLE_KEY),
    apify: has(process.env.APIFY_TOKEN),
    anthropic: has(process.env.ANTHROPIC_API_KEY),
    apollo: has(process.env.APOLLO_API_KEY),
    millionverifier: has(process.env.MILLIONVERIFIER_API_KEY),
    smartlead: has(process.env.SMARTLEAD_API_KEY),
    smartleadWebhook: has(process.env.SMARTLEAD_WEBHOOK_SECRET),
    cron: has(process.env.CRON_SECRET),
    stripe: has(process.env.STRIPE_SECRET_KEY),
    appUrl: has(process.env.NEXT_PUBLIC_APP_URL),
  }

  return <StatusBoard checks={checks} />
}
