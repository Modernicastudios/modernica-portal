import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import PortalShell from '@/components/layout/PortalShell'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Admin client bypasses RLS — profiel moet altijd leesbaar zijn
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Alleen redirect als profiel echt ontbreekt
  if (!profile) redirect('/login')

  // Agency via admin — bypasses RLS
  const { data: agency } = await admin
    .from('agencies')
    .select('*, brand_kits(*)')
    .eq('id', profile.agency_id)
    .single()

  const brandKit = (agency as any)?.brand_kits?.[0] || null

  // Clients voor global filter
  const { data: clients } = await supabase
    .from('clients')
    .select('id, agency_id, company_name, industry, city, contact_email, created_at')
    .eq('agency_id', profile.agency_id)
    .order('company_name')

  const themeVars = brandKit ? {
    '--accent1': brandKit.primary_color || '#1a3fe4',
    '--accent2': brandKit.secondary_color || '#4f7bff',
  } : {}

  return (
    <div style={themeVars as React.CSSProperties}>
      <PortalShell
        profile={{ ...profile, agencies: agency }}
        agency={agency || null}
        brandKit={brandKit}
        userId={user.id}
        clients={clients || []}
      >
        {children}
      </PortalShell>
    </div>
  )
}
