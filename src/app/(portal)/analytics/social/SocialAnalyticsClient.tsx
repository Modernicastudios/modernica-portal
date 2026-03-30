'use client'

import Link from 'next/link'

const PLATFORM_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  instagram: { label: 'Instagram', icon: '📸', color: '#e1306c', bg: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)' },
  facebook: { label: 'Facebook', icon: '📘', color: '#1877f2', bg: 'linear-gradient(135deg,#1877f2,#42a5f5)' },
  linkedin: { label: 'LinkedIn', icon: '💼', color: '#0077b5', bg: 'linear-gradient(135deg,#0077b5,#00a0dc)' },
  tiktok: { label: 'TikTok', icon: '🎵', color: '#000', bg: 'linear-gradient(135deg,#010101,#69c9d0)' },
  youtube: { label: 'YouTube', icon: '▶️', color: '#ff0000', bg: 'linear-gradient(135deg,#ff0000,#ff6b6b)' },
}

interface Props {
  accounts: any[]
  agencyId: string
}

export default function SocialAnalyticsClient({ accounts, agencyId }: Props) {
  if (accounts.length === 0) {
    return (
      <div className="animate-fade-up">
        <div style={{
          background: 'linear-gradient(135deg, var(--accent1), #2d5fff)',
          borderRadius: 'var(--radius)', padding: '40px', textAlign: 'center',
          color: '#fff', boxShadow: '0 8px 40px rgba(26,63,228,.3)',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>📱</div>
          <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.4rem', marginBottom: '8px' }}>
            Koppel je social media accounts
          </div>
          <div style={{ opacity: .85, fontSize: '.9rem', marginBottom: '24px' }}>
            Verbind Instagram, TikTok, LinkedIn en meer om analytics te zien
          </div>
          <Link href="/settings/integrations" style={{
            background: '#fff', color: 'var(--accent1)', padding: '12px 28px',
            borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '.9rem',
            textDecoration: 'none', display: 'inline-block',
          }}>
            🔗 Accounts koppelen
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-up">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {accounts.map(account => {
          const cfg = PLATFORM_CONFIG[account.platform] || { label: account.platform, icon: '📱', color: '#666', bg: '#eee' }
          const latestMetrics = account.social_metrics?.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

          return (
            <div key={account.id} style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(26,63,228,.06)',
            }}>
              {/* Platform header */}
              <div style={{ background: cfg.bg, padding: '20px', color: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.5rem' }}>{cfg.icon}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1rem' }}>{cfg.label}</div>
                    {account.platform_username && (
                      <div style={{ fontSize: '.78rem', opacity: .85 }}>@{account.platform_username}</div>
                    )}
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,.2)', padding: '4px 10px', borderRadius: '50px', fontSize: '.72rem', fontWeight: 600 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4cff91' }} />
                    Actief
                  </div>
                </div>
                {latestMetrics?.followers && (
                  <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.8rem' }}>
                    {latestMetrics.followers.toLocaleString('nl-NL')}
                    <span style={{ fontSize: '.85rem', fontWeight: 400, opacity: .8, marginLeft: '6px' }}>volgers</span>
                  </div>
                )}
              </div>

              {/* Metrics */}
              <div style={{ padding: '16px' }}>
                {latestMetrics ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                      { label: 'Bereik', value: latestMetrics.reach?.toLocaleString('nl-NL') || '-' },
                      { label: 'Vertoningen', value: latestMetrics.impressions?.toLocaleString('nl-NL') || '-' },
                      { label: 'Engagement', value: latestMetrics.engagement_rate ? `${latestMetrics.engagement_rate.toFixed(2)}%` : '-' },
                      { label: 'Datum', value: new Date(latestMetrics.date).toLocaleDateString('nl-NL') },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: 'var(--bg)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginBottom: '4px' }}>{label}</div>
                        <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--muted)', fontSize: '.85rem', textAlign: 'center', padding: '12px 0' }}>
                    Data wordt morgen gesynchroniseerd
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
