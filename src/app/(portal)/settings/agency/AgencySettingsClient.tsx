'use client'

import { useState, useRef, CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Building2, Upload, Globe, Mail, Phone, MapPin,
  Hash, Palette, Save, Check, AlertTriangle,
  ImageIcon, ExternalLink,
} from 'lucide-react'

interface Props {
  agency: any
  brandKit: any
  agencyId: string
}

const cardStyle: CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  marginBottom: '20px',
  overflow: 'hidden',
  boxShadow: '0 1px 6px rgba(26,63,228,.05)',
}

const cardHeaderStyle: CSSProperties = {
  padding: '16px 24px',
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
}

const cardBodyStyle: CSSProperties = {
  padding: '24px',
}

const labelStyle: CSSProperties = {
  fontSize: '.78rem',
  fontWeight: 600,
  color: 'var(--muted)',
  display: 'block',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '.05em',
}

function inputStyle(disabled = false): CSSProperties {
  return {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '.88rem',
    background: 'var(--bg)',
    color: disabled ? 'var(--muted)' : 'var(--text)',
    outline: 'none',
    cursor: disabled ? 'not-allowed' : 'text',
    opacity: disabled ? .7 : 1,
    boxSizing: 'border-box' as const,
  }
}

// Social platform metadata (no emoji icons)
const SOCIAL_PLATFORMS = [
  { key: 'instagram_handle', label: 'Instagram', placeholder: '@jouwagency' },
  { key: 'tiktok_handle', label: 'TikTok', placeholder: '@jouwagency' },
  { key: 'linkedin_handle', label: 'LinkedIn', placeholder: 'linkedin.com/company/...' },
  { key: 'youtube_handle', label: 'YouTube', placeholder: '@jouwagency' },
  { key: 'facebook_handle', label: 'Facebook', placeholder: 'facebook.com/...' },
]

