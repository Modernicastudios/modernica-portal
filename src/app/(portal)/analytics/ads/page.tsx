import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdsClient from './AdsClient'

export default async function AdsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const agencyId = profile?.agency_id || ''
  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'
  const isClient = !!profile?.client_id

  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

  let roiQuery = supabase
    .from('roi_entries')
    .select('*, clients(company_name)')
    .eq('agency_id', agencyId)
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  if (isClient && profile?.client_id) {
    roiQuery = roiQuery.eq('client_id', profile.client_id)
  }

  const [roiResult, clientsResult] = await Promise.all([
    roiQuery,
    isAdmin
      ? supabase.from('clients').select('id, company_name').eq('agency_id', agencyId)
      : Promise.resolve({ data: [] }),
  ])

  const entries = roiResult.data || []
  const clients = clientsResult.data || []

  return (
    <AdsClient
      entries={entries}
      clients={isAdmin ? clients : []}
      isAdmin={isAdmin}
      clientId={profile?.client_id || ''}
    />
  )
}
