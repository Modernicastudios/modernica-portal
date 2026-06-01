'use client'

import { useState } from 'react'
import Link from 'next/link'
import { loginAction } from './actions'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await loginAction(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.success) {
      // Cookie is gezet door server action, nu harde navigatie
      window.location.href = '/dashboard'
    }
  }

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '40px',
      width: '100%',
      maxWidth: '420px',
      boxShadow: 'var(--shadow-lg)',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          fontFamily: 'var(--font-syne), sans-serif',
          fontWeight: 800,
          fontSize: '1.5rem',
          color: 'var(--accent1)',
          letterSpacing: '-0.5px',
        }}>
          Modernica
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px' }}>
          Studios Portal
        </div>
      </div>

      <h1 style={{
        fontFamily: 'var(--font-syne), sans-serif',
        fontWeight: 700,
        fontSize: '1.3rem',
        marginBottom: '8px',
        color: 'var(--text)',
      }}>
        Welkom terug
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '28px' }}>
        Log in op je account
      </p>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: '6px' }}>
            E-mailadres
          </label>
          <input
            type="email"
            name="email"
            placeholder="jij@bedrijf.nl"
            required
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              color: 'var(--text)',
              background: 'var(--bg)',
              outline: 'none',
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: '6px' }}>
            Wachtwoord
          </label>
          <input
            type="password"
            name="password"
            placeholder="••••••••"
            required
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              color: 'var(--text)',
              background: 'var(--bg)',
              outline: 'none',
            }}
          />
          <div style={{ textAlign: 'right', marginTop: '6px' }}>
            <Link href="/forgot-password" style={{ fontSize: '0.78rem', color: 'var(--accent1)', textDecoration: 'none' }}>
              Wachtwoord vergeten?
            </Link>
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
            transition: 'opacity .2s',
          }}
        >
          {loading ? 'Inloggen...' : 'Inloggen'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.82rem', color: 'var(--muted)' }}>
        Nog geen account?{' '}
        <Link href="/signup" style={{ color: 'var(--accent1)', fontWeight: 600, textDecoration: 'none' }}>
          Registreer je agency
        </Link>
      </div>
    </div>
  )
}
