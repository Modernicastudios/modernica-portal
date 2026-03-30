'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  conversations: any[]
  agencyId: string
  currentUserId: string
  currentUserName: string
  isAdmin: boolean
}

export default function ChatClient({ conversations: initialConvs, agencyId, currentUserId, currentUserName, isAdmin }: Props) {
  const [conversations, setConversations] = useState(initialConvs)
  const [activeConvId, setActiveConvId] = useState<string | null>(initialConvs[0]?.id || null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const activeConv = conversations.find(c => c.id === activeConvId)

  useEffect(() => {
    if (!activeConvId) return
    loadMessages(activeConvId)

    // Realtime subscription
    const channel = supabase
      .channel(`messages:${activeConvId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeConvId}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeConvId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadMessages(convId: string) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at')
    setMessages(data || [])
  }

  async function sendMessage() {
    if (!newMessage.trim() || !activeConvId) return
    setSending(true)
    await supabase.from('messages').insert({
      conversation_id: activeConvId,
      sender_id: currentUserId,
      sender_name: currentUserName,
      content: newMessage.trim(),
    })
    setNewMessage('')
    setSending(false)
  }

  async function createConversation() {
    const title = prompt('Naam van de conversatie:')
    if (!title) return
    const { data } = await supabase
      .from('conversations')
      .insert({ agency_id: agencyId, title })
      .select('*, clients(company_name), messages(id)')
      .single()
    if (data) {
      setConversations(prev => [data, ...prev])
      setActiveConvId(data.id)
    }
  }

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
  const formatDate = (ts: string) => new Date(ts).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })

  return (
    <div style={{ display: 'flex', gap: '0', height: 'calc(100vh - 130px)', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: '0 2px 12px rgba(26,63,228,.06)' }}>
      {/* Conversation list */}
      <div style={{ width: '280px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.95rem' }}>Berichten</span>
          {isAdmin && (
            <button onClick={createConversation} style={{ background: 'var(--accent1)', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          )}
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {conversations.map(conv => {
            const lastMsg = conv.messages?.[conv.messages.length - 1]
            return (
              <div
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                style={{
                  padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                  background: activeConvId === conv.id ? 'rgba(26,63,228,.06)' : 'none',
                  borderLeft: activeConvId === conv.id ? '3px solid var(--accent1)' : '3px solid transparent',
                  transition: 'background .15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 600, fontSize: '.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {conv.title || conv.clients?.company_name || 'Conversatie'}
                  </div>
                  {lastMsg && <div style={{ fontSize: '.68rem', color: 'var(--muted)', flexShrink: 0, marginLeft: '8px' }}>{formatDate(lastMsg.created_at)}</div>}
                </div>
                {lastMsg && (
                  <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lastMsg.content}
                  </div>
                )}
              </div>
            )
          })}
          {conversations.length === 0 && (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: '.85rem' }}>
              Nog geen berichten
            </div>
          )}
        </div>
      </div>

      {/* Message thread */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeConv ? (
          <>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700 }}>
              {activeConv.title || activeConv.clients?.company_name || 'Conversatie'}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map(msg => {
                const isMe = msg.sender_id === currentUserId
                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: '8px', alignItems: 'flex-end' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                      background: isMe ? 'var(--accent1)' : 'var(--card2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '.65rem', fontWeight: 700, color: isMe ? '#fff' : 'var(--muted)',
                    }}>
                      {(msg.sender_name || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ maxWidth: '65%' }}>
                      {!isMe && <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginBottom: '4px' }}>{msg.sender_name}</div>}
                      <div style={{
                        padding: '10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: isMe ? 'var(--accent1)' : 'var(--card2)',
                        color: isMe ? '#fff' : 'var(--text)',
                        fontSize: '.88rem', lineHeight: 1.5,
                      }}>
                        {msg.content}
                      </div>
                      <div style={{ fontSize: '.68rem', color: 'var(--muted)', marginTop: '4px', textAlign: isMe ? 'right' : 'left' }}>
                        {formatTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px' }}>
              <textarea
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="Typ een bericht... (Enter om te sturen)"
                rows={1}
                style={{
                  flex: 1, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  fontSize: '.88rem', background: 'var(--bg)', outline: 'none', resize: 'none', fontFamily: 'inherit',
                }}
              />
              <button
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
                style={{
                  background: 'var(--accent1)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
                  padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '.88rem',
                  opacity: sending || !newMessage.trim() ? .6 : 1,
                }}
              >
                Sturen
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>💬</div>
              <div style={{ fontWeight: 600 }}>Selecteer een conversatie</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
