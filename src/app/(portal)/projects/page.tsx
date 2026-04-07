import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProjectsClient from './ProjectsClient'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()

  const agencyId = profile?.agency_id || ''
  const clientId = profile?.client_id

  // Clients only see their own projects
  let query = supabase
    .from('projects')
    .select('*, clients!client_id(company_name), project_groups!group_id(id, name, color), project_todos(id, done)')
    .order('created_at', { ascending: false })

  if (clientId) {
    query = query.eq('client_id', clientId) as typeof query
  } else {
    query = query.eq('agency_id', agencyId) as typeof query
  }

  const { data: projects } = await query

  const { data: clients } = await supabase
    .from('clients')
    .select('id, company_name')
    .eq('agency_id', agencyId)

  const { data: groups } = await supabase
    .from('project_groups')
    .select('id, name, color, client_id')
    .eq('agency_id', agencyId)
    .order('name')

  const { data: agency } = await supabase
    .from('agencies')
    .select('project_categories, project_statuses')
    .eq('id', agencyId)
    .single()

  const defaultCategories = ['Paid Ads', 'Social', 'Content', 'SEO', 'Design', 'Strategy', 'Development']
  const categories: string[] = agency?.project_categories || defaultCategories

  const defaultStatuses = [
    { key: 'backlog',          label: 'Backlog',             color: '#6b7280', strip: '#d1d5db' },
    { key: 'in_progress',      label: 'In uitvoering',       color: '#1a3fe4', strip: '#1a3fe4' },
    { key: 'waiting_feedback', label: 'Wachten op reactie',  color: '#ff7a30', strip: '#ff7a30' },
    { key: 'needs_response',   label: 'Antwoord geven',      color: '#0ea5e9', strip: '#0ea5e9' },
    { key: 'blocked',          label: 'Geblokkeerd',         color: '#e53935', strip: '#e53935' },
    { key: 'review',           label: 'Review',              color: '#9c27b0', strip: '#9c27b0' },
    { key: 'approved',         label: 'Goedgekeurd',         color: '#00b89c', strip: '#00b89c' },
    { key: 'archived',         label: 'Archief',             color: '#9ca3af', strip: '#9ca3af' },
  ]
  const statuses = agency?.project_statuses || defaultStatuses

  return (
    <ProjectsClient
      projects={projects || []}
      clients={clients || []}
      groups={groups || []}
      agencyId={agencyId}
      currentUserId={user.id}
      currentClientId={clientId || ''}
      isAdmin={profile?.role === 'admin' || profile?.role === 'manager' || profile?.role === 'super_admin'}
      categories={categories}
      statuses={statuses}
    />
  )
}
