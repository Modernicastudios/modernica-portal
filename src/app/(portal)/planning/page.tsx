import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PlanningClient from './PlanningClient'

export default async function PlanningPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, agencies(*)')
    .eq('id', user.id)
    .single()

  const agencyId: string = profile?.agency_id || ''
  const isAdmin: boolean = profile?.role === 'admin' || profile?.role === 'manager'
  const isClient: boolean = !!profile?.client_id

  const [
    { data: postsRaw },
    { data: projectsRaw },
    { data: meetingsRaw },
  ] = await Promise.all([
    supabase
      .from('content_posts')
      .select('id,title,platform,scheduled_at,status,client_id,clients(company_name)')
      .eq('agency_id', agencyId)
      .not('scheduled_at', 'is', null)
      .order('scheduled_at', { ascending: true }),
    supabase
      .from('projects')
      .select('id,title,status,deadline,client_id,clients(company_name)')
      .eq('agency_id', agencyId)
      .not('deadline', 'is', null)
      .order('deadline', { ascending: true }),
    supabase
      .from('meeting_notes')
      .select('id,title,meeting_date,status,client_id,clients(company_name)')
      .eq('agency_id', agencyId)
      .order('meeting_date', { ascending: true }),
  ])

  let posts = postsRaw || []
  let projects = projectsRaw || []
  let meetings = meetingsRaw || []

  if (isClient && !isAdmin) {
    const cid = profile.client_id
    posts = posts.filter((p: any) => p.client_id === cid)
    projects = projects.filter((p: any) => p.client_id === cid)
    meetings = meetings.filter((m: any) => m.client_id === cid)
  }

  return (
    <PlanningClient
      posts={posts as any}
      projects={projects as any}
      meetings={meetings as any}
      isAdmin={isAdmin}
      clientId={profile?.client_id || ''}
    />
  )
}
