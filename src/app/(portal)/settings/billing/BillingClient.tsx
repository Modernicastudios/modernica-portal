'use client'

import { useState } from 'react'

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    priceMonthly: 49,
    priceYearly: 490,
    color: 'var(--accent2)',
    features: [
      '5 klanten',
      '10 social media accounts',
      '2 advertentieplatformen',
      '3 teamleden',
      'Content kalender',
      'Project management',
      'Chat & berichten',
    ],
    notIncluded: ['White-label', 'Custom domein', '"Powered by" verbergen'],
  },
  {
    key: 'growth',
    name: 'Growth',
    priceMonthly: 149,
    priceYearly: 1490,
    color: 'var(--accent1)',
    popular: true,
    features: [
      '25 klanten',
      '50 social media accounts',
      '10 advertentieplatformen',
      '10 teamleden',
      'Alles van Starter',
      'White-label branding',
      'Eigen logo & kleuren',
    ],
    notIncluded: ['Custom domein', '"Powered by" verbergen'],
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 399,
    priceYearly: 3990,
    color: 'var(--accent3)',
    features: [
      'Onbeperkt klanten',
      'Onbeperkt accounts',
      'Onbeperkt teamleden',
      'Alles van Growth',
      'Custom domein',
      '"Powered by" verbergen',
      'Prioriteit support',
    ],
    notIncluded: [],
  },
]

interface Props {
  agency: any
}

export default function BillingClient({ agency }: Props) {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)

  const currentPlan = agency?.subscription_plan || 'free'
  const status = agency?.subscription_status || 'trialing'

  async function subscribe(plan: string) {
    setLoading(plan)
    const resp = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, interval }),
    })
    const { url } = await resp.json()
    if (url) window.location.href = url
    setLoading(null)
  }

  async function openPortal() {
    setLoading('portal')
    const resp = await fetch('/api/stripe/create-portal', { method: 'POST' })
    const { url } = await resp.json()
    if (url) window.location.href = url
    setLoading(null)
  }

  const statusColors: Record<string, string> = {
    active: 'var(--accent3)',
    trialing: 'var(--accent4)',
    past_due: '#e53935',
    canceled: 'var(--muted)',
  }
  const statusLabels: Record<string, string> = {
    active: 'Actief',
    trialing: 'Proefperiode',
    past_due: 'Betaling mislukt',
    canceled: 'Opgezegd',
  }

  return (
    <div className="animate-fade-up">
      {/* Current plan */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '28px', marginBottom: '28px', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '6px' }}>Huidig abonnement</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.3rem', textTransform: 'capitalize' }}>{currentPlan}</span>
              <span style={{ fontSize: '.75rem', padding: '3px 10px', borderRadius: '50px', background: `${statusColors[status]}20`, color: statusColors[status], fontWeight: 600 }}>
                {statusLabels[status] || status}
              </span>
            </div>
          </div>
          {agency?.stripe_customer_id && (
            <button
              onClick={openPortal}
              disabled={loading === 'portal'}
              style={{ padding: '9px 20px', background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: '.88rem' }}
            >
              {loading === 'portal' ? 'Laden...' : 'Abonnement beheren'}
            </button>
          )}
        </div>

        {status === 'trialing' && (
          <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(255,122,48,.08)', border: '1px solid rgba(255,122,48,.2)', borderRadius: 'var(--radius-sm)', fontSize: '.85rem', color: 'var(--accent4)' }}>
            ⏳ Je proefperiode loopt. Kies een abonnement om alle functies te blijven gebruiken.
          </div>
        )}
      </div>

      {/* Interval toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
        <div style={{ display: 'flex', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '50px', padding: '4px' }}>
          {(['monthly', 'yearly'] as const).map(opt => (
            <button key={opt} onClick={() => setInterval(opt)} style={{
              padding: '8px 24px', borderRadius: '50px', border: 'none', cursor: 'pointer', fontSize: '.88rem', fontWeight: 600,
              background: interval === opt ? 'var(--accent1)' : 'none',
              color: interval === opt ? '#fff' : 'var(--muted)',
              transition: 'all .2s',
            }}>
              {opt === 'monthly' ? 'Per maand' : 'Per jaar'}{opt === 'yearly' && <span style={{ fontSize: '.7rem', marginLeft: '6px', color: interval === 'yearly' ? 'rgba(255,255,255,.7)' : 'var(--accent3)' }}>-17%</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {PLANS.map(plan => {
          const price = interval === 'monthly' ? plan.priceMonthly : Math.round(plan.priceYearly / 12)
          const isCurrentPlan = currentPlan === plan.key
          const isPending = loading === plan.key

          return (
            <div key={plan.key} style={{
              background: 'var(--card)', border: `2px solid ${isCurrentPlan ? plan.color : plan.popular ? 'rgba(26,63,228,.2)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)', padding: '28px', position: 'relative',
              boxShadow: plan.popular ? '0 8px 32px rgba(26,63,228,.12)' : 'var(--shadow)',
              transform: plan.popular ? 'scale(1.02)' : 'none',
            }}>
              {plan.popular && (
                <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent1)', color: '#fff', fontSize: '.72rem', fontWeight: 700, padding: '4px 16px', borderRadius: '50px', whiteSpace: 'nowrap' }}>
                  MEEST POPULAIR
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.1rem', marginBottom: '8px', color: plan.color }}>{plan.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '2.2rem' }}>€{price}</span>
                  <span style={{ color: 'var(--muted)', fontSize: '.85rem' }}>/maand</span>
                </div>
                {interval === 'yearly' && (
                  <div style={{ fontSize: '.75rem', color: 'var(--accent3)', marginTop: '2px' }}>€{plan.priceYearly}/jaar — bespaar €{plan.priceMonthly * 12 - plan.priceYearly}</div>
                )}
              </div>

              <ul style={{ listStyle: 'none', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {plan.features.map(f => (
                  <li key={f} style={{ fontSize: '.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--accent3)', fontSize: '.9rem' }}>✓</span>
                    {f}
                  </li>
                ))}
                {plan.notIncluded.map(f => (
                  <li key={f} style={{ fontSize: '.82rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '.9rem' }}>✗</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => !isCurrentPlan && subscribe(plan.key)}
                disabled={isCurrentPlan || isPending}
                style={{
                  width: '100%', padding: '12px', border: 'none', borderRadius: 'var(--radius-sm)',
                  cursor: isCurrentPlan ? 'default' : 'pointer', fontWeight: 700, fontSize: '.9rem',
                  background: isCurrentPlan ? 'var(--card2)' : plan.color,
                  color: isCurrentPlan ? 'var(--muted)' : '#fff',
                  boxShadow: isCurrentPlan ? 'none' : `0 4px 12px ${plan.color}40`,
                }}
              >
                {isPending ? 'Laden...' : isCurrentPlan ? 'Huidig plan' : `Kies ${plan.name}`}
              </button>
            </div>
          )
        })}
      </div>

      <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '.8rem', marginTop: '24px' }}>
        Alle plannen inclusief 14 dagen gratis proefperiode • Geen creditcard vereist bij aanmelden • Op elk moment opzegbaar
      </p>
    </div>
  )
}
