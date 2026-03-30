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

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (authError || !authData.user) {
      setError(authError?.message || 'Registratie mislukt.')
      setLoading(false)
      return
    }

    // 2. Create agency
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .insert({
        name: form.agencyName,
        slug: form.agencySlug,
        subscription_plan: 'free',
        subscription_status: 'trialing',
        max_clients: 5,
        max_social_accounts: 10,
        features: {},
      })
      .select()
      .single()

    if (agencyError || !agency) {
      setError('Agency aanmaken mislukt: ' + agencyError?.message)
      setLoading(false)
      return
    }

    // 3. Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: form.email,
        full_name: form.fullName,
        role: 'admin',
        agency_id: agency.id,
        timezone: 'Europe/Amsterdam',
      })

    if (profileError) {
      setError('Profiel aanmaken mislukt: ' + profileError?.message)
      setLoading(false)
      return
    }

    // 4. Create default brand kit
    await supabase.from('brand_kits').insert({
      agency_id: agency.id,
      primary_color: '#1a3fe4',
      secondary_color: '#4f7bff',
      powered_by_visible: true,
    })

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
      boxShadow: '0 8px 40px rgba(26,63,228,.12)',
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
