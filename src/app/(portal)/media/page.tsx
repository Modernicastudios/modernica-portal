import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MediaClient from './MediaClient'

export default async function MediaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, agencies(*)')
    .eq('id', user.id)
    .single()

  const agencyId = profile?.agency_id

  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'

  const { data: assets } = await supabase
    .from('media_assets')
    .select('*, clients(company_name)')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('agency_id', agencyId)
    .order('company_name')

  return (
    <MediaClient
      assets={assets || []}
      clients={clients || []}
      agencyId={agencyId || ''}
      userId={user.id}
      isAdmin={isAdmin}
    />
  )
}
