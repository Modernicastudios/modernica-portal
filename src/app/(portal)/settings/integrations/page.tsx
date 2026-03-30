import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import IntegrationsClient from './IntegrationsClient'

export default async function IntegrationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
  if (profile?.role === 'client') redirect('/dashboard')

  const agencyId = profile?.agency_id || ''

  const [{ data: socialAccounts }, { data: adAccounts }] = await Promise.all([
    supabase.from('social_accounts').select('*').eq('agency_id', agencyId),
    supabase.from('ad_accounts').select('*').eq('agency_id', agencyId),
  ])

  return (
    <IntegrationsClient
      socialAccounts={socialAccounts || []}
      adAccounts={adAccounts || []}
      agencyId={agencyId}
      userId={user.id}
    />
  )
}
