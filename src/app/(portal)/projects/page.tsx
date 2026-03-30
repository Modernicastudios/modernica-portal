import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProjectsClient from './ProjectsClient'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()

  const agencyId = profile?.agency_id || ''
  const clientId = profile?.client_id

  // Clients only see their own projects
  const query = supabase
    .from('projects')
    .select('*, clients(company_name), project_todos(id, done)')
    .order('created_at', { ascending: false })

  if (clientId) {
    query.eq('client_id', clientId)
  } else {
    query.eq('agency_id', agencyId)
  }

  const { data: projects } = await query

  const { data: clients } = await supabase
    .from('clients')
    .select('id, company_name')
    .eq('agency_id', agencyId)

  return (
    <ProjectsClient
      projects={projects || []}
      clients={clients || []}
      agencyId={agencyId}
      currentUserId={user.id}
      isAdmin={profile?.role === 'admin' || profile?.role === 'manager'}
    />
  )
}
