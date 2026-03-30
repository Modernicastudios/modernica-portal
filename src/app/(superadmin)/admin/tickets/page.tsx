import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TicketsClient from './TicketsClient'

const SUPER_ADMIN_EMAIL = 'info@modernicastudios.com'

export default async function TicketsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (user.email !== SUPER_ADMIN_EMAIL) redirect('/dashboard')

  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('*, agencies(name), user_profiles(full_name, email)')
    .order('created_at', { ascending: false })

  return <TicketsClient tickets={tickets || []} />
}
