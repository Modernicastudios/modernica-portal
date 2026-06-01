'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    agencyName: '',
    agencySlug: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm(prev => {
      const updated = { ...prev, [name]: value }
      // Auto-generate slug from agency name
      if (name === 'agencyName') {
        updated.agencySlug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      }
      return updated
    })
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    // Provisioning gebeurt server-side (RLS blokkeert een directe agency-insert vanuit de browser).
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Registratie mislukt.')
      setLoading(false)
      return
    }

    // Inloggen met het zojuist aangemaakte account.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })
    if (signInError) {
      setError('Account aangemaakt, maar inloggen mislukte. Probeer in te loggen.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.9rem',
    color: 'var(--text)',
    background: 'var(--bg)',
    outline: 'none',
  }

  const labelStyle = {
    fontSize: '0.8rem',
    fontWeight: 600 as const,
    color: 'var(--text)',
    display: 'block' as const,
    marginBottom: '6px',
  }

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '40px',
      width: '100%',
      maxWidth: '460px',
      boxShadow: 'var(--shadow-lg)',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.5rem', color: 'var(--accent1)' }}>
          Modernica
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px' }}>Studios Portal</div>
      </div>

      <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1.2rem', marginBottom: '6px' }}>
        Registreer je agency
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
        Start met 14 dagen gratis proberen
      </p>

      <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={labelStyle}>Volledige naam</label>
          <input name="fullName" type="text" value={form.fullName} onChange={handleChange} placeholder="Jan Jansen" required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>E-mailadres</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="jan@agency.nl" required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Wachtwoord</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min. 8 tekens" required minLength={8} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Agency naam</label>
          <input name="agencyName" type="text" value={form.agencyName} onChange={handleChange} placeholder="Mijn Agency BV" required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Agency URL</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
            <input
              name="agencySlug"
              type="text"
              value={form.agencySlug}
              onChange={handleChange}
              placeholder="mijn-agency"
              required
              pattern="[a-z0-9-]+"
              style={{ ...inputStyle, borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)', borderRight: 'none' }}
            />
            <span style={{
              padding: '10px 12px',
              background: 'var(--card2)',
              border: '1px solid var(--border)',
              borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
              fontSize: '0.8rem',
              color: 'var(--muted)',
              whiteSpace: 'nowrap',
            }}>
              .modernicaportal.com
            </span>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(229,57,53,.08)',
            border: '1px solid rgba(229,57,53,.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            fontSize: '0.83rem',
            color: '#c62828',
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? 'var(--muted)' : 'var(--accent1)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '12px',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '4px',
          }}
        >
          {loading ? 'Account aanmaken...' : 'Account aanmaken'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.82rem', color: 'var(--muted)' }}>
        Al een account?{' '}
        <Link href="/login" style={{ color: 'var(--accent1)', fontWeight: 600, textDecoration: 'none' }}>
          Inloggen
        </Link>
      </div>
    </div>
  )
}
