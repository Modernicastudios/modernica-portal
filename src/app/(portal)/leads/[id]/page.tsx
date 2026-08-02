import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import LeadDetailClient from './LeadDetailClient'

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin.from('user_profiles').select('*').eq('id', user.id).single()
  if (!profile?.agency_id) redirect('/dashboard')

  const { data: outreach } = await admin
    .from('lead_outreach')
    .select('*, lead_companies(*), lead_contacts(*)')
    .eq('id', id)
    .eq('agency_id', profile.agency_id)
    .single()

  if (!outreach) return <div style={{ padding: 40 }}>Lead niet gevonden</div>

  const companyId = outreach.company_id
  const [calls, notes, meetings, activities, allContacts, agencyUsers] = await Promise.all([
    admin.from('lead_calls').select('*').eq('company_id', companyId).order('called_at', { ascending: false }),
    admin.from('lead_notes').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
    admin.from('lead_meetings').select('*').eq('company_id', companyId).order('scheduled_at', { ascending: false }),
    admin.from('lead_activities').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(100),
    admin.from('lead_contacts').select('*').eq('company_id', companyId),
    admin.from('user_profiles').select('id, full_name').eq('agency_id', profile.agency_id),
  ])

  return <LeadDetailClient
    outreach={outreach}
    calls={calls.data || []}
    notes={notes.data || []}
    meetings={meetings.data || []}
    activities={activities.data || []}
    contacts={allContacts.data || []}
    users={agencyUsers.data || []}
    currentUserId={profile.id}
  />
}
