import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TakenClient from './TakenClient'

export default async function TakenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const agencyId: string = profile.agency_id || ''
  const isAdmin = profile.role === 'admin' || profile.role === 'manager'

  // Query 1: todos linked to projects
  const { data: projectTodos } = await supabase
    .from('project_todos')
    .select('id,title,description,done,due_date,priority,created_at,project_id,meeting_id,projects!inner(id,title,agency_id,client_id,clients(company_name))')
    .eq('projects.agency_id', agencyId)

  // Query 2: todos linked to meeting_notes (no project)
  const { data: meetingTodos } = await supabase
    .from('project_todos')
    .select('id,title,description,done,due_date,priority,created_at,project_id,meeting_id,meeting_notes!inner(id,title,agency_id)')
    .eq('meeting_notes.agency_id', agencyId)
    .is('project_id', null)

  // Merge and deduplicate
  const allTodos = [...(projectTodos || []), ...(meetingTodos || [])]
  const seen = new Set<string>()
  const todos = allTodos.filter((t) => {
    if (seen.has(t.id)) return false
    seen.add(t.id)
    return true
  })

  // Projects list for filter dropdown
  const { data: projects } = await supabase
    .from('projects')
    .select('id,title,clients(company_name)')
    .eq('agency_id', agencyId)
    .eq('archived', false)
    .limit(50)

  // Meeting notes for context
  const { data: meetings } = await supabase
    .from('meeting_notes')
    .select('id,title')
    .eq('agency_id', agencyId)
    .limit(20)

  return (
    <TakenClient
      todos={todos as any[]}
      projects={(projects || []) as any[]}
      meetings={(meetings || []) as any[]}
      agencyId={agencyId}
      isAdmin={isAdmin}
    />
  )
}
