import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ReportView from './ReportView'

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; preset?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin.from('user_profiles').select('*').eq('id', user.id).single()
  if (!profile?.agency_id) redirect('/dashboard')

  // Determine date range
  const now = new Date()
  let from = params.from ? new Date(params.from) : new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let to = params.to ? new Date(params.to) : now

  if (params.preset === 'today') {
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    to = now
  } else if (params.preset === 'week') {
    from = new Date(now.getTime() - 7 * 86400 * 1000)
    to = now
  } else if (params.preset === 'month') {
    from = new Date(now.getFullYear(), now.getMonth(), 1)
    to = now
  } else if (params.preset === 'quarter') {
    const q = Math.floor(now.getMonth() / 3) * 3
    from = new Date(now.getFullYear(), q, 1)
    to = now
  }

  const fromIso = from.toISOString()
  const toIso = to.toISOString()

  // Fetch alle relevante data in parallel
  const [callsR, notesR, meetingsR, activitiesR, newLeadsR, wonR, agencyR, usersR] = await Promise.all([
    admin.from('lead_calls').select('*, lead_companies(name, city, industry), user_profiles!called_by(full_name)').eq('agency_id', profile.agency_id).gte('called_at', fromIso).lte('called_at', toIso).order('called_at', { ascending: false }),
    admin.from('lead_notes').select('*, lead_companies(name)').eq('agency_id', profile.agency_id).gte('created_at', fromIso).lte('created_at', toIso).order('created_at', { ascending: false }),
    admin.from('lead_meetings').select('*, lead_companies(name)').eq('agency_id', profile.agency_id).gte('scheduled_at', fromIso).lte('scheduled_at', toIso).order('scheduled_at'),
    admin.from('lead_activities').select('*, lead_companies(name)').eq('agency_id', profile.agency_id).gte('created_at', fromIso).lte('created_at', toIso).order('created_at', { ascending: false }).limit(500),
    admin.from('lead_outreach').select('id', { count: 'exact', head: true }).eq('agency_id', profile.agency_id).gte('created_at', fromIso).lte('created_at', toIso),
    admin.from('lead_outreach').select('*, lead_companies(name)').eq('agency_id', profile.agency_id).eq('pipeline_stage', 'klant').gte('updated_at', fromIso).lte('updated_at', toIso),
    admin.from('agencies').select('name').eq('id', profile.agency_id).single(),
    admin.from('user_profiles').select('id, full_name').eq('agency_id', profile.agency_id),
  ])

  return <ReportView
    from={from.toISOString()}
    to={to.toISOString()}
    preset={params.preset || 'custom'}
    agencyName={agencyR.data?.name || 'Modernica'}
    calls={callsR.data || []}
    notes={notesR.data || []}
    meetings={meetingsR.data || []}
    activities={activitiesR.data || []}
    newLeadsCount={newLeadsR.count || 0}
    wonLeads={wonR.data || []}
    users={usersR.data || []}
  />
}
