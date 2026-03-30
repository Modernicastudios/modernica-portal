'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  agency: any
  brandKit: any
  agencyId: string
}

export default function AgencySettingsClient({ agency, brandKit: initialBrandKit, agencyId }: Props) {
  const [agencyForm, setAgencyForm] = useState({ name: agency?.name || '', slug: agency?.slug || '' })
  const [brandForm, setBrandForm] = useState({
    primary_color: initialBrandKit?.primary_color || '#1a3fe4',
    secondary_color: initialBrandKit?.secondary_color || '#4f7bff',
    logo_url: initialBrandKit?.logo_url || '',
    contact_email: initialBrandKit?.contact_email || '',
    welcome_message: initialBrandKit?.welcome_message || '',
    welcome_subtitle: initialBrandKit?.welcome_subtitle || '',
    instagram_handle: initialBrandKit?.instagram_handle || '',
    tiktok_handle: initialBrandKit?.tiktok_handle || '',
    linkedin_handle: initialBrandKit?.linkedin_handle || '',
    youtube_handle: initialBrandKit?.youtube_handle || '',
    facebook_handle: initialBrandKit?.facebook_handle || '',
  })
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const supabase = createClient()
  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  async function saveAgency() {
    setSaving(true)
    const { error: agErr } = await supabase.from('agencies').update({ name: agencyForm.name }).eq('id', agencyId)
    const { error: bkErr } = await supabase.from('brand_kits').upsert({ ...brandForm, agency_id: agencyId }, { onConflict: 'agency_id' })
    if (!agErr && !bkErr) showToast('Instellingen opgeslagen!')
    setSaving(false)
  }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    const ext = file.name.split('.').pop()
    const path = `${agencyId}/logo.${ext}`
    const { error } = await supabase.storage.from('agency-assets').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('agency-assets').getPublicUrl(path)
      setBrandForm(p => ({ ...p, logo_url: publicUrl }))
      showToast('Logo geüpload!')
    }
    setUploadingLogo(false)
  }

  const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.88rem', background: 'var(--bg)', outline: 'none' }
  const labelStyle = { fontSize: '.8rem', fontWeight: 600 as const, display: 'block' as const, marginBottom: '5px' }
  const cardStyle = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '28px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(26,63,228,.06)' }

  return (
    <div className="animate-fade-up" style={{ maxWidth: '700px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '80px', right: '24px', zIndex: 1000, background: 'var(--accent1)', color: '#fff', padding: '12px 20px', borderRadius: 'var(--radius-sm)', fontSize: '.85rem', fontWeight: 600, boxShadow: '0 4px 20px rgba(26,63,228,.3)' }}>
          {toast}
        </div>
      )}

      {/* Agency info */}
      <div style={cardStyle}>
        <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '20px' }}>Agency gegevens</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Agency naam</label>
            <input value={agencyForm.name} onChange={e => setAgencyForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Agency URL (slug)</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input value={agencyForm.slug} disabled style={{ ...inputStyle, borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)', borderRight: 'none', opacity: .7 }} />
              <span style={{ padding: '10px 12px', background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', fontSize: '.8rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                .modernicaportal.com
              </span>
            </div>
            <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '4px' }}>De slug kan niet worden gewijzigd na registratie</div>
          </div>
        </div>
      </div>

      {/* Branding */}
      <div style={cardStyle}>
        <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '20px' }}>Branding & White-label</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Logo */}
          <div>
            <label style={labelStyle}>Logo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {brandForm.logo_url && (
                <img src={brandForm.logo_url} alt="Logo" style={{ height: '40px', objectFit: 'contain', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '4px', background: '#fff' }} />
              )}
              <label style={{ display: 'inline-block', padding: '9px 16px', background: 'var(--card2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '.85rem', fontWeight: 600 }}>
                {uploadingLogo ? 'Uploaden...' : 'Logo uploaden'}
                <input type="file" accept="image/*" onChange={uploadLogo} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          {/* Colors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Primaire kleur</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="color" value={brandForm.primary_color} onChange={e => setBrandForm(p => ({ ...p, primary_color: e.target.value }))} style={{ width: '40px', height: '40px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: '2px' }} />
                <input value={brandForm.primary_color} onChange={e => setBrandForm(p => ({ ...p, primary_color: e.target.value }))} style={{ ...inputStyle, flex: 1 }} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Secundaire kleur</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="color" value={brandForm.secondary_color} onChange={e => setBrandForm(p => ({ ...p, secondary_color: e.target.value }))} style={{ width: '40px', height: '40px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: '2px' }} />
                <input value={brandForm.secondary_color} onChange={e => setBrandForm(p => ({ ...p, secondary_color: e.target.value }))} style={{ ...inputStyle, flex: 1 }} />
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div style={{ background: brandForm.primary_color, borderRadius: 'var(--radius-sm)', padding: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {brandForm.logo_url ? (
              <img src={brandForm.logo_url} alt="" style={{ height: '28px', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800 }}>{agencyForm.name}</span>
            )}
            <span style={{ fontSize: '.78rem', opacity: .8 }}>← Live preview</span>
          </div>

          <div>
            <label style={labelStyle}>Contact e-mail</label>
            <input value={brandForm.contact_email} onChange={e => setBrandForm(p => ({ ...p, contact_email: e.target.value }))} placeholder="info@jouwagency.nl" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Welkomstbericht (login)</label>
              <input value={brandForm.welcome_message} onChange={e => setBrandForm(p => ({ ...p, welcome_message: e.target.value }))} placeholder="Welkom bij ons portaal" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Ondertitel</label>
              <input value={brandForm.welcome_subtitle} onChange={e => setBrandForm(p => ({ ...p, welcome_subtitle: e.target.value }))} placeholder="Log in om te beginnen" style={inputStyle} />
            </div>
          </div>
        </div>
      </div>

      {/* Social handles */}
      <div style={cardStyle}>
        <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '20px' }}>Social media handles</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { key: 'instagram_handle', icon: '📸', label: 'Instagram', placeholder: '@jouwagency' },
            { key: 'tiktok_handle', icon: '🎵', label: 'TikTok', placeholder: '@jouwagency' },
            { key: 'linkedin_handle', icon: '💼', label: 'LinkedIn', placeholder: 'linkedin.com/company/...' },
            { key: 'youtube_handle', icon: '▶️', label: 'YouTube', placeholder: '@jouwagency' },
            { key: 'facebook_handle', icon: '📘', label: 'Facebook', placeholder: 'facebook.com/...' },
          ].map(({ key, icon, label, placeholder }) => (
            <div key={key}>
              <label style={labelStyle}>{icon} {label}</label>
              <input value={(brandForm as any)[key]} onChange={e => setBrandForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} style={inputStyle} />
            </div>
          ))}
        </div>
      </div>

      <button onClick={saveAgency} disabled={saving} style={{ width: '100%', padding: '13px', background: 'var(--accent1)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700, fontSize: '.95rem' }}>
        {saving ? 'Opslaan...' : 'Alle instellingen opslaan'}
      </button>
    </div>
  )
}
