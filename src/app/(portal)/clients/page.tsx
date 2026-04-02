import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientsClient from './ClientsClient'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'client') redirect('/dashboard')

  const agencyId = profile?.agency_id || ''

  const [
    { data: clients },
    { data: pendingUsers },
    { data: activeProjects },
    { data: pendingPosts },
  ] = await Promise.all([
    supabase
      .from('clients')
      .select('*')
      .eq('agency_id', agencyId)
      .order('company_name'),

    supabase
      .from('user_profiles')
      .select('*')
      .eq('agency_id', agencyId)
      .is('client_id', null)
      .neq('role', 'admin')
      .neq('role', 'manager')
      .neq('id', user.id),

    supabase
      .from('projects')
      .select('client_id')
      .eq('agency_id', agencyId)
      .in('status', ['backlog', 'in_progress', 'waiting_feedback', 'blocked', 'review']),

    supabase
      .from('content_posts')
      .select('client_id')
      .eq('agency_id', agencyId)
      .eq('status', 'pending_approval'),
  ])

  // Build lookup maps for counts per client
  const projectCountMap: Record<string, number> = {}
  for (const p of activeProjects || []) {
    if (p.client_id) projectCountMap[p.client_id] = (projectCountMap[p.client_id] || 0) + 1
  }

  const postCountMap: Record<string, number> = {}
  for (const p of pendingPosts || []) {
    if (p.client_id) postCountMap[p.client_id] = (postCountMap[p.client_id] || 0) + 1
  }

  const enrichedClients = (clients || []).map(c => ({
    ...c,
    activeProjects: projectCountMap[c.id] || 0,
    pendingPosts:   postCountMap[c.id]    || 0,
  }))

  return (
    <ClientsClient
      clients={enrichedClients}
      pendingUsers={pendingUsers || []}
      agencyId={agencyId}
      isAdmin={profile?.role === 'admin' || profile?.role === 'manager' || profile?.role === 'super_admin'}
    />
  )
}
