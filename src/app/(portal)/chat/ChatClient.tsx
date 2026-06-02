'use client'

import { useState, useEffect, useRef, CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, Search, MoreHorizontal, Send, Paperclip,
  MessageSquare, ChevronDown, Sparkles,
} from 'lucide-react'

interface Props {
  conversations: any[]
  agencyId: string
  currentUserId: string
  currentUserName: string
  isAdmin: boolean
}

function Avatar({ name, size = 32, bg = 'var(--accent1)' }: { name: string; size?: number; bg?: string }) {
  const initials = name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 700, color: '#fff', letterSpacing: '0',
    }}>
      {initials}
    </div>
  )
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      margin: '20px 0 8px',
    }}>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      <span style={{
        fontSize: '.7rem', fontWeight: 600, color: 'var(--muted)',
        textTransform: 'uppercase', letterSpacing: '.08em',
        padding: '2px 10px', background: 'var(--bg)',
        border: '1px solid var(--border)', borderRadius: '50px',
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    </div>
  )
}

function getDateLabel(ts: string): string {
  const d = new Date(ts)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Vandaag'
  if (d.toDateString() === yesterday.toDateString()) return 'Gisteren'
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Avatar color pool — deterministic per name
const AVATAR_BG = ['#1a3fe4', '#7c5ff5', '#00b89c', '#e1306c', '#ff7a30', '#0077b5']
function avatarBg(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_BG[Math.abs(hash) % AVATAR_BG.length]
}

export default function ChatClient({
  conversations: initialConvs,
  agencyId,
  currentUserId,
  currentUserName,
  isAdmin,
}: Props) {
  const [conversations, setConversations] = useState(initialConvs)
  const [activeConvId, setActiveConvId] = useState<string | null>(initialConvs[0]?.id || null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  const activeConv = conversations.find(c => c.id === activeConvId)

  useEffect(() => {
    if (!activeConvId) return
    loadMessages(activeConvId)

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

  // AI een antwoord laten opstellen (binnen je eigen agency afgeschermd).
  const [aiDrafting, setAiDrafting] = useState(false)
  async function aiWriteReply() {
    setAiDrafting(true)
    try {
      const last = [...messages].reverse().map((m: { content?: string }) => m.content).find((c) => typeof c === 'string' && c.trim()) || ''
      const brief = newMessage.trim()
      const prompt = `Schrijf een vriendelijk, professioneel antwoord in het Nederlands voor een klantgesprek.${last ? ` Het laatste bericht in het gesprek was: "${String(last).slice(0, 600)}".` : ''}${brief ? ` Richting voor het antwoord: ${brief}.` : ''} Geef ALLEEN de berichttekst.`
      const res = await fetch('/api/ai/assist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      })
      const data = await res.json()
      if (res.ok && data.text) setNewMessage(data.text.trim())
    } catch { /* stil falen */ } finally { setAiDrafting(false) }
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
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
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

  function handleTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setNewMessage(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
  }

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
  const formatDate = (ts: string) =>
    new Date(ts).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })

  // Group messages by date
  const groupedMessages: { label: string; messages: any[] }[] = []
  messages.forEach(msg => {
    const label = getDateLabel(msg.created_at)
    const last = groupedMessages[groupedMessages.length - 1]
    if (last && last.label === label) {
      last.messages.push(msg)
    } else {
      groupedMessages.push({ label, messages: [msg] })
    }
  })

  // Filter conversations
  const filteredConvs = conversations.filter(c => {
    if (!search) return true
    const title = (c.title || c.clients?.company_name || '').toLowerCase()
    return title.includes(search.toLowerCase())
  })

  // Split into direct + client
  const directConvs = filteredConvs.filter(c => !c.client_id)
  const clientConvs = filteredConvs.filter(c => !!c.client_id)

  const convListItemStyle = (isActive: boolean): CSSProperties => ({
    padding: '10px 14px',
    cursor: 'pointer',
    borderRadius: '8px',
    margin: '1px 6px',
    background: isActive ? 'rgba(26,63,228,.08)' : 'transparent',
    transition: 'background .12s',
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
  })

  function ConvItem({ conv }: { conv: any }) {
    const isActive = activeConvId === conv.id
    const name = conv.title || conv.clients?.company_name || 'Conversatie'
    const lastMsg = conv.messages?.[conv.messages.length - 1]
    const unread = 0 // placeholder — real unread count would come from DB
    return (
      <div onClick={() => setActiveConvId(conv.id)} style={convListItemStyle(isActive)}>
        <Avatar name={name} size={34} bg={avatarBg(name)} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
            <span style={{
              fontSize: '.84rem', fontWeight: isActive ? 700 : 600,
              color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: 'nowrap', flex: 1,
            }}>{name}</span>
            {lastMsg && (
              <span style={{ fontSize: '.68rem', color: 'var(--muted)', flexShrink: 0 }}>
                {formatDate(lastMsg.created_at)}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
            {lastMsg ? (
              <span style={{
                fontSize: '.76rem', color: 'var(--muted)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                flex: 1,
              }}>
                {lastMsg.content}
              </span>
            ) : (
              <span style={{ fontSize: '.76rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                Geen berichten
              </span>
            )}
            {unread > 0 && (
              <span style={{
                background: 'var(--accent1)', color: '#fff', borderRadius: '50px',
                fontSize: '.65rem', fontWeight: 700, padding: '1px 7px',
                marginLeft: '6px', flexShrink: 0,
              }}>
                {unread}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', height: 'calc(100vh - 130px)',
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', overflow: 'hidden',
      boxShadow: '0 2px 16px rgba(26,63,228,.07)',
    }}>

      {/* LEFT: Conversation list */}
      <div style={{
        width: '300px', flexShrink: 0, borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', background: 'var(--bg)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 16px 12px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{
            fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700,
            fontSize: '.95rem', color: 'var(--text)',
          }}>
            Berichten
          </span>
          {isAdmin && (
            <button
              onClick={createConversation}
              title="Nieuw gesprek"
              style={{
                background: 'var(--accent1)', color: '#fff', border: 'none',
                borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        {/* Search */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '7px 10px',
          }}>
            <Search size={13} color="var(--muted)" style={{ flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Zoek in berichten..."
              style={{
                border: 'none', outline: 'none', background: 'transparent',
                fontSize: '.82rem', color: 'var(--text)', flex: 1,
              }}
            />
          </div>
        </div>

        {/* Lists */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {/* Direct messages */}
          {(directConvs.length > 0 || clientConvs.length === 0) && (
            <>
              <div style={{
                padding: '6px 20px 4px', fontSize: '.68rem', fontWeight: 700,
                color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.09em',
              }}>
                Directe berichten
              </div>
              {directConvs.map(conv => <ConvItem key={conv.id} conv={conv} />)}
              {directConvs.length === 0 && (
                <div style={{ padding: '6px 20px', fontSize: '.78rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                  Geen directe berichten
                </div>
              )}
            </>
          )}

          {/* Client conversations */}
          {clientConvs.length > 0 && (
            <>
              <div style={{
                padding: '12px 20px 4px', fontSize: '.68rem', fontWeight: 700,
                color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.09em',
              }}>
                Klanten
              </div>
              {clientConvs.map(conv => <ConvItem key={conv.id} conv={conv} />)}
            </>
          )}

          {filteredConvs.length === 0 && (
            <div style={{
              padding: '40px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: '.83rem',
            }}>
              Geen gesprekken gevonden
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Message thread */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {activeConv ? (
          <>
            {/* Thread header */}
            <div style={{
              padding: '14px 20px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--card)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Avatar
                  name={activeConv.title || activeConv.clients?.company_name || 'Gesprek'}
                  size={34}
                  bg={avatarBg(activeConv.title || activeConv.clients?.company_name || 'Gesprek')}
                />
                <div>
                  <div style={{
                    fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700,
                    fontSize: '.92rem', color: 'var(--text)',
                  }}>
                    {activeConv.title || activeConv.clients?.company_name || 'Gesprek'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                    <span style={{
                      width: '7px', height: '7px', borderRadius: '50%',
                      background: '#00b89c', flexShrink: 0,
                    }} />
                    <span style={{ fontSize: '.72rem', color: 'var(--muted)' }}>Online</span>
                  </div>
                </div>
              </div>
              <button style={{
                background: 'transparent', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '6px 8px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', color: 'var(--muted)',
              }}>
                <MoreHorizontal size={16} />
              </button>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '16px 24px',
              display: 'flex', flexDirection: 'column',
            }}>
              {messages.length === 0 && (
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '12px',
                  color: 'var(--muted)',
                }}>
                  <MessageSquare size={36} strokeWidth={1.2} />
                  <div style={{ fontSize: '.88rem', fontWeight: 500 }}>
                    Start het gesprek
                  </div>
                  <div style={{ fontSize: '.78rem' }}>
                    Stuur het eerste bericht hieronder
                  </div>
                </div>
              )}

              {groupedMessages.map(group => (
                <div key={group.label}>
                  <DateSeparator label={group.label} />
                  {group.messages.map((msg, idx) => {
                    const isMe = msg.sender_id === currentUserId
                    const name = msg.sender_name || 'Onbekend'
                    // Show avatar only if different sender from previous in same group
                    const prevMsg = idx > 0 ? group.messages[idx - 1] : null
                    const showMeta = !prevMsg || prevMsg.sender_id !== msg.sender_id

                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          flexDirection: isMe ? 'row-reverse' : 'row',
                          gap: '8px',
                          marginBottom: showMeta ? '12px' : '4px',
                          alignItems: 'flex-end',
                        }}
                      >
                        {/* Avatar placeholder for spacing */}
                        <div style={{ width: '32px', flexShrink: 0 }}>
                          {showMeta && (
                            <Avatar name={name} size={32} bg={isMe ? 'var(--accent1)' : avatarBg(name)} />
                          )}
                        </div>

                        <div style={{ maxWidth: '65%', minWidth: 0 }}>
                          {showMeta && !isMe && (
                            <div style={{
                              fontSize: '.72rem', fontWeight: 600,
                              color: 'var(--muted)', marginBottom: '4px',
                            }}>
                              {name}
                            </div>
                          )}
                          <div style={{
                            padding: '9px 14px',
                            borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            background: isMe ? 'var(--accent1)' : 'var(--card)',
                            color: isMe ? '#fff' : 'var(--text)',
                            fontSize: '.88rem', lineHeight: 1.55,
                            border: isMe ? 'none' : '1px solid var(--border)',
                            wordBreak: 'break-word',
                          }}>
                            {msg.content}
                          </div>
                          <div style={{
                            fontSize: '.67rem', color: 'var(--muted)',
                            marginTop: '3px',
                            textAlign: isMe ? 'right' : 'left',
                          }}>
                            {formatTime(msg.created_at)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div style={{
              padding: '12px 20px 16px',
              borderTop: '1px solid var(--border)',
              background: 'var(--card)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'flex-end', gap: '8px',
                background: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '8px 12px',
              }}>
                <button
                  title="Bijlage toevoegen"
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: 'var(--muted)', padding: '4px', display: 'flex',
                    alignItems: 'center', flexShrink: 0,
                  }}
                >
                  <Paperclip size={16} />
                </button>
                <button
                  onClick={aiWriteReply}
                  disabled={aiDrafting}
                  title="Laat de AI een antwoord opstellen (pas het daarna gerust aan)"
                  style={{
                    background: 'transparent', border: 'none', cursor: aiDrafting ? 'wait' : 'pointer',
                    color: 'var(--accent1)', padding: '4px', display: 'flex',
                    alignItems: 'center', flexShrink: 0, opacity: aiDrafting ? 0.5 : 1,
                  }}
                >
                  <Sparkles size={16} />
                </button>
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={handleTextareaChange}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder="Typ een bericht… (Enter om te sturen, Shift+Enter voor nieuwe regel)"
                  rows={1}
                  style={{
                    flex: 1, border: 'none', outline: 'none',
                    background: 'transparent', resize: 'none',
                    fontSize: '.88rem', color: 'var(--text)',
                    fontFamily: 'inherit', lineHeight: 1.5,
                    maxHeight: '160px', overflow: 'auto',
                    padding: '2px 0',
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !newMessage.trim()}
                  title="Sturen"
                  style={{
                    background: newMessage.trim() ? 'var(--accent1)' : 'var(--border)',
                    color: newMessage.trim() ? '#fff' : 'var(--muted)',
                    border: 'none', borderRadius: '8px',
                    width: '34px', height: '34px', cursor: newMessage.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'background .15s',
                  }}
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '16px', color: 'var(--muted)',
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '16px',
              background: 'rgba(26,63,228,.08)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <MessageSquare size={28} color="var(--accent1)" strokeWidth={1.4} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--text)', marginBottom: '6px' }}>
                Selecteer een gesprek
              </div>
              <div style={{ fontSize: '.82rem' }}>
                Kies een gesprek in de lijst links om te beginnen
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
