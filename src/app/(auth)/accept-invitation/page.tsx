'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AcceptInvitationForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const token = searchParams.get('token')
  const [invitation, setInvitation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    async function fetchInvitation() {
      if (!token) { setError('Ongeldige uitnodigingslink.'); setLoading(false); return }

      const { data, error } = await supabase
        .from('client_invitations')
        .select('*, clients(company_name), agencies(name)')
        .eq('token', token)
        .eq('accepted', false)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error || !data) {
        setError('Deze uitnodiging is ongeldig of verlopen.')
      } else {
        setInvitation(data)
        setEmail(data.email || '')
      }
      setLoading(false)
    }
    fetchInvitation()
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!invitation) return

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Vul een geldig e-mailadres in om je account aan te maken.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { full_name: fullName }
        }
      })

      if (signUpError) throw signUpError

      const userId = authData.user?.id
      if (!userId) throw new Error('Gebruiker aanmaken mislukt')

      // Create user profile linked to client
      await supabase.from('user_profiles').upsert({
        id: userId,
        full_name: fullName,
        email: cleanEmail,
        role: 'client',
        agency_id: invitation.agency_id,
        client_id: invitation.client_id,
      })

      // Mark invitation as accepted
      await supabase.from('client_invitations').update({ accepted: true, accepted_at: new Date().toISOString() }).eq('id', invitation.id)

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Er ging iets mis. Probeer opnieuw.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
        Uitnodiging laden...
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>❌</div>
        <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, marginBottom: '8px' }}>Ongeldige uitnodiging</h2>
        <p style={{ color: 'var(--muted)' }}>{error}</p>
        <a href="/login" style={{ display: 'inline-block', marginTop: '20px', color: 'var(--accent1)', fontWeight: 600, fontSize: '.9rem' }}>
          Naar inlogpagina
        </a>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '420px', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.4rem', marginBottom: '8px' }}>
          Welkom bij {(invitation?.agencies as any)?.name || 'het portaal'}
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>
          Je bent uitgenodigd als klant voor{' '}
          <strong>{(invitation?.clients as any)?.company_name}</strong>.
          Maak je account aan om te beginnen.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '.82rem', fontWeight: 600, display: 'block', marginBottom: '5px' }}>E-mailadres</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={!!invitation?.email}
            required
            placeholder="jij@bedrijf.nl"
            style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.9rem', background: invitation?.email ? 'var(--bg)' : 'var(--card)', color: invitation?.email ? 'var(--muted)' : 'var(--text)', cursor: invitation?.email ? 'not-allowed' : 'text', boxSizing: 'border-box', outline: 'none' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '.82rem', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Volledige naam</label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Jouw naam"
            required
            style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.9rem', background: 'var(--card)', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '.82rem', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Wachtwoord kiezen</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Minimaal 8 tekens"
            required
            minLength={8}
            style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.9rem', background: 'var(--card)', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(229,57,53,.08)', border: '1px solid rgba(229,57,53,.2)', borderRadius: 'var(--radius-sm)', fontSize: '.85rem', color: '#e53935' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '13px', background: 'var(--accent1)', color: '#fff', border: 'none',
            borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '.95rem', cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.7 : 1, boxShadow: '0 4px 12px rgba(26,63,228,.3)',
          }}
        >
          {submitting ? 'Account aanmaken...' : 'Account aanmaken & inloggen →'}
        </button>
      </form>
    </div>
  )
}

export default function AcceptInvitationPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '24px' }}>
      <Suspense fallback={<div style={{ color: 'var(--muted)' }}>Laden...</div>}>
        <AcceptInvitationForm />
      </Suspense>
    </div>
  )
}
