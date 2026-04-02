import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProjectsClient from './ProjectsClient'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()

  const agencyId = profile?.agency_id || ''
  const clientId = profile?.client_id

  // Clients only see their own projects
  let query = supabase
    .from('projects')
    .select('*, clients!client_id(company_name), project_groups!group_id(id, name, color), project_todos(id, done)')
    .order('created_at', { ascending: false })

  if (clientId) {
    query = query.eq('client_id', clientId) as typeof query
  } else {
    query = query.eq('agency_id', agencyId) as typeof query
  }

  const { data: projects } = await query

  const { data: clients } = await supabase
    .from('clients')
    .select('id, company_name')
    .eq('agency_id', agencyId)

  const { data: groups } = await supabase
    .from('project_groups')
    .select('id, name, color, client_id')
    .eq('agency_id', agencyId)
    .order('name')

  return (
    <ProjectsClient
      projects={projects || []}
      clients={clients || []}
      groups={groups || []}
      agencyId={agencyId}
      currentUserId={user.id}
      currentClientId={clientId || ''}
      isAdmin={profile?.role === 'admin' || profile?.role === 'manager' || profile?.role === 'super_admin'}
    />
  )
}
