import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdsClient from './AdsClient'

export default async function AdsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
  const agencyId = profile?.agency_id || ''

  const [{ data: adAccounts }, { data: campaigns }] = await Promise.all([
    supabase.from('ad_accounts').select('*').eq('agency_id', agencyId).eq('is_active', true),
    supabase.from('ad_campaigns')
      .select('*, ad_metrics(*), ad_accounts(platform, platform_account_name)')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  return <AdsClient adAccounts={adAccounts || []} campaigns={campaigns || []} agencyId={agencyId} />
}
