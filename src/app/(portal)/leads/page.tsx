import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import CRMDashboard from './CRMDashboard'

export default async function LeadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('user_profiles').select('*').eq('id', user.id).single()
  if (!profile?.agency_id) redirect('/dashboard')

  // Alle leads (recentste eerst, limit 200 voor snelheid — filter/pagineer in client)
  const { data: outreach } = await admin
    .from('lead_outreach')
    .select('*, lead_companies(*), lead_contacts(*)')
    .eq('agency_id', profile.agency_id)
    .order('updated_at', { ascending: false })
    .limit(200)

  // Stage stats over hele pool
  const { data: allStages } = await admin
    .from('lead_outreach')
    .select('pipeline_stage')
    .eq('agency_id', profile.agency_id)

  const stageStats: Record<string, number> = {}
  for (const o of allStages || []) {
    stageStats[o.pipeline_stage || 'nieuw'] = (stageStats[o.pipeline_stage || 'nieuw'] || 0) + 1
  }

  // Callbacks due nu
  const now = new Date().toISOString()
  const { count: callbacksDue } = await admin
    .from('lead_outreach')
    .select('id', { count: 'exact', head: true })
    .eq('agency_id', profile.agency_id)
    .eq('pipeline_stage', 'callback')
    .lte('next_action_at', now)

  // Belactiviteit vandaag
  const todayStart = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toISOString()
  const { count: callsToday } = await admin
    .from('lead_calls')
    .select('id', { count: 'exact', head: true })
    .eq('agency_id', profile.agency_id)
    .gte('called_at', todayStart)

  const totalLeads = Object.values(stageStats).reduce((a, b) => a + b, 0)

  return (
    <CRMDashboard
      leads={outreach || []}
      stageStats={stageStats}
      totalLeads={totalLeads}
      callbacksDue={callbacksDue || 0}
      callsToday={callsToday || 0}
      userName={profile.full_name || 'Jij'}
    />
  )
}
