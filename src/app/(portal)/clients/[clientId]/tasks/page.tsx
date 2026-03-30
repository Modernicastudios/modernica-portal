import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientTasksClient from './ClientTasksClient'

export default async function ClientTasksPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
  const agencyId = profile?.agency_id || ''

  const [{ data: client }, { data: tasks }, { data: teamMembers }] = await Promise.all([
    supabase.from('clients').select('*').eq('id', clientId).single(),
    supabase.from('client_tasks')
      .select('*, user_profiles!created_by(full_name), assignee:user_profiles!assigned_to(full_name)')
      .eq('client_id', clientId)
      .order('sort_order')
      .order('created_at'),
    supabase.from('user_profiles').select('id, full_name').eq('agency_id', agencyId),
  ])

  if (!client) redirect('/clients')

  return (
    <ClientTasksClient
      client={client}
      tasks={tasks || []}
      teamMembers={teamMembers || []}
      agencyId={agencyId}
      currentUserId={user.id}
      currentUserName={profile?.full_name || 'Gebruiker'}
      isAdmin={profile?.role !== 'client'}
    />
  )
}
