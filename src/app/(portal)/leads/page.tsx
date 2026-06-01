import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import LeadsClient from './LeadsClient'
import LeadsLocked from './LeadsLocked'

const MANAGER_ROLES = new Set(['admin', 'manager', 'super_admin'])

export default async function LeadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('user_profiles').select('*').eq('id', user.id).single()
  if (!profile?.agency_id) redirect('/dashboard')

  const { data: agency } = await admin
    .from('agencies').select('id, features').eq('id', profile.agency_id).single()

  // Feature-gate: staat de leadmachine uit, dan een net uitleg-scherm.
  if (!agency?.features?.lead_machine) {
    return <LeadsLocked />
  }

  const isManager = MANAGER_ROLES.has(profile.role)
  const isClient = !!profile.client_id

  // Outreach met bedrijf + contact erbij — dit is het resultaat dat je wilt zien.
  const outreachQuery = admin
    .from('lead_outreach')
    .select('*, lead_companies(*), lead_contacts(*)')
    .eq('agency_id', profile.agency_id)
    .order('created_at', { ascending: false })
    .limit(200)

  const { data: outreach } = isClient
    ? await outreachQuery.eq('client_id', profile.client_id)
    : await outreachQuery

  const { data: campaigns } = await admin
    .from('lead_campaigns')
    .select('*')
    .eq('agency_id', profile.agency_id)

  // Klanten alleen nodig voor de agency-weergave (per-klant activeren).
  const { data: clients } = isManager
    ? await admin
        .from('clients')
        .select('id, company_name, industry, city')
        .eq('agency_id', profile.agency_id)
        .order('company_name')
    : { data: [] }

  return (
    <LeadsClient
      isManager={isManager}
      isClient={isClient}
      clients={clients || []}
      campaigns={campaigns || []}
      outreach={outreach || []}
    />
  )
}
