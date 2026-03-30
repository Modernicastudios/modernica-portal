import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChatClient from './ChatClient'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
  const agencyId = profile?.agency_id || ''

  const { data: conversations } = await supabase
    .from('conversations')
    .select('*, clients(company_name), messages(id, content, created_at, sender_name)')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })

  return <ChatClient conversations={conversations || []} agencyId={agencyId} currentUserId={user.id} currentUserName={profile?.full_name || 'Gebruiker'} isAdmin={profile?.role !== 'client'} />
}
