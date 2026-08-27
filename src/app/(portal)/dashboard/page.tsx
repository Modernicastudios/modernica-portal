import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

// Revalidate every 60 seconds — dashboard data changes, but caching for 1 min
// is fine and makes navigating back to the dashboard instant.
export const revalidate = 60

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, agencies(*)')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager' || profile?.role === 'super_admin'
  const agencyId = profile?.agency_id || ''
  const clientId = profile?.client_id || null

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)
  const in7days = new Date()
  in7days.setDate(in7days.getDate() + 7)

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    { data: pendingPosts },
    { data: todayPosts },
    { data: upcomingPosts },
    { data: activeProjects },
    { data: openTasks },
    { data: todayMeetings },
    { data: brandKitRow },
    { data: roiEntries },
    { data: platformPostsRaw },
  ] = await Promise.all([
    // Pending approvals — fetch records so we can filter by client_id client-side
    (() => {
      let q = supabase
        .from('content_posts')
        .select('id, client_id')
        .eq('agency_id', agencyId)
        .eq('status', 'pending_approval')
      if (clientId) q = q.eq('client_id', clientId) as typeof q
      return q
    })(),

    // Posts vandaag
    (() => {
      let q = supabase
        .from('content_posts')
        .select('id, title, platform, scheduled_at, status, client_id, clients(company_name)')
        .eq('agency_id', agencyId)
        .gte('scheduled_at', todayStart.toISOString())
        .lte('scheduled_at', todayEnd.toISOString())
        .order('scheduled_at', { ascending: true })
      if (clientId) q = q.eq('client_id', clientId) as typeof q
      return q
    })(),

    // Komende posts (morgen t/m 7 dagen)
    (() => {
      let q = supabase
        .from('content_posts')
        .select('id, title, platform, scheduled_at, status, client_id, clients(company_name)')
        .eq('agency_id', agencyId)
        .gt('scheduled_at', todayEnd.toISOString())
        .lte('scheduled_at', in7days.toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(20)
      if (clientId) q = q.eq('client_id', clientId) as typeof q
      return q
    })(),

    // Actieve projecten
    (() => {
      let q = supabase
        .from('projects')
        .select('id, title, status, priority, client_id, clients(company_name)')
        .eq('agency_id', agencyId)
        .in('status', ['in_progress', 'waiting_feedback', 'review', 'blocked'])
        .order('updated_at', { ascending: false })
        .limit(20)
      if (clientId) q = q.eq('client_id', clientId) as typeof q
      return q
    })(),

    // Open taken
    (() => {
      let q = supabase
        .from('project_todos')
        .select('id, title, projects!inner(id, title, agency_id, client_id, clients(company_name))')
        .eq('done', false)
        .eq('projects.agency_id', agencyId)
        .limit(20)
      return q
    })(),

    // Vergaderingen vandaag
    supabase
      .from('meeting_notes')
      .select('id, title, meeting_date, status')
      .eq('agency_id', agencyId)
      .gte('meeting_date', todayStart.toISOString())
      .lte('meeting_date', todayEnd.toISOString()),

    // Brand kit (voor setup banner)
    supabase
      .from('brand_kits')
      .select('logo_url')
      .eq('agency_id', agencyId)
      .maybeSingle(),

    // ROI entries last 3 months
    supabase
      .from('roi_entries')
      .select('platform, ad_spend, revenue, leads, month, year, client_id')
      .eq('agency_id', agencyId)
      .gte('year', threeMonthsAgo.getFullYear())
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(20),

    // Content posts platform breakdown last 30 days
    supabase
      .from('content_posts')
      .select('platform, client_id')
      .eq('agency_id', agencyId)
      .eq('status', 'published')
      .gte('scheduled_at', thirtyDaysAgo.toISOString()),
  ])

  const showSetupBanner = isAdmin && !brandKitRow?.logo_url
  const firstName = profile?.full_name?.split(' ')[0] || 'daar'
  const dayName = new Date().toLocaleDateString('nl-NL', { weekday: 'long' })
  const dateStr = new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <DashboardClient
      firstName={firstName}
      dayName={dayName}
      dateStr={dateStr}
      isAdmin={isAdmin}
      showSetupBanner={showSetupBanner}
      pendingPosts={(pendingPosts || []) as any[]}
      todayPosts={(todayPosts || []) as any[]}
      upcomingPosts={(upcomingPosts || []) as any[]}
      activeProjects={(activeProjects || []) as any[]}
      openTasks={(openTasks || []) as any[]}
      todayMeetings={(todayMeetings || []) as any[]}
      roiEntries={(roiEntries || []) as any[]}
      platformPostsRaw={(platformPostsRaw || []) as any[]}
      currentMonth={currentMonth}
      currentYear={currentYear}
    />
  )
}
