import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ContentClient from './ContentClient'

export default async function ContentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
  const agencyId = profile?.agency_id || ''
  const isClient = profile?.role === 'client'
  const clientId = profile?.client_id || null

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

  let postsQuery = supabase
    .from('content_posts')
    .select('*, share_token, clients(company_name)')
    .eq('agency_id', agencyId)
    .gte('scheduled_at', startOfMonth)
    .lte('scheduled_at', endOfMonth)
    .order('scheduled_at')

  // Clients only see their own posts
  if (isClient && clientId) {
    postsQuery = postsQuery.eq('client_id', clientId) as typeof postsQuery
  }

  const { data: posts } = await postsQuery

  const { data: clients } = isClient
    ? { data: [] }
    : await supabase.from('clients').select('id, company_name').eq('agency_id', agencyId)

  return <ContentClient posts={posts || []} clients={clients || []} agencyId={agencyId} isAdmin={!isClient} />
}
