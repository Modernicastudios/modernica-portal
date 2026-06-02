import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SocialAnalyticsClient from './SocialAnalyticsClient'

export default async function SocialAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const agencyId = profile?.agency_id || ''
  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager' || profile?.role === 'super_admin'
  const isClient = !!profile?.client_id

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  let postsQuery = supabase
    .from('content_posts')
    .select('id, platform, status, scheduled_at, content_type, created_at')
    .eq('agency_id', agencyId)
    .gte('created_at', sixMonthsAgo.toISOString())
    .order('scheduled_at', { ascending: false })

  if (isClient && profile?.client_id) {
    postsQuery = postsQuery.eq('client_id', profile.client_id)
  }

  const { data: posts } = await postsQuery

  return (
    <SocialAnalyticsClient
      posts={posts || []}
      isAdmin={isAdmin}
      clientId={profile?.client_id || ''}
    />
  )
}
