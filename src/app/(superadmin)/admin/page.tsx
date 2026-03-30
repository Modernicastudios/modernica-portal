import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminClient from './AdminClient'

const SUPER_ADMIN_EMAIL = 'info@modernicastudios.com'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (user.email !== SUPER_ADMIN_EMAIL) redirect('/dashboard')

  const [
    { data: agencies, count: agencyCount },
    { data: recentUsers },
    { data: recentSignups },
  ] = await Promise.all([
    supabase.from('agencies').select('*', { count: 'exact' }).order('created_at', { ascending: false }),
    supabase.from('user_profiles').select('*, agencies(name)').order('created_at', { ascending: false }).limit(20),
    supabase.from('agencies').select('*').order('created_at', { ascending: false }).limit(10),
  ])

  return (
    <AdminClient
      agencies={agencies || []}
      agencyCount={agencyCount || 0}
      recentUsers={recentUsers || []}
      recentSignups={recentSignups || []}
    />
  )
}
