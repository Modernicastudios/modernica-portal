'use client'

// Supabase Realtime hook: subscribes to the `notifications` table for the
// current user and returns live unread count + notification list.
// Usage: const { unread, notifications, markRead } = useRealtimeNotifications(userId)

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Notification {
  id: string
  type: string
  title: string
  message: string | null
  link: string | null
  read: boolean
  created_at: string
}

export function useRealtimeNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const supabase = createClient()

  const fetchAll = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('notifications')
      .select('id, type, title, message, link, read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifications(data ?? [])
  }, [userId, supabase])

  useEffect(() => {
    if (!userId) return
    void fetchAll()

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new as Notification, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev =>
              prev.map(n => n.id === payload.new.id ? { ...n, ...payload.new as Notification } : n)
            )
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [userId, fetchAll, supabase])

  const markRead = useCallback(async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [supabase])

  const markAllRead = useCallback(async () => {
    if (!userId) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [userId, supabase])

  const unread = notifications.filter(n => !n.read).length

  return { notifications, unread, markRead, markAllRead, refresh: fetchAll }
}
