import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ApproveClient from './ApproveClient'

export default async function ApprovePage() {
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
  const isClient = !!profile?.client_id

  let postsQuery = supabase
    .from('content_posts')
    .select('*, share_token, clients(company_name)')
    .eq('agency_id', agencyId)
    .eq('status', 'pending_approval')
    .order('created_at', { ascending: false })

  if (isClient && profile?.client_id) {
    postsQuery = postsQuery.eq('client_id', profile.client_id)
  }

  const [postsResult, clientsResult] = await Promise.all([
    postsQuery,
    isAdmin
      ? supabase.from('clients').select('id, company_name').eq('agency_id', agencyId)
      : Promise.resolve({ data: [] }),
  ])

  const posts = postsResult.data || []
  const clients = clientsResult.data || []

  return (
    <ApproveClient
      posts={posts}
      clients={isAdmin ? clients : []}
      isAdmin={isAdmin}
      clientId={profile?.client_id || ''}
      userId={user.id}
      agencyId={agencyId}
    />
  )
}
