import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SocialAnalyticsClient from './SocialAnalyticsClient'

export default async function SocialAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
  const agencyId = profile?.agency_id || ''

  const { data: socialAccounts } = await supabase
    .from('social_accounts')
    .select('*, social_metrics(date, followers, reach, impressions, engagement_rate)')
    .eq('agency_id', agencyId)
    .eq('is_active', true)

  return <SocialAnalyticsClient accounts={socialAccounts || []} agencyId={agencyId} />
}
