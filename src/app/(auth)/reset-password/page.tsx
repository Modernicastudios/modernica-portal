'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const cardStyle = {
  background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
  padding: '40px', width: '100%', maxWidth: '420px', boxShadow: 'var(--shadow-lg)',
}
const inputStyle = {
  width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
  fontSize: '0.9rem', color: 'var(--text)', background: 'var(--bg)', outline: 'none',
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = new FormData(e.currentTarget)
    const password = form.get('password') as string
    const confirm = form.get('confirm') as string
    if (password.length < 8) { setError('Wachtwoord moet minimaal 8 tekens zijn.'); return }
    if (password !== confirm) { setError('De wachtwoorden komen niet overeen.'); return }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(/session|jwt|auth/i.test(error.message)
        ? 'Je herstel-link is verlopen of ongeldig. Vraag een nieuwe aan.'
        : error.message)
      setLoading(false)
      return
    }
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 1200)
  }

  return (
    <div style={cardStyle}>
      <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1.3rem', marginBottom: '8px' }}>
        Nieuw wachtwoord
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '24px' }}>
        Kies een nieuw wachtwoord voor je account.
      </p>

      {done ? (
        <div style={{ background: 'rgba(0,184,156,.08)', border: '1px solid rgba(0,184,156,.25)', borderRadius: 'var(--radius-sm)', padding: '14px', fontSize: '.88rem' }}>
          Gelukt! Je wordt doorgestuurd...
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Nieuw wachtwoord</label>
            <input type="password" name="password" placeholder="Min. 8 tekens" required minLength={8} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Herhaal wachtwoord</label>
            <input type="password" name="confirm" placeholder="Nogmaals" required minLength={8} style={inputStyle} />
          </div>
          {error && (
            <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '0.83rem', color: 'var(--danger)' }}>
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} style={{ background: loading ? 'var(--muted)' : 'var(--accent1)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '12px', fontSize: '0.9rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Opslaan...' : 'Wachtwoord opslaan'}
          </button>
        </form>
      )}
    </div>
  )
}
