'use client'

import { useState } from 'react'
import { ShieldCheck, Building2, CheckCircle2, Clock, Wallet, User } from 'lucide-react'

interface Agency {
  id: string
  name: string
  slug: string
  subscription_plan: string
  subscription_status: string
  max_clients: number
  created_at: string
  custom_domain: string | null
  stripe_customer_id: string | null
  features: Record<string, boolean> | null
}

interface User {
  id: string
  full_name: string
  email: string
  role: string
  created_at: string
  agencies?: { name: string } | null
}

interface Props {
  agencies: Agency[]
  agencyCount: number
  recentUsers: User[]
  recentSignups: Agency[]
}

const PLAN_COLORS: Record<string, string> = {
  free: 'var(--muted)',
  starter: 'var(--accent2)',
  growth: 'var(--accent1)',
  enterprise: 'var(--accent3)',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'var(--accent3)',
  trialing: 'var(--accent4)',
  past_due: '#e53935',
  canceled: 'var(--muted)',
}

export default function AdminClient({ agencies, agencyCount, recentUsers, recentSignups }: Props) {
  const [tab, setTab] = useState<'agencies' | 'users'>('agencies')
  const [search, setSearch] = useState('')
  const [features, setFeatures] = useState<Record<string, Record<string, boolean>>>(
    () => Object.fromEntries(agencies.map(a => [a.id, a.features || {}]))
  )
  const [savingId, setSavingId] = useState<string | null>(null)

  async function toggleLeadMachine(agencyId: string, enabled: boolean) {
    setSavingId(agencyId)
    setFeatures(prev => ({ ...prev, [agencyId]: { ...prev[agencyId], lead_machine: enabled } }))
    try {
      const res = await fetch('/api/admin/agency-feature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyId, feature: 'lead_machine', enabled }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setFeatures(prev => ({ ...prev, [agencyId]: { ...prev[agencyId], lead_machine: !enabled } }))
      alert('Opslaan mislukt — probeer opnieuw')
    } finally {
      setSavingId(null)
    }
  }

  const filteredAgencies = agencies.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.slug.toLowerCase().includes(search.toLowerCase())
  )

  const filteredUsers = recentUsers.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const totalRevenue = agencies.filter(a => a.subscription_plan !== 'free' && a.subscription_status === 'active').reduce((sum, a) => {
    const prices: Record<string, number> = { starter: 49, growth: 149, enterprise: 399 }
    return sum + (prices[a.subscription_plan] || 0)
  }, 0)

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.5rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={22} style={{ color: 'var(--accent1)' }} /> Platformbeheer
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>Super admin — Modernica Studios</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Totaal agencies', value: agencyCount, icon: <Building2 size={20} />, color: 'var(--accent1)' },
          { label: 'Actieve abonnementen', value: agencies.filter(a => a.subscription_status === 'active').length, icon: <CheckCircle2 size={20} />, color: 'var(--accent3)' },
          { label: 'In proefperiode', value: agencies.filter(a => a.subscription_status === 'trialing').length, icon: <Clock size={20} />, color: 'var(--accent4)' },
          { label: 'MRR (schatting)', value: `€${totalRevenue}`, icon: <Wallet size={20} />, color: 'var(--accent3)' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', boxShadow: 'var(--shadow)' }}>
            <div style={{ marginBottom: '8px', color: stat.color }}>{stat.icon}</div>
            <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.4rem', color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '.8rem', color: 'var(--muted)', marginTop: '2px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Plan distributie */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.95rem', marginBottom: '14px' }}>Plan distributie</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {(['free', 'starter', 'growth', 'enterprise'] as const).map(plan => {
            const count = agencies.filter(a => a.subscription_plan === plan).length
            return (
              <div key={plan} style={{ flex: 1, minWidth: '80px', padding: '12px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.4rem', color: PLAN_COLORS[plan] }}>{count}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--muted)', textTransform: 'capitalize' }}>{plan}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabs + Search */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['agencies', 'users'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600, fontSize: '.85rem',
              background: tab === t ? 'var(--accent1)' : 'var(--card)', color: tab === t ? '#fff' : 'var(--muted)',
              borderColor: tab === t ? 'var(--accent1)' : 'var(--border)',
            }}>
              {t === 'agencies'
                ? <><Building2 size={14} /> Agencies ({agencies.length})</>
                : <><User size={14} /> Gebruikers ({recentUsers.length})</>}
            </button>
          ))}
        </div>
        <input
          placeholder="Zoeken..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.88rem', background: 'var(--card)', outline: 'none', width: '200px' }}
        />
      </div>

      {/* Agencies table */}
      {tab === 'agencies' && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                {['Agency', 'Slug', 'Plan', 'Status', 'Max Klanten', 'Stripe', 'Leadmachine', 'Aangemeld'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '.75rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAgencies.map((agency, i) => (
                <tr key={agency.id} style={{ borderBottom: i < filteredAgencies.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: '.88rem' }}>{agency.name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '.8rem', background: 'var(--bg)', padding: '2px 8px', borderRadius: '4px', color: 'var(--muted)' }}>
                      {agency.slug}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '.75rem', padding: '3px 10px', borderRadius: '50px', background: `${PLAN_COLORS[agency.subscription_plan]}20`, color: PLAN_COLORS[agency.subscription_plan], fontWeight: 600, textTransform: 'capitalize' }}>
                      {agency.subscription_plan}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '.75rem', padding: '3px 10px', borderRadius: '50px', background: `${STATUS_COLORS[agency.subscription_status] || 'var(--muted)'}20`, color: STATUS_COLORS[agency.subscription_status] || 'var(--muted)', fontWeight: 600 }}>
                      {agency.subscription_status || 'trialing'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '.88rem', color: 'var(--muted)' }}>{agency.max_clients || '5'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {agency.stripe_customer_id ? (
                      <span style={{ fontSize: '.72rem', color: 'var(--accent3)' }}>✅ Gekoppeld</span>
                    ) : (
                      <span style={{ fontSize: '.72rem', color: 'var(--muted)' }}>— Geen</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {(() => {
                      const on = Boolean(features[agency.id]?.lead_machine)
                      return (
                        <button
                          onClick={() => toggleLeadMachine(agency.id, !on)}
                          disabled={savingId === agency.id}
                          title={on ? 'Leadmachine staat aan — klik om uit te zetten' : 'Leadmachine staat uit — klik om aan te zetten'}
                          style={{
                            position: 'relative', width: '44px', height: '24px', borderRadius: '50px',
                            border: 'none', padding: 0, cursor: savingId === agency.id ? 'wait' : 'pointer',
                            background: on ? 'var(--accent3)' : 'var(--border)', transition: 'background .2s',
                            opacity: savingId === agency.id ? 0.6 : 1,
                          }}
                        >
                          <span style={{
                            position: 'absolute', top: '2px', left: on ? '22px' : '2px',
                            width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                            transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                          }} />
                        </button>
                      )
                    })()}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '.8rem', color: 'var(--muted)' }}>
                    {new Date(agency.created_at).toLocaleDateString('nl-NL')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAgencies.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '.9rem' }}>
              Geen agencies gevonden
            </div>
          )}
        </div>
      )}

      {/* Users table */}
      {tab === 'users' && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                {['Naam', 'E-mail', 'Rol', 'Agency', 'Aangemeld'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '.75rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, i) => (
                <tr key={user.id} style={{ borderBottom: i < filteredUsers.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: '.88rem' }}>{user.full_name || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '.85rem', color: 'var(--muted)' }}>{user.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '.75rem', padding: '3px 10px', borderRadius: '50px', background: 'var(--bg)', color: 'var(--accent1)', fontWeight: 600, textTransform: 'capitalize' }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '.85rem', color: 'var(--muted)' }}>
                    {(user.agencies as any)?.name || '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '.8rem', color: 'var(--muted)' }}>
                    {new Date(user.created_at).toLocaleDateString('nl-NL')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '.9rem' }}>
              Geen gebruikers gevonden
            </div>
          )}
        </div>
      )}
    </div>
  )
}
