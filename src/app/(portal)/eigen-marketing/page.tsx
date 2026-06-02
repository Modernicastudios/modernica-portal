import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import EigenMarketingClient from './EigenMarketingClient'

const MANAGER_ROLES = new Set(['admin', 'manager', 'super_admin'])

// "Eigen marketing": de agency promoot zichzelf, los van de klanten.
// Alles met client_id = NULL hoort bij de agency zelf.
export default async function EigenMarketingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('user_profiles').select('agency_id, role').eq('id', user.id).single()
  if (!profile?.agency_id || !MANAGER_ROLES.has(profile.role)) redirect('/dashboard')

  const { data: agency } = await admin
    .from('agencies').select('id, name, features').eq('id', profile.agency_id).single()
  const leadMachineOn = Boolean((agency?.features as Record<string, boolean> | null)?.lead_machine)

  // Eigen leadcampagne (client_id null).
  const { data: selfCampaign } = await admin
    .from('lead_campaigns')
    .select('id, status, settings')
    .eq('agency_id', profile.agency_id)
    .is('client_id', null)
    .maybeSingle()

  // Eigen leads, geteld per status (voor het mini-overzicht).
  const { data: selfOutreach } = await admin
    .from('lead_outreach')
    .select('status')
    .eq('agency_id', profile.agency_id)
    .is('client_id', null)

  const counts = { total: 0, queued: 0, pushed: 0, replied: 0, won: 0 }
  for (const o of selfOutreach || []) {
    counts.total++
    if (o.status === 'queued') counts.queued++
    else if (o.status === 'pushed') counts.pushed++
    else if (o.status === 'replied') counts.replied++
    else if (o.status === 'won') counts.won++
  }

  return (
    <EigenMarketingClient
      agencyName={agency?.name || 'Mijn agency'}
      leadMachineOn={leadMachineOn}
      campaignActive={selfCampaign?.status === 'active'}
      smartleadLinked={Boolean((selfCampaign?.settings as { smartlead_campaign_id?: string } | null)?.smartlead_campaign_id)}
      counts={counts}
    />
  )
}
