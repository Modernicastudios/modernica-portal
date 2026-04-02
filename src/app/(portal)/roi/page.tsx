import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RoiClient from './RoiClient'

export default async function RoiPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, agencies(*)')
    .eq('id', user.id)
    .single()

  const agencyId = profile?.agency_id || ''
  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'
  const isClient = profile?.role === 'client'

  if (isClient) redirect('/dashboard')

  let clientsQuery = supabase
    .from('clients')
    .select('id, company_name')
    .eq('agency_id', agencyId)

  let roiQuery = supabase
    .from('roi_entries')
    .select('*, clients(company_name)')
    .eq('agency_id', agencyId)
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  if (isClient && profile?.client_id) {
    roiQuery = roiQuery.eq('client_id', profile.client_id)
  }

  const [clientsResult, roiResult] = await Promise.all([
    isAdmin ? clientsQuery : Promise.resolve({ data: [] }),
    roiQuery,
  ])

  const clients = clientsResult.data || []
  const entries = roiResult.data || []

  return (
    <RoiClient
      entries={entries}
      clients={isAdmin ? clients : []}
      agencyId={agencyId}
      isAdmin={isAdmin}
      clientId={profile?.client_id || ''}
    />
  )
}
