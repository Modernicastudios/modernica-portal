import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ComposeClient from './ComposeClient'

export default async function ComposePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
  if (profile?.role === 'client') redirect('/content')

  const agencyId = profile?.agency_id || ''

  const [{ data: socialAccounts }, { data: clients }, { data: mediaAssets }] = await Promise.all([
    supabase.from('social_accounts').select('*').eq('agency_id', agencyId).eq('is_active', true),
    supabase.from('clients').select('id, company_name').eq('agency_id', agencyId),
    supabase.from('media_assets').select('*').eq('agency_id', agencyId).order('created_at', { ascending: false }).limit(50),
  ])

  return (
    <ComposeClient
      socialAccounts={socialAccounts || []}
      clients={clients || []}
      mediaAssets={mediaAssets || []}
      agencyId={agencyId}
      userId={user.id}
    />
  )
}
