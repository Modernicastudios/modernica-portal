import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientWorkspaceClient from './ClientWorkspaceClient'

export default async function ClientWorkspacePage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
  const agencyId = profile?.agency_id || ''

  // Clients have no access to the client workspace management pages
  if (profile?.role === 'client') redirect('/dashboard')

  const [
    { data: client },
    { data: projects },
    { data: tasks },
    { data: teamMembers },
  ] = await Promise.all([
    supabase.from('clients').select('*').eq('id', clientId).eq('agency_id', agencyId).single(),
    supabase
      .from('projects')
      .select('*, project_todos(id, done)')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false }),
    supabase
      .from('client_tasks')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('user_profiles').select('id, full_name').eq('agency_id', agencyId),
  ])

  if (!client) redirect('/clients')

  return (
    <ClientWorkspaceClient
      client={client}
      projects={projects || []}
      tasks={tasks || []}
      teamMembers={teamMembers || []}
      agencyId={agencyId}
      currentUserId={user.id}
      isAdmin={profile?.role !== 'client'}
    />
  )
}
