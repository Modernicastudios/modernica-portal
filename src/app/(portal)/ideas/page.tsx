import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import IdeasClient from './IdeasClient'

export default async function IdeasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, agencies(*)')
    .eq('id', user.id)
    .single()

  const agencyId = profile?.agency_id || ''
  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager' || profile?.role === 'super_admin'

  // Clients have no access to ideas board — redirect to their workspace
  if (profile?.role === 'client') redirect('/dashboard')

  const { data: ideas } = await supabase
    .from('content_posts')
    .select('*, clients(company_name)')
    .eq('agency_id', agencyId)
    .eq('status', 'idea')
    .order('created_at', { ascending: false })

  const { data: clients } = await supabase
    .from('clients')
    .select('id, company_name')
    .eq('agency_id', agencyId)

  return (
    <IdeasClient
      ideas={ideas || []}
      clients={clients || []}
      agencyId={agencyId}
      isAdmin={isAdmin}
    />
  )
}
