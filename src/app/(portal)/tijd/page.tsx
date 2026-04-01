import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TijdClient from './TijdClient'

export default async function TijdPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, agency_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.role === 'client') redirect('/dashboard')

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [entriesRes, clientsRes, projectsRes] = await Promise.all([
    supabase
      .from('time_entries')
      .select('*, clients(id, company_name), projects(id, title)')
      .eq('agency_id', profile.agency_id || '')
      .gte('start_time', thirtyDaysAgo.toISOString())
      .order('start_time', { ascending: false }),

    supabase
      .from('clients')
      .select('id, company_name')
      .eq('agency_id', profile.agency_id || '')
      .order('company_name'),

    supabase
      .from('projects')
      .select('id, title, client_id')
      .eq('agency_id', profile.agency_id || '')
      .order('title'),
  ])

  return (
    <TijdClient
      initialEntries={entriesRes.data || []}
      clients={clientsRes.data || []}
      projects={projectsRes.data || []}
      userId={user.id}
      agencyId={profile.agency_id || ''}
    />
  )
}
