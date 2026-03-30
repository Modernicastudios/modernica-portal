import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

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

  // Build CSS custom properties for white-label theming
  const themeVars = brandKit ? {
    '--accent1': brandKit.primary_color || '#1a3fe4',
    '--accent2': brandKit.secondary_color || '#4f7bff',
  } : {}

  return (
    <div
      className="shell"
      style={{
        display: 'flex',
        minHeight: '100vh',
        ...themeVars,
      }}
    >
      <Sidebar profile={profile} agency={agency} brandKit={brandKit} />
      <div style={{ marginLeft: 'var(--sidebar-width)', flex: 1, minHeight: '100vh', overflow: 'hidden' }}>
        <Header profile={profile} agency={agency} />
        <main style={{ padding: '32px', animation: 'fadeUp 0.3s ease' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