export default function AgencySettingsClient({ agency, brandKit: initialBrandKit, agencyId }: Props) {
  const [agencyForm, setAgencyForm] = useState({
    name: agency?.name || '',
    website: agency?.website || '',
    email: agency?.email || '',
    phone: agency?.phone || '',
    address: agency?.address || '',
    vat_number: agency?.vat_number || '',
    slug: agency?.slug || '',
  })
  const [brandForm, setBrandForm] = useState({
    primary_color: initialBrandKit?.primary_color || '#1a3fe4',
    secondary_color: initialBrandKit?.secondary_color || '#4f7bff',
    logo_url: initialBrandKit?.logo_url || '',
    contact_email: initialBrandKit?.contact_email || '',
    email_signature: initialBrandKit?.email_signature || '',
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
  const [isDragOver, setIsDragOver] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  async function saveAgency() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/agency', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: agencyForm.name, brand: brandForm }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) showToast('Instellingen opgeslagen')
      else showToast(data.error || 'Fout bij opslaan', false)
    } catch {
      showToast('Fout bij opslaan', false)
    } finally {
      setSaving(false)
    }
  }

  async function handleLogoFile(file: File) {
    if (!file) return
    setUploadingLogo(true)
    const ext = file.name.split('.').pop()
    const path = `${agencyId}/logo.${ext}`
    const { error } = await supabase.storage.from('agency-assets').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('agency-assets').getPublicUrl(path)
      setBrandForm(p => ({ ...p, logo_url: publicUrl }))
      showToast('Logo geüpload')
    }
    setUploadingLogo(false)
  }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) await handleLogoFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handleLogoFile(file)
  }

  return (
    <div style={{ maxWidth: '720px' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '80px', right: '24px', zIndex: 1000,
          background: toast.ok ? '#1a1a2e' : '#dc2626',
          color: '#fff', padding: '11px 18px', borderRadius: '10px',
          fontSize: '.84rem', fontWeight: 600,
          boxShadow: '0 4px 20px rgba(0,0,0,.2)',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          {toast.ok ? <Check size={14} /> : <AlertTriangle size={14} />}
          {toast.msg}
        </div>
      )}

      {/* ── Agency info ── */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <Building2 size={15} color="var(--muted)" />
          <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.88rem' }}>
            Agency gegevens
          </span>
        </div>
        <div style={cardBodyStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Agency naam</label>
              <input
                value={agencyForm.name}
                onChange={e => setAgencyForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Jouw Agency B.V."
                style={inputStyle()}
              />
            </div>

            <div>
              <label style={labelStyle}>Website</label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: '10px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--muted)',
                  display: 'flex', alignItems: 'center', pointerEvents: 'none',
                }}>
                  <Globe size={14} />
                </div>
                <input
                  value={agencyForm.website}
                  onChange={e => setAgencyForm(p => ({ ...p, website: e.target.value }))}
                  placeholder="https://jouwagency.nl"
                  style={{ ...inputStyle(), paddingLeft: '34px' }}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Contact e-mail</label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: '10px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--muted)',
                  display: 'flex', alignItems: 'center', pointerEvents: 'none',
                }}>
                  <Mail size={14} />
                </div>
                <input
                  value={agencyForm.email}
                  onChange={e => setAgencyForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="info@jouwagency.nl"
                  style={{ ...inputStyle(), paddingLeft: '34px' }}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Telefoonnummer</label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: '10px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--muted)',
                  display: 'flex', alignItems: 'center', pointerEvents: 'none',
                }}>
                  <Phone size={14} />
                </div>
                <input
                  value={agencyForm.phone}
                  onChange={e => setAgencyForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+31 20 1234567"
                  style={{ ...inputStyle(), paddingLeft: '34px' }}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>BTW nummer</label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: '10px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--muted)',
                  display: 'flex', alignItems: 'center', pointerEvents: 'none',
                }}>
                  <Hash size={14} />
                </div>
                <input
                  value={agencyForm.vat_number}
                  onChange={e => setAgencyForm(p => ({ ...p, vat_number: e.target.value }))}
                  placeholder="NL123456789B01"
                  style={{ ...inputStyle(), paddingLeft: '34px' }}
                />
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Adres</label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: '10px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--muted)',
                  display: 'flex', alignItems: 'center', pointerEvents: 'none',
                }}>
                  <MapPin size={14} />
                </div>
                <input
                  value={agencyForm.address}
                  onChange={e => setAgencyForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="Keizersgracht 1, 1015 CN Amsterdam"
                  style={{ ...inputStyle(), paddingLeft: '34px' }}
                />
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Agency URL (slug)</label>
              <div style={{ display: 'flex', alignItems: 'stretch' }}>
                <input
                  value={agencyForm.slug}
                  disabled
                  style={{
                    ...inputStyle(true),
                    borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)',
                    borderRight: 'none',
                  }}
                />
                <span style={{
                  padding: '10px 14px', background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                  fontSize: '.82rem', color: 'var(--muted)', whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                  .modernicaportal.com <ExternalLink size={11} />
                </span>
              </div>
              <div style={{ fontSize: '.73rem', color: 'var(--muted)', marginTop: '4px' }}>
                De slug kan niet worden gewijzigd na registratie
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Logo upload ── */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <ImageIcon size={15} color="var(--muted)" />
          <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.88rem' }}>
            Logo
          </span>
        </div>
        <div style={cardBodyStyle}>
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragOver ? 'var(--accent1)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)',
              padding: '32px',
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragOver ? 'rgba(26,63,228,.04)' : 'var(--bg)',
              transition: 'border-color .15s, background .15s',
            }}
          >
            {brandForm.logo_url ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <img
                  src={brandForm.logo_url}
                  alt="Logo"
                  style={{
                    maxHeight: '64px', maxWidth: '200px',
                    objectFit: 'contain',
                  }}
                />
                <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>
                  Klik of sleep om te vervangen
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: 'var(--muted)' }}>
                <Upload size={28} strokeWidth={1.3} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.88rem', color: 'var(--text)', marginBottom: '4px' }}>
                    {uploadingLogo ? 'Uploaden…' : 'Sleep je logo hierheen'}
                  </div>
                  <div style={{ fontSize: '.78rem' }}>
                    of klik om te bladeren — PNG, SVG, JPG (max 4 MB)
                  </div>
                </div>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={uploadLogo}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* ── Brand colors ── */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <Palette size={15} color="var(--muted)" />
          <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.88rem' }}>
            Merkkleur
          </span>
        </div>
        <div style={cardBodyStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {/* Primary color */}
            <div>
              <label style={labelStyle}>Primaire kleur</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="color"
                    value={brandForm.primary_color}
                    onChange={e => setBrandForm(p => ({ ...p, primary_color: e.target.value }))}
                    style={{
                      width: '42px', height: '42px', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                      padding: '2px', background: 'transparent',
                    }}
                  />
                </div>
                <input
                  value={brandForm.primary_color}
                  onChange={e => setBrandForm(p => ({ ...p, primary_color: e.target.value }))}
                  placeholder="#1a3fe4"
                  style={{ ...inputStyle(), flex: 1, fontFamily: 'monospace', fontSize: '.85rem' }}
                />
              </div>
            </div>

            {/* Secondary color */}
            <div>
              <label style={labelStyle}>Secundaire kleur</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={brandForm.secondary_color}
                  onChange={e => setBrandForm(p => ({ ...p, secondary_color: e.target.value }))}
                  style={{
                    width: '42px', height: '42px', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    padding: '2px', background: 'transparent',
                  }}
                />
                <input
                  value={brandForm.secondary_color}
                  onChange={e => setBrandForm(p => ({ ...p, secondary_color: e.target.value }))}
                  placeholder="#4f7bff"
                  style={{ ...inputStyle(), flex: 1, fontFamily: 'monospace', fontSize: '.85rem' }}
                />
              </div>
            </div>
          </div>

          {/* Live preview strip */}
          <div style={{
            borderRadius: 'var(--radius-sm)', overflow: 'hidden',
            border: '1px solid var(--border)',
          }}>
            <div style={{
              background: `linear-gradient(90deg, ${brandForm.primary_color}, ${brandForm.secondary_color})`,
              padding: '14px 20px',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              {brandForm.logo_url ? (
                <img src={brandForm.logo_url} alt="" style={{ height: '24px', objectFit: 'contain' }} />
              ) : (
                <span style={{
                  fontFamily: 'var(--font-syne), sans-serif',
                  fontWeight: 800, color: '#fff', fontSize: '.9rem',
                }}>
                  {agencyForm.name || 'Jouw Agency'}
                </span>
              )}
              <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.65)' }}>
                Live preview
              </span>
            </div>
            <div style={{
              padding: '12px 20px', background: 'var(--bg)',
              display: 'flex', gap: '6px',
            }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: brandForm.primary_color,
              }} />
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: brandForm.secondary_color,
              }} />
              <span style={{ fontSize: '.72rem', color: 'var(--muted)', marginLeft: '4px' }}>
                Merk kleuren
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Portal welcome ── */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <Globe size={15} color="var(--muted)" />
          <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.88rem' }}>
            Portaal instellingen
          </span>
        </div>
        <div style={cardBodyStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Welkomstbericht</label>
              <input
                value={brandForm.welcome_message}
                onChange={e => setBrandForm(p => ({ ...p, welcome_message: e.target.value }))}
                placeholder="Welkom bij ons portaal"
                style={inputStyle()}
              />
            </div>
            <div>
              <label style={labelStyle}>Ondertitel</label>
              <input
                value={brandForm.welcome_subtitle}
                onChange={e => setBrandForm(p => ({ ...p, welcome_subtitle: e.target.value }))}
                placeholder="Log in om te beginnen"
                style={inputStyle()}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Contact e-mail (portaal)</label>
              <input
                value={brandForm.contact_email}
                onChange={e => setBrandForm(p => ({ ...p, contact_email: e.target.value }))}
                placeholder="info@jouwagency.nl"
                style={inputStyle()}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>E-mailhandtekening (onder elke uitgaande leadmail)</label>
              <textarea
                value={brandForm.email_signature}
                onChange={e => setBrandForm(p => ({ ...p, email_signature: e.target.value }))}
                rows={5}
                placeholder={'Sjoerd Bom — Modernica Studios\nwww.modernicastudios.com\n06-12345678\ninfo@modernicastudios.com'}
                style={{ ...inputStyle(), resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
              />
              <div style={{ fontSize: '.76rem', color: 'var(--muted)', marginTop: '6px' }}>
                Eén keer instellen — komt overal hetzelfde onderaan. Websites, e-mailadressen en telefoonnummers worden in de verstuurde mail automatisch <strong>klikbaar</strong>.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Social handles ── */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <ExternalLink size={15} color="var(--muted)" />
          <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.88rem' }}>
            Social media
          </span>
        </div>
        <div style={cardBodyStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {SOCIAL_PLATFORMS.map(({ key, label, placeholder }) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input
                  value={(brandForm as any)[key]}
                  onChange={e => setBrandForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={inputStyle()}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <button
          onClick={saveAgency}
          disabled={saving}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '12px 28px', background: 'var(--accent1)',
            color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
            cursor: saving ? 'wait' : 'pointer', fontWeight: 700,
            fontSize: '.9rem', opacity: saving ? .7 : 1,
          }}
        >
          <Save size={15} />
          {saving ? 'Opslaan…' : 'Alle instellingen opslaan'}
        </button>
      </div>
    </div>
  )
}
