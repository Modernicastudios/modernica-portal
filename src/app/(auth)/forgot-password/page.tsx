'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const cardStyle = {
  background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
  padding: '40px', width: '100%', maxWidth: '420px', boxShadow: 'var(--shadow-lg)',
}
const inputStyle = {
  width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
  fontSize: '0.9rem', color: 'var(--text)', background: 'var(--bg)', outline: 'none',
}

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const email = new FormData(e.currentTarget).get('email') as string
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <div style={cardStyle}>
      <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1.3rem', marginBottom: '8px' }}>
        Wachtwoord vergeten
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '24px' }}>
        Vul je e-mailadres in, dan sturen we je een link om een nieuw wachtwoord in te stellen.
      </p>

      {sent ? (
        <div style={{ background: 'rgba(0,184,156,.08)', border: '1px solid rgba(0,184,156,.25)', borderRadius: 'var(--radius-sm)', padding: '14px', fontSize: '.88rem', color: 'var(--text)' }}>
          Check je e-mail — als er een account bestaat, ontvang je een herstel-link.
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>E-mailadres</label>
            <input type="email" name="email" placeholder="jij@bedrijf.nl" required style={inputStyle} />
          </div>
          {error && (
            <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '0.83rem', color: 'var(--danger)' }}>
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} style={{ background: loading ? 'var(--muted)' : 'var(--accent1)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '12px', fontSize: '0.9rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Versturen...' : 'Stuur herstel-link'}
          </button>
        </form>
      )}

      <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.82rem', color: 'var(--muted)' }}>
        <Link href="/login" style={{ color: 'var(--accent1)', fontWeight: 600, textDecoration: 'none' }}>
          Terug naar inloggen
        </Link>
      </div>
    </div>
  )
}
