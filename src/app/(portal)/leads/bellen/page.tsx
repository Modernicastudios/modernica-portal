import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import BellenClient from './BellenClient'

export default async function BellenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin.from('user_profiles').select('*').eq('id', user.id).single()
  if (!profile?.agency_id) redirect('/dashboard')

  return <BellenClient userName={profile.full_name || 'Jij'} userId={profile.id} />
}
