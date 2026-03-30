import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

const SUPER_ADMIN_EMAIL = 'info@modernicastudios.com'

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (user.email !== SUPER_ADMIN_EMAIL) redirect('/dashboard')

  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar profile={{ ...profile, email: user.email }} agency={null} brandKit={null} />
      <div style={{ flex: 1, marginLeft: 'var(--sidebar-width)', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header profile={profile as any} agency={null} userId={user.id} />
        <main style={{ flex: 1, padding: '32px 40px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
