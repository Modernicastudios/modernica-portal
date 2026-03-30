import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AgencySettingsClient from './AgencySettingsClient'

export default async function AgencySettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
  if (profile?.role === 'client') redirect('/dashboard')

  const agencyId = profile?.agency_id || ''

  const [{ data: agency }, { data: brandKit }] = await Promise.all([
    supabase.from('agencies').select('*').eq('id', agencyId).single(),
    supabase.from('brand_kits').select('*').eq('agency_id', agencyId).single(),
  ])

  return <AgencySettingsClient agency={agency} brandKit={brandKit} agencyId={agencyId} />
}
