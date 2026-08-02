import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import PipelineClient from './PipelineClient'

export default async function PipelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin.from('user_profiles').select('*').eq('id', user.id).single()
  if (!profile?.agency_id) redirect('/dashboard')

  const { data: outreach } = await admin
    .from('lead_outreach')
    .select('*, lead_companies(*), lead_contacts(*)')
    .eq('agency_id', profile.agency_id)
    .order('updated_at', { ascending: false })
    .limit(500)

  return <PipelineClient leads={outreach || []} />
}
