import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PortalShell from '@/components/layout/PortalShell'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, agencies(*, brand_kits(*))')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const brandKit = profile.agencies?.brand_kits?.[0] || null
  const agency = profile.agencies || null

  // Fetch clients for the agency (for client filter)
  const { data: clients } = await supabase
    .from('clients')
    .select('id, agency_id, company_name, industry, city, contact_email, created_at')
    .eq('agency_id', profile.agency_id || '')
    .order('company_name')

  // Build CSS custom properties for white-label theming
  const themeVars = brandKit ? {
    '--accent1': brandKit.primary_color || '#1a3fe4',
    '--accent2': brandKit.secondary_color || '#4f7bff',
  } : {}

  return (
    <div style={themeVars as React.CSSProperties}>
      <PortalShell
        profile={profile}
        agency={agency}
        brandKit={brandKit}
        userId={user.id}
        clients={clients || []}
      >
        {children}
      </PortalShell>
    </div>
  )
}
