import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingClient from './OnboardingClient'

export default async function OnboardingPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, agencies(*, brand_kits(*))')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Only admins can access onboarding
  if (profile.role !== 'admin') redirect('/dashboard')

  const agency = profile.agencies || null

  if (!agency) redirect('/dashboard')

  // Check if agency already has a logo (brand kit with logo_url)
  const brandKit = agency.brand_kits?.[0] || null
  const hasLogo = !!(brandKit?.logo_url)

  // Check if there are existing clients
  const { count: clientCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('agency_id', agency.id)

  // If already set up, redirect to dashboard
  if (hasLogo && (clientCount ?? 0) > 0) {
    redirect('/dashboard')
  }

  return (
    <OnboardingClient
      agency={agency}
      userId={user.id}
      agencyId={agency.id}
    />
  )
}
