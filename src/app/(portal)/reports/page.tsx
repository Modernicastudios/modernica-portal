import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReportsClient from './ReportsClient'

export default async function ReportsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, agencies(*)')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'
  const agencyId = profile?.agency_id

  if (profile?.role === 'client') redirect('/dashboard')

  const [
    { count: clientCount },
    { data: projects },
    { data: contentPosts },
    socialAccountsResult,
  ] = await Promise.all([
    supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', agencyId || ''),
    supabase
      .from('projects')
      .select('id,status,category,created_at,title,clients(company_name)')
      .eq('agency_id', agencyId || ''),
    supabase
      .from('content_posts')
      .select('id,status,platform,scheduled_at,created_at,title')
      .eq('agency_id', agencyId || ''),
    agencyId
      ? supabase
          .from('social_accounts')
          .select('*')
          .eq('agency_id', agencyId)
      : Promise.resolve({ data: [] as any[], error: null }),
  ])

  return (
    <ReportsClient
      projects={projects || []}
      posts={contentPosts || []}
      clients={{ count: clientCount || 0 }}
      agency={profile?.agencies}
    />
  )
}
