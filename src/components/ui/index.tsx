// Gedeelde, consistente UI-bouwstenen — corporate, licht en strak.
// Gebruik deze i.p.v. losse inline-stijlen, zodat alles er hetzelfde uitziet.
import React from 'react'

export function Card({
  children,
  padding = 20,
  style,
  ...rest
}: { children: React.ReactNode; padding?: number } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)',
        padding,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  action,
}: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.5rem', margin: '0 0 4px', lineHeight: 1.2 }}>
          {title}
        </h1>
        {subtitle && <p style={{ color: 'var(--muted)', fontSize: '.88rem', margin: 0 }}>{subtitle}</p>}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  )
}

type Tone = 'accent' | 'success' | 'danger' | 'muted'
const TONES: Record<Tone, { bg: string; fg: string }> = {
  accent: { bg: 'rgba(26,63,228,.1)', fg: 'var(--accent1)' },
  success: { bg: 'rgba(0,184,156,.12)', fg: 'var(--accent3)' },
  danger: { bg: 'var(--danger-bg)', fg: 'var(--danger)' },
  muted: { bg: 'var(--card2)', fg: 'var(--muted)' },
}

export function Badge({ children, tone = 'muted' }: { children: React.ReactNode; tone?: Tone }) {
  const t = TONES[tone]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 'var(--radius-pill)', background: t.bg, color: t.fg }}>
      {children}
    </span>
  )
}

const baseBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  padding: '10px 16px', borderRadius: 'var(--radius-sm)', fontSize: '.85rem', fontWeight: 600,
  cursor: 'pointer', border: '1px solid transparent', transition: 'opacity .15s',
}

export function PrimaryButton({ children, style, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button style={{ ...baseBtn, background: 'var(--accent1)', color: '#fff', ...style, opacity: rest.disabled ? 0.6 : 1 }} {...rest}>
      {children}
    </button>
  )
}

export function SecondaryButton({ children, style, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button style={{ ...baseBtn, background: 'var(--card)', color: 'var(--text)', borderColor: 'var(--border)', ...style, opacity: rest.disabled ? 0.6 : 1 }} {...rest}>
      {children}
    </button>
  )
}
