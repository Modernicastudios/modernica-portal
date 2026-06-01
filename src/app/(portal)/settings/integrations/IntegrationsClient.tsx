'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: '📸', color: '#e1306c', bg: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', description: 'Posts, Stories, Reels, Insights', scope: 'instagram_basic,instagram_content_publish,instagram_manage_insights,pages_show_list' },
  { key: 'facebook', label: 'Facebook', icon: '📘', color: '#1877f2', bg: '#1877f2', description: 'Pages, Posts, Insights', scope: 'pages_show_list,pages_read_engagement,pages_manage_posts' },
  { key: 'linkedin', label: 'LinkedIn', icon: '💼', color: '#0077b5', bg: '#0077b5', description: 'Company pages, Posts, Analytics', scope: 'openid,profile,w_member_social,r_organization_social' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵', color: '#010101', bg: 'linear-gradient(135deg,#010101,#69c9d0)', description: 'Video uploads, Analytics', scope: 'user.info.basic,video.publish' },
  { key: 'youtube', label: 'YouTube', icon: '▶️', color: '#ff0000', bg: '#ff0000', description: 'Video uploads, Analytics', scope: 'youtube,youtube.upload,yt-analytics.readonly' },
]

const AD_PLATFORMS = [
  { key: 'meta_ads', label: 'Meta Ads', icon: '📘', color: '#1877f2', description: 'Facebook & Instagram advertenties', note: 'Via Facebook Marketing API' },
  { key: 'google_ads', label: 'Google Ads', icon: '🔍', color: '#ea4335', description: 'Search, Display, Shopping campagnes', note: 'Via Google Ads API' },
  { key: 'tiktok_ads', label: 'TikTok Ads', icon: '🎵', color: '#010101', description: 'TikTok advertentie campagnes', note: 'Via TikTok Marketing API' },
  { key: 'linkedin_ads', label: 'LinkedIn Ads', icon: '💼', color: '#0077b5', description: 'LinkedIn Sponsored Content', note: 'Via LinkedIn Marketing API' },
]

interface Props {
  socialAccounts: any[]
  adAccounts: any[]
  agencyId: string
  userId: string
}

