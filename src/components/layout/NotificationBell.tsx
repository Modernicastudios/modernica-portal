'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  type: string
  title: string
  message: string | null
  link: string | null
  read: boolean
  created_at: string
}

const TYPE_ICONS: Record<string, string> = {
  approved: '✅',
  rejected: '❌',
  pending_approval: '⏳',
  deadline: '🚨',
  project_update: '📋',
  new_message: '💬',
  default: '🔔',
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    loadNotifications()

    // Realtime subscription
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, payload => {
        setNotifications(prev => [payload.new as Notification, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function loadNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)
    setNotifications(data || [])
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  async function handleNotificationClick(n: Notification) {
    if (!n.read) {
      await supabase.from('notifications').update({ read: true }).eq('id', n.id)
      setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif))
    }
    setOpen(false)
    if (n.link) router.push(n.link)
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Zojuist'
    if (mins < 60) return `${mins}m geleden`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}u geleden`
    const days = Math.floor(hours / 24)
    return `${days}d geleden`
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '38px', height: '38px', borderRadius: '50%', border: '1px solid var(--border)',
          background: open ? 'rgba(26,63,228,.08)' : 'var(--card)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem', position: 'relative', transition: 'all .15s',
        }}
        title="Notificaties"
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: '-3px', right: '-3px',
            width: '18px', height: '18px', borderRadius: '50%',
            background: '#e53935', color: '#fff', fontSize: '.65rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
          width: '360px', background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: '12px', boxShadow: '0 8px 40px rgba(0,0,0,.15)', zIndex: 200,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.92rem' }}>
              Notificaties {unread > 0 && <span style={{ background: '#e53935', color: '#fff', borderRadius: '50px', fontSize: '.65rem', padding: '1px 7px', marginLeft: '6px' }}>{unread}</span>}
            </span>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ fontSize: '.72rem', color: 'var(--accent1)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Alles gelezen
              </button>
            )}
          </div>

          {/* Notifications list */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔔</div>
                <div style={{ fontSize: '.85rem' }}>Geen notificaties</div>
              </div>
            ) : notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                style={{
                  padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                  background: n.read ? 'transparent' : 'rgba(26,63,228,.04)',
                  transition: 'background .1s', display: 'flex', gap: '12px', alignItems: 'flex-start',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = n.read ? 'transparent' : 'rgba(26,63,228,.04)'}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                  background: n.read ? 'var(--bg)' : 'rgba(26,63,228,.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                }}>
                  {TYPE_ICONS[n.type] || TYPE_ICONS.default}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: n.read ? 400 : 700, fontSize: '.85rem', marginBottom: '2px', color: 'var(--text)' }}>
                    {n.title}
                  </div>
                  {n.message && (
                    <div style={{ fontSize: '.75rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.message}
                    </div>
                  )}
                  <div style={{ fontSize: '.68rem', color: 'var(--muted)', marginTop: '3px' }}>
                    {timeAgo(n.created_at)}
                  </div>
                </div>
                {!n.read && (
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent1)', flexShrink: 0, marginTop: '4px' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
