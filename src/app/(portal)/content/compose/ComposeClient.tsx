'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const PLATFORM_ICONS: Record<string, { icon: string; label: string; color: string; bg: string; maxChars: number; mediaType: string }> = {
  instagram: { icon: '📸', label: 'Instagram', color: '#e1306c', bg: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', maxChars: 2200, mediaType: 'image/video' },
  facebook: { icon: '📘', label: 'Facebook', color: '#1877f2', bg: '#1877f2', maxChars: 63206, mediaType: 'image/video' },
  linkedin: { icon: '💼', label: 'LinkedIn', color: '#0077b5', bg: '#0077b5', maxChars: 3000, mediaType: 'image/video' },
  tiktok: { icon: '🎵', label: 'TikTok', color: '#010101', bg: 'linear-gradient(135deg,#010101,#69c9d0)', maxChars: 2200, mediaType: 'video' },
  youtube: { icon: '▶️', label: 'YouTube', color: '#ff0000', bg: '#ff0000', maxChars: 5000, mediaType: 'video' },
}

interface Props {
  socialAccounts: any[]
  clients: any[]
  mediaAssets: any[]
  agencyId: string
  userId: string
}

export default function ComposeClient({ socialAccounts, clients, mediaAssets, agencyId, userId }: Props) {
  const router = useRouter()
  const [caption, setCaption] = useState('')
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [scheduledAt, setScheduledAt] = useState('')
  const [publishNow, setPublishNow] = useState(false)
  const [clientId, setClientId] = useState('')
  const [uploadedMedia, setUploadedMedia] = useState<{ url: string; type: string; name: string }[]>([])
  const [showMediaLibrary, setShowMediaLibrary] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [previewPlatform, setPreviewPlatform] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 4000) }

  const selectedPlatforms = [...new Set(selectedAccounts.map(id => socialAccounts.find(a => a.id === id)?.platform).filter(Boolean) as string[])]

  useEffect(() => {
    if (!previewPlatform && selectedPlatforms.length > 0) {
      setPreviewPlatform(selectedPlatforms[0])
    }
  }, [selectedPlatforms.join(',')])
  const maxChars = selectedPlatforms.length > 0
    ? Math.min(...selectedPlatforms.map(p => PLATFORM_ICONS[p]?.maxChars || 2200))
    : 2200

  function toggleAccount(accountId: string) {
    setSelectedAccounts(prev =>
      prev.includes(accountId) ? prev.filter(id => id !== accountId) : [...prev, accountId]
    )
  }

  async function uploadMedia(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploading(true)

    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${agencyId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage.from('media-library').upload(path, file)
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('media-library').getPublicUrl(path)

        // Save to media_assets
        await supabase.from('media_assets').insert({
          agency_id: agencyId,
          client_id: clientId || null,
          uploaded_by: userId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: path,
        })

        setUploadedMedia(prev => [...prev, { url: publicUrl, type: file.type, name: file.name }])
      }
    }
    setUploading(false)
    showToast(`${files.length} bestand(en) geüpload!`)
  }

  function addFromLibrary(asset: any) {
    const { data: { publicUrl } } = supabase.storage.from('media-library').getPublicUrl(asset.storage_path)
    setUploadedMedia(prev => [...prev, { url: publicUrl, type: asset.file_type, name: asset.file_name }])
    setShowMediaLibrary(false)
  }

  async function savePost(status: 'draft' | 'scheduled' | 'published') {
    if (selectedAccounts.length === 0) { showToast('Selecteer minimaal 1 account'); return }
    if (!caption.trim() && uploadedMedia.length === 0) { showToast('Voeg tekst of media toe'); return }
    if (status === 'scheduled' && !scheduledAt) { showToast('Kies een datum en tijd'); return }

    setPublishing(true)

    const platforms = selectedAccounts.map(id => ({
      account_id: id,
      platform: socialAccounts.find(a => a.id === id)?.platform,
      post_type: 'feed',
    }))

    const { data: post, error } = await supabase.from('scheduled_posts').insert({
      agency_id: agencyId,
      client_id: clientId || null,
      created_by: userId,
      content_text: caption,
      media_urls: uploadedMedia.map(m => m.url),
      platforms,
      scheduled_at: scheduledAt || null,
      status,
      approval_status: 'pending',
    }).select().single()

    if (error) { showToast('Fout bij opslaan: ' + error.message); setPublishing(false); return }

    if (status === 'published' && post) {
      // Trigger publishing via Edge Function
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/publish-post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ postId: post.id }),
      })
      showToast('Post wordt gepubliceerd!')
    } else if (status === 'scheduled') {
      showToast('Post gepland! ✅')
    } else {
      showToast('Concept opgeslagen')
    }

    setPublishing(false)
    router.push('/content')
  }

  const previewAccount = previewPlatform ? socialAccounts.find(a => a.platform === previewPlatform) : null

  return (
    <div className="animate-fade-up">
      {toast && (
        <div style={{ position: 'fixed', top: '80px', right: '24px', zIndex: 1000, background: 'var(--accent1)', color: '#fff', padding: '12px 20px', borderRadius: 'var(--radius-sm)', fontSize: '.85rem', fontWeight: 600, boxShadow: '0 4px 20px rgba(26,63,228,.3)' }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
        {/* Left: Composer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Account selector */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', boxShadow: '0 2px 12px rgba(26,63,228,.06)' }}>
            <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.95rem', marginBottom: '14px' }}>
              Publiceren naar
            </div>
            {socialAccounts.length === 0 ? (
              <div style={{ padding: '16px', background: 'rgba(26,63,228,.05)', borderRadius: 'var(--radius-sm)', fontSize: '.85rem', color: 'var(--muted)', textAlign: 'center' }}>
                Geen accounts gekoppeld. <a href="/settings/integrations" style={{ color: 'var(--accent1)' }}>Koppel een account →</a>
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {socialAccounts.map(account => {
                  const cfg = PLATFORM_ICONS[account.platform]
                  const isSelected = selectedAccounts.includes(account.id)
                  return (
                    <button
                      key={account.id}
                      onClick={() => toggleAccount(account.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 14px', borderRadius: '50px',
                        border: `2px solid ${isSelected ? cfg?.color || 'var(--accent1)' : 'var(--border)'}`,
                        background: isSelected ? `${cfg?.color}15` || 'rgba(26,63,228,.08)' : 'var(--bg)',
                        cursor: 'pointer', transition: 'all .15s',
                      }}
                    >
                      <span>{cfg?.icon}</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '.82rem', fontWeight: 600 }}>{cfg?.label}</div>
                        {account.platform_username && <div style={{ fontSize: '.68rem', color: 'var(--muted)' }}>@{account.platform_username}</div>}
                      </div>
                      {isSelected && <span style={{ fontSize: '.7rem', color: cfg?.color || 'var(--accent1)' }}>✓</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Caption */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', boxShadow: '0 2px 12px rgba(26,63,228,.06)' }}>
            <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.95rem', marginBottom: '12px' }}>Caption</div>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Schrijf je caption hier...

Tip: gebruik #hashtags en @mentions"
              rows={8}
              style={{
                width: '100%', padding: '12px', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', fontSize: '.9rem', lineHeight: 1.6,
                background: 'var(--bg)', outline: 'none', resize: 'vertical', fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '.75rem', color: caption.length > maxChars * 0.9 ? '#e53935' : 'var(--muted)' }}>
              <span>{caption.length}/{maxChars} tekens</span>
              {selectedPlatforms.length > 0 && (
                <span>Platform limiet: {selectedPlatforms.map(p => PLATFORM_ICONS[p]?.label).join(', ')}</span>
              )}
            </div>
          </div>

          {/* Media */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', boxShadow: '0 2px 12px rgba(26,63,228,.06)' }}>
            <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.95rem', marginBottom: '12px' }}>Media</div>

            {uploadedMedia.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                {uploadedMedia.map((media, i) => (
                  <div key={i} style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', aspectRatio: '1', background: 'var(--card2)' }}>
                    {media.type.startsWith('video') ? (
                      <video src={media.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <img src={media.url} alt={media.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                    <button
                      onClick={() => setUploadedMedia(prev => prev.filter((_, j) => j !== i))}
                      style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,.7)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      ×
                    </button>
                    {media.type.startsWith('video') && (
                      <div style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(0,0,0,.7)', color: '#fff', fontSize: '.6rem', padding: '1px 5px', borderRadius: '3px' }}>VIDEO</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <label style={{
                flex: 1, padding: '12px', border: `2px dashed var(--border)`, borderRadius: 'var(--radius-sm)',
                cursor: 'pointer', textAlign: 'center', fontSize: '.85rem', color: 'var(--muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                {uploading ? 'Uploaden...' : '📁 Bestand uploaden'}
                <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={uploadMedia} style={{ display: 'none' }} />
              </label>
              <button
                onClick={() => setShowMediaLibrary(true)}
                style={{ padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '.82rem', fontWeight: 600, color: 'var(--muted)' }}
              >
                🖼️ Bibliotheek
              </button>
            </div>
          </div>

          {/* Scheduling */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', boxShadow: '0 2px 12px rgba(26,63,228,.06)' }}>
            <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.95rem', marginBottom: '14px' }}>Planning</div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {[
                { key: false, label: '📅 Inplannen' },
                { key: true, label: '🚀 Nu publiceren' },
              ].map(({ key, label }) => (
                <button key={String(key)} onClick={() => setPublishNow(key)} style={{
                  flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  background: publishNow === key ? 'var(--accent1)' : 'var(--bg)',
                  color: publishNow === key ? '#fff' : 'var(--muted)',
                  fontWeight: 600, fontSize: '.85rem', border: publishNow === key ? 'none' : '1px solid var(--border)',
                }}>
                  {label}
                </button>
              ))}
            </div>
            {!publishNow && (
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.9rem', background: 'var(--bg)', outline: 'none' }}
              />
            )}
            <div style={{ marginTop: '12px' }}>
              <label style={{ fontSize: '.8rem', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Klant (optioneel)</label>
              <select value={clientId} onChange={e => setClientId(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.88rem', background: 'var(--bg)', outline: 'none' }}>
                <option value="">Intern / Geen klant</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => savePost('draft')} disabled={publishing} style={{ flex: 1, padding: '12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: '.9rem' }}>
              Concept opslaan
            </button>
            <button
              onClick={() => savePost(publishNow ? 'published' : 'scheduled')}
              disabled={publishing || selectedAccounts.length === 0}
              style={{
                flex: 2, padding: '12px', background: 'var(--accent1)', color: '#fff', border: 'none',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700, fontSize: '.9rem',
                opacity: selectedAccounts.length === 0 ? .5 : 1,
                boxShadow: '0 4px 16px rgba(26,63,228,.3)',
              }}
            >
              {publishing ? 'Bezig...' : publishNow ? '🚀 Nu publiceren' : '📅 Inplannen'}
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div style={{ position: 'sticky', top: '80px' }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', boxShadow: '0 2px 12px rgba(26,63,228,.06)' }}>
            <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.95rem', marginBottom: '14px' }}>Preview</div>

            {/* Platform tabs */}
            {selectedPlatforms.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
                {selectedPlatforms.map(p => {
                  const cfg = PLATFORM_ICONS[p]
                  return (
                    <button key={p} onClick={() => setPreviewPlatform(p)} style={{
                      padding: '5px 12px', borderRadius: '50px', border: 'none', cursor: 'pointer', fontSize: '.78rem', fontWeight: 600,
                      background: previewPlatform === p ? cfg.color : 'var(--bg)',
                      color: previewPlatform === p ? '#fff' : 'var(--muted)',
                    }}>
                      {cfg.icon} {cfg.label}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Phone mockup */}
            <div style={{ background: '#000', borderRadius: '28px', padding: '12px', boxShadow: '0 20px 60px rgba(0,0,0,.3)', maxWidth: '320px', margin: '0 auto' }}>
              <div style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', minHeight: '400px' }}>
                {previewPlatform ? (
                  <div>
                    {/* Platform header */}
                    <div style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: PLATFORM_ICONS[previewPlatform]?.bg || '#ddd',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.9rem',
                      }}>
                        {PLATFORM_ICONS[previewPlatform]?.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: '.78rem', fontWeight: 700, color: '#000' }}>
                          {previewAccount?.platform_username ? `@${previewAccount.platform_username}` : 'jouw_account'}
                        </div>
                        <div style={{ fontSize: '.65rem', color: '#888' }}>Gesponsord</div>
                      </div>
                      <span style={{ marginLeft: 'auto', fontSize: '1.2rem', color: '#000' }}>···</span>
                    </div>

                    {/* Media preview */}
                    {uploadedMedia.length > 0 ? (
                      <div style={{ aspectRatio: '1', background: '#000', position: 'relative', overflow: 'hidden' }}>
                        {uploadedMedia[0].type.startsWith('video') ? (
                          <video src={uploadedMedia[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls />
                        ) : (
                          <img src={uploadedMedia[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                        {uploadedMedia.length > 1 && (
                          <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,.7)', color: '#fff', padding: '2px 8px', borderRadius: '50px', fontSize: '.7rem' }}>
                            1/{uploadedMedia.length}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ aspectRatio: '1', background: '#f8f8f8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '2rem' }}>
                        🖼️
                      </div>
                    )}

                    {/* Caption preview */}
                    <div style={{ padding: '12px' }}>
                      <div style={{ fontSize: '.75rem', color: '#000', lineHeight: 1.5, maxHeight: '80px', overflow: 'hidden' }}>
                        <strong style={{ marginRight: '4px' }}>{previewAccount?.platform_username || 'account'}</strong>
                        {caption || <span style={{ color: '#ccc' }}>Caption verschijnt hier...</span>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: '#ccc', fontSize: '.85rem', textAlign: 'center', padding: '20px' }}>
                    Selecteer een account<br />om de preview te zien
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Media library modal */}
      {showMediaLibrary && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,20,51,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}
          onClick={e => e.target === e.currentTarget && setShowMediaLibrary(false)}>
          <div style={{ background: 'var(--card)', borderRadius: 'var(--radius)', padding: '24px', width: '100%', maxWidth: '640px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700 }}>Media bibliotheek</h3>
              <button onClick={() => setShowMediaLibrary(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--muted)' }}>×</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {mediaAssets.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
                  {mediaAssets.map(asset => (
                    <div
                      key={asset.id}
                      onClick={() => addFromLibrary(asset)}
                      style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', aspectRatio: '1', background: 'var(--card2)', cursor: 'pointer', position: 'relative' }}
                    >
                      {asset.file_type.startsWith('video') ? (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff', fontSize: '1.5rem' }}>🎬</div>
                      ) : (
                        <img src={supabase.storage.from('media-library').getPublicUrl(asset.storage_path).data.publicUrl} alt={asset.file_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', transition: 'background .15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(26,63,228,.3)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0)'}
                      >
                        <span style={{ color: '#fff', fontSize: '1.2rem', opacity: 0 }}>+</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '48px', color: 'var(--muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🖼️</div>
                  <div>Bibliotheek is leeg — upload eerst media</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
