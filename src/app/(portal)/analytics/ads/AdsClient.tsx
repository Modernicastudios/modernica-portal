'use client'

import { useState } from 'react'
import Link from 'next/link'

const PLATFORMS = [
  { key: 'all', label: 'Alles', icon: '📊' },
  { key: 'meta_ads', label: 'Meta Ads', icon: '📘', color: '#1877f2' },
  { key: 'google_ads', label: 'Google Ads', icon: '🔍', color: '#ea4335' },
  { key: 'tiktok_ads', label: 'TikTok Ads', icon: '🎵', color: '#000' },
  { key: 'linkedin_ads', label: 'LinkedIn Ads', icon: '💼', color: '#0077b5' },
]

interface Props {
  adAccounts: any[]
  campaigns: any[]
  agencyId: string
}

export default function AdsClient({ adAccounts, campaigns, agencyId }: Props) {
  const [platform, setPlatform] = useState('all')

  const filteredCampaigns = platform === 'all'
    ? campaigns
    : campaigns.filter(c => c.ad_accounts?.platform === platform)

  function sumMetrics(campaign: any) {
    const metrics = campaign.ad_metrics || []
    return metrics.reduce((acc: any, m: any) => ({
      spend: acc.spend + (m.spend || 0),
      impressions: acc.impressions + (m.impressions || 0),
      clicks: acc.clicks + (m.clicks || 0),
      conversions: acc.conversions + (m.conversions || 0),
    }), { spend: 0, impressions: 0, clicks: 0, conversions: 0 })
  }

  const totalSpend = filteredCampaigns.reduce((sum, c) => sum + sumMetrics(c).spend, 0)
  const totalImpressions = filteredCampaigns.reduce((sum, c) => sum + sumMetrics(c).impressions, 0)
  const totalClicks = filteredCampaigns.reduce((sum, c) => sum + sumMetrics(c).clicks, 0)
  const avgRoas = filteredCampaigns.length > 0
    ? filteredCampaigns.reduce((sum, c) => {
        const m = c.ad_metrics?.[0]
        return sum + (m?.roas || 0)
      }, 0) / filteredCampaigns.length
    : 0

  const fmt = (n: number) => n.toLocaleString('nl-NL')
  const fmtEur = (n: number) => `€${n.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const platformLabel = (p: string) => PLATFORMS.find(pl => pl.key === p)?.label || p
  const platformIcon = (p: string) => PLATFORMS.find(pl => pl.key === p)?.icon || '📊'

  return (
    <div className="animate-fade-up">
      {/* No accounts state */}
      {adAccounts.length === 0 && (
        <div style={{
          background: 'linear-gradient(135deg, var(--accent1), #2d5fff)',
          borderRadius: 'var(--radius)', padding: '32px', marginBottom: '24px',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 8px 40px rgba(26,63,228,.3)',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.3rem', marginBottom: '8px' }}>
              Koppel je advertentieplatformen
            </div>
            <div style={{ opacity: .85, fontSize: '.9rem' }}>
              Verbind Meta Ads, Google Ads, TikTok Ads en meer met één klik
            </div>
          </div>
          <Link href="/settings/integrations" style={{
            background: '#fff', color: 'var(--accent1)', padding: '12px 24px',
            borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '.9rem', textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}>
            🔗 Koppelen
          </Link>
        </div>
      )}

      {/* Platform filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {PLATFORMS.map(pl => (
          <button key={pl.key} onClick={() => setPlatform(pl.key)} style={{
            padding: '6px 14px', borderRadius: '50px', fontSize: '.8rem', fontWeight: 600,
            cursor: 'pointer', border: 'none',
            background: platform === pl.key ? 'var(--accent1)' : 'var(--card)',
            color: platform === pl.key ? '#fff' : 'var(--muted)',
            boxShadow: platform === pl.key ? '0 2px 8px rgba(26,63,228,.25)' : 'none',
          }}>
            {pl.icon} {pl.label}
          </button>
        ))}
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Totaal uitgegeven', value: fmtEur(totalSpend), color: 'blue', icon: '💸' },
          { label: 'Vertoningen', value: fmt(totalImpressions), color: 'teal', icon: '👁️' },
          { label: 'Klikken', value: fmt(totalClicks), color: 'orange', icon: '🖱️' },
          { label: 'Gem. ROAS', value: `${avgRoas.toFixed(2)}x`, color: 'purple', icon: '📈' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            padding: '20px', position: 'relative', overflow: 'hidden', boxShadow: '0 2px 12px rgba(26,63,228,.07)',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '3px', borderRadius: 'var(--radius) var(--radius) 0 0',
              background: color === 'blue' ? 'linear-gradient(90deg,var(--accent1),var(--accent2))' :
                color === 'teal' ? 'linear-gradient(90deg,var(--accent3),#00dfc0)' :
                color === 'orange' ? 'linear-gradient(90deg,var(--accent4),#ffaa70)' :
                'linear-gradient(90deg,#7c5ff5,var(--accent1))',
            }} />
            <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '1.4rem', opacity: .25 }}>{icon}</div>
            <div style={{ fontSize: '.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '8px' }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.6rem' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Connected accounts */}
      {adAccounts.length > 0 && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(26,63,228,.06)' }}>
          <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.95rem', marginBottom: '12px' }}>Gekoppelde accounts</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {adAccounts.map(acc => (
              <div key={acc.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg)', padding: '8px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <span>{platformIcon(acc.platform)}</span>
                <div>
                  <div style={{ fontSize: '.82rem', fontWeight: 600 }}>{acc.platform_account_name || platformLabel(acc.platform)}</div>
                  <div style={{ fontSize: '.7rem', color: 'var(--muted)' }}>
                    {acc.last_synced_at ? `Gesynchroniseerd ${new Date(acc.last_synced_at).toLocaleDateString('nl-NL')}` : 'Nog niet gesynchroniseerd'}
                  </div>
                </div>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00a67d', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campaigns table */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: '0 2px 12px rgba(26,63,228,.06)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.95rem' }}>
            Campagnes {filteredCampaigns.length > 0 && `(${filteredCampaigns.length})`}
          </h3>
        </div>
        {filteredCampaigns.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg)' }}>
                  {['Platform', 'Campagne', 'Status', 'Uitgegeven', 'Vertoningen', 'Klikken', 'ROAS'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map(c => {
                  const m = sumMetrics(c)
                  const roas = c.ad_metrics?.[0]?.roas
                  return (
                    <tr key={c.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontSize: '.82rem' }}>{platformIcon(c.ad_accounts?.platform)} {platformLabel(c.ad_accounts?.platform || '')}</td>
                      <td style={{ padding: '12px 16px', fontSize: '.85rem', fontWeight: 600, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.campaign_name || 'Campagne'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '.72rem', padding: '3px 8px', borderRadius: '50px', background: c.status === 'ACTIVE' ? 'rgba(0,166,125,.1)' : 'rgba(107,120,168,.1)', color: c.status === 'ACTIVE' ? '#00a67d' : 'var(--muted)', fontWeight: 600 }}>
                          {c.status || 'Onbekend'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '.85rem' }}>{fmtEur(m.spend)}</td>
                      <td style={{ padding: '12px 16px', fontSize: '.85rem' }}>{fmt(m.impressions)}</td>
                      <td style={{ padding: '12px 16px', fontSize: '.85rem' }}>{fmt(m.clicks)}</td>
                      <td style={{ padding: '12px 16px', fontSize: '.85rem', fontWeight: 600, color: roas > 2 ? 'var(--accent3)' : 'var(--text)' }}>
                        {roas ? `${roas.toFixed(2)}x` : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📊</div>
            <div style={{ fontWeight: 600 }}>Geen campagnedata</div>
            <div style={{ fontSize: '.85rem', marginTop: '4px' }}>
              {adAccounts.length === 0 ? 'Koppel eerst een advertentieplatform' : 'Data wordt dagelijks gesynchroniseerd'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
