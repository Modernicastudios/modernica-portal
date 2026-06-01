import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MeetingsClient from './MeetingsClient'

export default async function MeetingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, agencies(*)')
    .eq('id', user.id)
    .single()

  // Vergaderingen zijn een intern agency-onderdeel — klanten hebben hier niets te zoeken.
  if (profile?.client_id) redirect('/dashboard')

  const agencyId = profile?.agency_id
  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'

  const [{ data: meetings }, { data: clients }, { data: projects }] = await Promise.all([
    supabase
      .from('meeting_notes')
      .select('*, clients(company_name)')
      .eq('agency_id', agencyId || '')
      .order('meeting_date', { ascending: false }),
    supabase
      .from('clients')
      .select('id, company_name')
      .eq('agency_id', agencyId || ''),
    supabase
      .from('projects')
      .select('id, title, clients(company_name)')
      .eq('agency_id', agencyId || '')
      .not('status', 'eq', 'archived')
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  return (
    <MeetingsClient
      meetings={meetings || []}
      clients={clients || []}
      projects={projects || []}
      agencyId={agencyId || ''}
      userId={user.id}
      userName={profile?.full_name || 'Gebruiker'}
      isAdmin={isAdmin}
    />
  )
}
