'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Send, Copy, Check, Loader2 } from 'lucide-react'

type Msg = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'Schrijf een Instagram-post over onze nieuwe dienst',
  'Bedenk 5 content-ideeën voor een kapper',
  'Schrijf een korte, vriendelijke klant-update mail',
  'Maak een pakkende advertentietekst (max 2 zinnen)',
]

export default function AiAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  async function send(text: string) {
    const q = text.trim()
    if (!q || busy) return
    const next = [...messages, { role: 'user' as const, content: q }]
    setMessages(next)
    setInput('')
    setBusy(true)
    try {
      const res = await fetch('/api/ai/assist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      const data = await res.json()
      setMessages([...next, { role: 'assistant', content: res.ok ? (data.text || '...') : `⚠️ ${data.error || 'Er ging iets mis'}` }])
    } catch {
      setMessages([...next, { role: 'assistant', content: '⚠️ Geen verbinding met de AI.' }])
    } finally {
      setBusy(false)
    }
  }

  function copy(text: string, i: number) {
    navigator.clipboard?.writeText(text)
    setCopied(i)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <>
      {/* Floating knop (links van de support-knop) */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="AI-assistent"
          style={{
            position: 'fixed', bottom: '24px', right: '86px', zIndex: 200,
            width: '52px', height: '52px', borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, var(--accent1) 0%, #2d4ff0 100%)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(26,63,228,.4)',
          }}
        >
          <Sparkles size={22} />
        </button>
      )}

      {open && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 320,
          width: 'min(400px, calc(100vw - 32px))', height: 'min(600px, calc(100vh - 48px))',
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Kop */}
          <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, var(--accent1) 0%, #2d4ff0 100%)', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={18} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '.92rem' }}>AI-assistent</div>
              <div style={{ fontSize: '.72rem', opacity: .85 }}>Schrijft, bedenkt en helpt mee</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Sluiten" style={{ background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={15} />
            </button>
          </div>

          {/* Berichten */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.length === 0 && (
              <div>
                <div style={{ fontSize: '.85rem', color: 'var(--muted)', marginBottom: '12px', lineHeight: 1.5 }}>
                  Waarmee kan ik helpen? Bijvoorbeeld:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => send(s)} style={{ textAlign: 'left', padding: '9px 12px', border: '1px solid var(--border)', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', fontSize: '.82rem', color: 'var(--text)', cursor: 'pointer' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '88%', padding: '10px 12px', borderRadius: '12px', fontSize: '.85rem', lineHeight: 1.5, whiteSpace: 'pre-wrap',
                  background: m.role === 'user' ? 'var(--accent1)' : 'var(--bg)',
                  color: m.role === 'user' ? '#fff' : 'var(--text)',
                  border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                }}>
                  {m.content}
                </div>
                {m.role === 'assistant' && !m.content.startsWith('⚠️') && (
                  <button onClick={() => copy(m.content, i)} style={{ marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--muted)', fontSize: '.72rem', cursor: 'pointer' }}>
                    {copied === i ? <><Check size={12} /> Gekopieerd</> : <><Copy size={12} /> Kopiëren</>}
                  </button>
                )}
              </div>
            ))}
            {busy && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '.82rem' }}>
                <Loader2 size={15} className="animate-spin" /> Aan het nadenken…
              </div>
            )}
          </div>

          {/* Invoer */}
          <div style={{ padding: '12px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
              rows={1}
              placeholder="Typ je vraag of opdracht…"
              style={{ flex: 1, padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.85rem', background: 'var(--bg)', outline: 'none', resize: 'none', maxHeight: '120px', fontFamily: 'inherit' }}
            />
            <button onClick={() => send(input)} disabled={busy || !input.trim()} aria-label="Versturen" style={{ width: '38px', height: '38px', flexShrink: 0, borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--accent1)', color: '#fff', cursor: busy || !input.trim() ? 'default' : 'pointer', opacity: busy || !input.trim() ? .5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
