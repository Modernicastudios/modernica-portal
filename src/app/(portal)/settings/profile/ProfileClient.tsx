'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  profile: any
  email: string
}

export default function ProfileClient({ profile: initialProfile, email }: Props) {
  const [profile, setProfile] = useState(initialProfile)
  const [form, setForm] = useState({ full_name: initialProfile?.full_name || '', timezone: initialProfile?.timezone || 'Europe/Amsterdam' })
  const [password, setPassword] = useState({ current: '', new: '', confirm: '' })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const supabase = createClient()

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  async function saveProfile() {
    setSaving(true)
    const { error } = await supabase.from('user_profiles').update(form).eq('id', profile.id)
    if (!error) { setProfile((p: any) => ({ ...p, ...form })); showToast('Profiel opgeslagen!') }
    setSaving(false)
  }

  async function changePassword() {
    if (password.new !== password.confirm) { showToast('Wachtwoorden komen niet overeen'); return }
    if (password.new.length < 8) { showToast('Wachtwoord moet minimaal 8 tekens zijn'); return }
    const { error } = await supabase.auth.updateUser({ password: password.new })
    if (!error) { setPassword({ current: '', new: '', confirm: '' }); showToast('Wachtwoord gewijzigd!') }
    else showToast('Fout bij wijzigen wachtwoord')
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${profile.id}/avatar.${ext}`

    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('user_profiles').update({ avatar_url: publicUrl }).eq('id', profile.id)
      setProfile((p: any) => ({ ...p, avatar_url: publicUrl }))
      showToast('Profielfoto bijgewerkt!')
    }
    setUploading(false)
  }

  const initials = profile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  const cardStyle = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '28px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(26,63,228,.06)' }
  const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.9rem', background: 'var(--bg)', outline: 'none' }
  const labelStyle = { fontSize: '.8rem', fontWeight: 600 as const, display: 'block' as const, marginBottom: '6px' }

  return (
    <div className="animate-fade-up" style={{ maxWidth: '600px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '80px', right: '24px', zIndex: 1000, background: 'var(--accent1)', color: '#fff', padding: '12px 20px', borderRadius: 'var(--radius-sm)', fontSize: '.85rem', fontWeight: 600, boxShadow: '0 4px 20px rgba(26,63,228,.3)' }}>
          {toast}
        </div>
      )}

      {/* Avatar */}
      <div style={cardStyle}>
        <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '20px' }}>Profielfoto</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: profile?.avatar_url ? 'none' : 'linear-gradient(135deg, var(--accent1), var(--accent2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#fff',
            overflow: 'hidden', flexShrink: 0, border: '3px solid var(--border)',
          }}>
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </div>
          <div>
            <label style={{ display: 'inline-block', padding: '9px 18px', background: 'var(--accent1)', color: '#fff', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '.85rem', fontWeight: 600 }}>
              {uploading ? 'Uploaden...' : 'Foto wijzigen'}
              <input type="file" accept="image/*" onChange={uploadAvatar} style={{ display: 'none' }} />
            </label>
            <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: '6px' }}>JPG, PNG of GIF — max 2MB</div>
          </div>
        </div>
      </div>

      {/* Profile info */}
      <div style={cardStyle}>
        <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '20px' }}>Persoonlijke gegevens</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Volledige naam</label>
            <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>E-mailadres</label>
            <input value={email} disabled style={{ ...inputStyle, opacity: .6, cursor: 'not-allowed' }} />
          </div>
          <div>
            <label style={labelStyle}>Tijdzone</label>
            <select value={form.timezone} onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))} style={inputStyle}>
              <option value="Europe/Amsterdam">Amsterdam (CET/CEST)</option>
              <option value="Europe/London">Londen (GMT/BST)</option>
              <option value="America/New_York">New York (EST/EDT)</option>
            </select>
          </div>
          <button onClick={saveProfile} disabled={saving} style={{ padding: '11px', background: 'var(--accent1)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: '.9rem' }}>
            {saving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      </div>

      {/* Password */}
      <div style={cardStyle}>
        <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '20px' }}>Wachtwoord wijzigen</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Nieuw wachtwoord</label>
            <input type="password" value={password.new} onChange={e => setPassword(p => ({ ...p, new: e.target.value }))} placeholder="Min. 8 tekens" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Herhaal wachtwoord</label>
            <input type="password" value={password.confirm} onChange={e => setPassword(p => ({ ...p, confirm: e.target.value }))} placeholder="Herhaal wachtwoord" style={inputStyle} />
          </div>
          <button onClick={changePassword} style={{ padding: '11px', background: 'var(--card2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: '.9rem' }}>
            Wachtwoord wijzigen
          </button>
        </div>
      </div>
    </div>
  )
}
