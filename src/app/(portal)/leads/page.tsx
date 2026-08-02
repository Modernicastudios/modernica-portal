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

  // Alle leads — paginated fetch tot ~2500 (voor volledig zicht)
  const outreach: any[] = []
  {
    let offset = 0
    for (let i = 0; i < 3; i++) {
      const { data } = await admin
        .from('lead_outreach')
        .select('*, lead_companies(*), lead_contacts(*)')
        .eq('agency_id', profile.agency_id)
        .order('updated_at', { ascending: false })
        .range(offset, offset + 999)
      if (!data || data.length === 0) break
      outreach.push(...data)
      if (data.length < 1000) break
      offset += 1000
    }
  }

  // Stage stats over hele pool — pagineer om Supabase 1000 limit te omzeilen
  const stageStats: Record<string, number> = {}
  {
    let offset = 0
    const batch = 1000
    for (let i = 0; i < 10; i++) {
      const { data: allStages } = await admin
        .from('lead_outreach')
        .select('pipeline_stage')
        .eq('agency_id', profile.agency_id)
        .range(offset, offset + batch - 1)
      if (!allStages || allStages.length === 0) break
      for (const o of allStages) {
        stageStats[o.pipeline_stage || 'nieuw'] = (stageStats[o.pipeline_stage || 'nieuw'] || 0) + 1
      }
      if (allStages.length < batch) break
      offset += batch
    }
  }

  // Callbacks due nu
  const now = new Date().toISOString()
  const { count: callbacksDue } = await admin
    .from('lead_outreach')
    .select('id', { count: 'exact', head: true })
    .eq('agency_id', profile.agency_id)
    .eq('pipeline_stage', 'callback')
    .lte('next_action_at', now)

  // Belactiviteit vandaag + week
  const todayStart = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toISOString()
  const weekAgo = new Date(Date.now() - 7 * 86400 * 1000).toISOString()

  const [callsTodayR, callsWeekR, recentActs, recentCalls, meetingsUpcoming] = await Promise.all([
    admin.from('lead_calls').select('outcome, called_by').eq('agency_id', profile.agency_id).gte('called_at', todayStart),
    admin.from('lead_calls').select('outcome, called_at, called_by').eq('agency_id', profile.agency_id).gte('called_at', weekAgo),
    admin.from('lead_activities').select('*, lead_companies(name)').eq('agency_id', profile.agency_id).order('created_at', { ascending: false }).limit(25),
    admin.from('lead_calls').select('*, lead_companies(name)').eq('agency_id', profile.agency_id).order('called_at', { ascending: false }).limit(15),
    admin.from('lead_meetings').select('*, lead_companies(name)').eq('agency_id', profile.agency_id).gte('scheduled_at', new Date().toISOString()).eq('status', 'planned').order('scheduled_at').limit(10),
  ])

  const callsToday = callsTodayR.data || []
  const callsWeek = callsWeekR.data || []

  // Outcome verdeling
  const outcomeToday: Record<string, number> = {}
  for (const c of callsToday) outcomeToday[c.outcome] = (outcomeToday[c.outcome] || 0) + 1

  const outcomeWeek: Record<string, number> = {}
  for (const c of callsWeek) outcomeWeek[c.outcome] = (outcomeWeek[c.outcome] || 0) + 1

  // Callers this week (voor manager overview)
  const callersMap: Record<string, number> = {}
  for (const c of callsWeek) if (c.called_by) callersMap[c.called_by] = (callersMap[c.called_by] || 0) + 1

  const totalLeads = Object.values(stageStats).reduce((a, b) => a + b, 0)

  return (
    <CRMDashboard
      leads={outreach}
      stageStats={stageStats}
      totalLeads={totalLeads}
      callbacksDue={callbacksDue || 0}
      callsToday={callsToday.length}
      callsWeek={callsWeek.length}
      outcomeToday={outcomeToday}
      outcomeWeek={outcomeWeek}
      recentActivities={recentActs.data || []}
      recentCalls={recentCalls.data || []}
      upcomingMeetings={meetingsUpcoming.data || []}
      userName={profile.full_name || 'Jij'}
    />
  )
}