export default function IntegrationsClient({ socialAccounts, adAccounts, agencyId, userId }: Props) {
  const [socialList, setSocialList] = useState(socialAccounts)
  const [adList, setAdList] = useState(adAccounts)
  const [toast, setToast] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  const supabase = createClient()
  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 4000) }

  function getConnectedSocial(platform: string) {
    return socialList.filter(a => a.platform === platform)
  }

  function getConnectedAd(platform: string) {
    return adList.filter(a => a.platform === platform)
  }

  function handleOAuthConnect(platform: string, type: 'social' | 'ads') {
    // In productie: redirect naar /api/social/connect/[platform] of /api/ads/connect/[platform]
    // Dit start de OAuth flow op de server
    const endpoint = type === 'social'
      ? `/api/social/connect/${platform}?agency_id=${agencyId}&user_id=${userId}`
      : `/api/ads/connect/${platform}?agency_id=${agencyId}&user_id=${userId}`
    window.location.href = endpoint
  }

  async function disconnectSocial(accountId: string) {
    setDisconnecting(accountId)
    await supabase.from('social_accounts').update({ is_active: false }).eq('id', accountId)
    setSocialList(prev => prev.filter(a => a.id !== accountId))
    showToast('Account losgekoppeld')
    setDisconnecting(null)
  }

  async function disconnectAd(accountId: string) {
    setDisconnecting(accountId)
    await supabase.from('ad_accounts').update({ is_active: false }).eq('id', accountId)
    setAdList(prev => prev.filter(a => a.id !== accountId))
    showToast('Account losgekoppeld')
    setDisconnecting(null)
  }

  return (
    <div className="animate-fade-up">
      {toast && (
        <div style={{ position: 'fixed', top: '80px', right: '24px', zIndex: 1000, background: 'var(--accent1)', color: '#fff', padding: '12px 20px', borderRadius: 'var(--radius-sm)', fontSize: '.85rem', fontWeight: 600, boxShadow: 'var(--shadow-lg)' }}>
          {toast}
        </div>
      )}

      {/* Social media */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '28px', marginBottom: '24px', boxShadow: 'var(--shadow)' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>📱 Social Media</h3>
          <p style={{ color: 'var(--muted)', fontSize: '.85rem' }}>Koppel accounts om te posten en analytics te bekijken</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {SOCIAL_PLATFORMS.map(pl => {
            const connected = getConnectedSocial(pl.key)
            const isConnected = connected.length > 0

            return (
              <div key={pl.key} style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '16px', borderRadius: 'var(--radius-sm)',
                border: `1px solid ${isConnected ? 'rgba(0,166,125,.2)' : 'var(--border)'}`,
                background: isConnected ? 'rgba(0,166,125,.03)' : 'var(--bg)',
              }}>
                {/* Platform icon */}
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: pl.bg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0,
                }}>
                  {pl.icon}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: '2px' }}>{pl.label}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--muted)' }}>{pl.description}</div>
                  {isConnected && connected.map(acc => (
                    <div key={acc.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '6px', background: 'rgba(0,166,125,.1)', padding: '3px 10px', borderRadius: '50px', fontSize: '.72rem', color: '#00a67d', fontWeight: 600 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00a67d' }} />
                      {acc.platform_username ? `@${acc.platform_username}` : 'Gekoppeld'}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  {isConnected ? (
                    <>
                      <button
                        onClick={() => handleOAuthConnect(pl.key, 'social')}
                        style={{ padding: '7px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.78rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        + Nog een
                      </button>
                      {connected.map(acc => (
                        <button
                          key={acc.id}
                          onClick={() => disconnectSocial(acc.id)}
                          disabled={disconnecting === acc.id}
                          style={{ padding: '7px 14px', background: 'rgba(229,57,53,.08)', color: '#e53935', border: '1px solid rgba(229,57,53,.2)', borderRadius: 'var(--radius-sm)', fontSize: '.78rem', cursor: 'pointer', fontWeight: 600 }}
                        >
                          {disconnecting === acc.id ? '...' : 'Ontkoppelen'}
                        </button>
                      ))}
                    </>
                  ) : (
                    <button
                      onClick={() => handleOAuthConnect(pl.key, 'social')}
                      style={{
                        padding: '9px 20px', background: pl.color, color: '#fff',
                        border: 'none', borderRadius: 'var(--radius-sm)',
                        fontSize: '.85rem', cursor: 'pointer', fontWeight: 700,
                        boxShadow: `0 4px 12px ${pl.color}40`,
                      }}
                    >
                      Koppelen
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Ad platforms */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '28px', boxShadow: 'var(--shadow)' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>📊 Advertentieplatformen</h3>
          <p style={{ color: 'var(--muted)', fontSize: '.85rem' }}>Koppel je ad accounts voor automatische data synchronisatie</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {AD_PLATFORMS.map(pl => {
            const connected = getConnectedAd(pl.key)
            const isConnected = connected.length > 0

            return (
              <div key={pl.key} style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '16px', borderRadius: 'var(--radius-sm)',
                border: `1px solid ${isConnected ? 'rgba(0,166,125,.2)' : 'var(--border)'}`,
                background: isConnected ? 'rgba(0,166,125,.03)' : 'var(--bg)',
              }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: pl.color, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0,
                }}>
                  {pl.icon}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: '2px' }}>{pl.label}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginBottom: '2px' }}>{pl.description}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--muted)', fontStyle: 'italic' }}>{pl.note}</div>
                  {isConnected && connected.map(acc => (
                    <div key={acc.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '6px', background: 'rgba(0,166,125,.1)', padding: '3px 10px', borderRadius: '50px', fontSize: '.72rem', color: '#00a67d', fontWeight: 600 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00a67d' }} />
                      {acc.platform_account_name || 'Gekoppeld'}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  {isConnected ? (
                    connected.map(acc => (
                      <button
                        key={acc.id}
                        onClick={() => disconnectAd(acc.id)}
                        disabled={disconnecting === acc.id}
                        style={{ padding: '7px 14px', background: 'rgba(229,57,53,.08)', color: '#e53935', border: '1px solid rgba(229,57,53,.2)', borderRadius: 'var(--radius-sm)', fontSize: '.78rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        {disconnecting === acc.id ? '...' : 'Ontkoppelen'}
                      </button>
                    ))
                  ) : (
                    <button
                      onClick={() => handleOAuthConnect(pl.key, 'ads')}
                      style={{
                        padding: '9px 20px', background: pl.color, color: '#fff',
                        border: 'none', borderRadius: 'var(--radius-sm)',
                        fontSize: '.85rem', cursor: 'pointer', fontWeight: 700,
                        boxShadow: `0 4px 12px ${pl.color}40`,
                      }}
                    >
                      Koppelen
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Info banner */}
        <div style={{ marginTop: '20px', padding: '14px 16px', background: 'rgba(26,63,228,.05)', border: '1px solid rgba(26,63,228,.1)', borderRadius: 'var(--radius-sm)', fontSize: '.82rem', color: 'var(--muted)' }}>
          ℹ️ <strong>OAuth koppeling</strong> — Na het klikken op "Koppelen" word je doorgestuurd naar het platform om toestemming te geven. De OAuth API routes moeten nog geconfigureerd worden met de platform API keys.
        </div>
      </div>
    </div>
  )
}
