import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import TicketsClient from './TicketsClient'

const SUPER_ADMIN_EMAIL = 'info@modernicastudios.com'

export default async function TicketsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (user.email !== SUPER_ADMIN_EMAIL) redirect('/dashboard')

  // Service-role: tickets van álle agencies tonen (RLS beperkt anders op eigen agency).
  const admin = createAdminClient()
  const { data: tickets } = await admin
    .from('support_tickets')
    .select('*, agencies(name), user_profiles(full_name, email)')
    .order('created_at', { ascending: false })

  return <TicketsClient tickets={tickets || []} />
}
