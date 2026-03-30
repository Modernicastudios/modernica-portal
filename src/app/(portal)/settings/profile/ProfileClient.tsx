'use client'

import { useState, CSSProperties } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Camera, User, Mail, Phone, Briefcase, FileText,
  Save, AlertTriangle, Lock, Check,
} from 'lucide-react'

interface Props {
  profile: any
  email: string
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
    background: disabled ? 'var(--bg)' : 'var(--bg)',
    color: disabled ? 'var(--muted)' : 'var(--text)',
    outline: 'none',
    cursor: disabled ? 'not-allowed' : 'text',
    opacity: disabled ? .7 : 1,
    boxSizing: 'border-box',
  }
}

function FormField({
  label, icon, children,
}: {
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
      </label>
      {icon ? (
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', left: '10px', top: '50%',
            transform: 'translateY(-50%)', color: 'var(--muted)',
            display: 'flex', alignItems: 'center',
            pointerEvents: 'none',
          }}>
            {icon}
          </div>
          <div style={{ paddingLeft: '0' }}>{children}</div>
        </div>
      ) : children}
    </div>
  )
}

export default function ProfileClient({ profile: initialProfile, email }: Props) {
  const [profile, setProfile] = useState(initialProfile)
  const [form, setForm] = useState({
    full_name: initialProfile?.full_name || '',
    phone: initialProfile?.phone || '',
    job_title: initialProfile?.job_title || '',
    bio: initialProfile?.bio || '',
    timezone: initialProfile?.timezone || 'Europe/Amsterdam',
  })
  const [password, setPassword] = useState({ new: '', confirm: '' })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const supabase = createClient()

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  async function saveProfile() {
    setSaving(true)
    const { error } = await supabase.from('user_profiles').update(form).eq('id', profile.id)
    if (!error) {
      setProfile((p: any) => ({ ...p, ...form }))
      showToast('Profiel opgeslagen')
    } else {
      showToast('Fout bij opslaan', false)
    }
    setSaving(false)
  }

  async function changePassword() {
    if (password.new !== password.confirm) { showToast('Wachtwoorden komen niet overeen', false); return }
    if (password.new.length < 8) { showToast('Wachtwoord moet minimaal 8 tekens zijn', false); return }
    setSavingPw(true)
    const { error } = await supabase.auth.updateUser({ password: password.new })
    if (!error) {
      setPassword({ new: '', confirm: '' })
      showToast('Wachtwoord gewijzigd')
    } else {
      showToast('Fout bij wijzigen wachtwoord', false)
    }
    setSavingPw(false)
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
      showToast('Profielfoto bijgewerkt')
    }
    setUploading(false)
  }

  const initials = profile?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  return (
    <div style={{ maxWidth: '680px' }}>
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

      {/* ── Avatar card ── */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <User size={15} color="var(--muted)" />
          <span style={{
            fontFamily: 'var(--font-syne), sans-serif',
            fontWeight: 700, fontSize: '.88rem',
          }}>
            Profielfoto
          </span>
        </div>
        <div style={{ ...cardBodyStyle, display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Avatar circle */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: profile?.avatar_url
                ? 'none'
                : 'linear-gradient(135deg, var(--accent1), var(--accent2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800,
              fontSize: '1.6rem', color: '#fff',
              overflow: 'hidden', border: '3px solid var(--border)',
            }}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials}
            </div>
            {/* Camera overlay */}
            <label style={{
              position: 'absolute', bottom: 0, right: 0,
              width: '26px', height: '26px', borderRadius: '50%',
              background: 'var(--accent1)', border: '2px solid var(--card)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <Camera size={12} color="#fff" />
              <input type="file" accept="image/*" onChange={uploadAvatar} style={{ display: 'none' }} />
            </label>
          </div>

          <div>
            <div style={{ fontWeight: 600, fontSize: '.9rem', marginBottom: '4px' }}>
              {profile?.full_name || 'Naam onbekend'}
            </div>
            <div style={{ fontSize: '.8rem', color: 'var(--muted)', marginBottom: '12px' }}>
              {email}
            </div>
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', background: 'var(--bg)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', fontSize: '.82rem', fontWeight: 600, color: 'var(--text)',
            }}>
              <Camera size={13} />
              {uploading ? 'Uploaden…' : 'Foto wijzigen'}
              <input type="file" accept="image/*" onChange={uploadAvatar} style={{ display: 'none' }} />
            </label>
            <div style={{ fontSize: '.73rem', color: 'var(--muted)', marginTop: '6px' }}>
              JPG, PNG of WebP — max 2 MB
            </div>
          </div>
        </div>
      </div>

      {/* ── Personal info card ── */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <User size={15} color="var(--muted)" />
          <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.88rem' }}>
            Persoonlijke gegevens
          </span>
        </div>
        <div style={cardBodyStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <FormField label="Volledige naam" icon={<User size={14} />}>
              <input
                value={form.full_name}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                placeholder="Jan Jansen"
                style={{ ...inputStyle(), paddingLeft: '36px' }}
              />
            </FormField>
            <FormField label="E-mailadres" icon={<Mail size={14} />}>
              <input
                value={email}
                disabled
                style={{ ...inputStyle(true), paddingLeft: '36px' }}
              />
            </FormField>
            <FormField label="Telefoonnummer" icon={<Phone size={14} />}>
              <input
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="+31 6 12345678"
                style={{ ...inputStyle(), paddingLeft: '36px' }}
              />
            </FormField>
            <FormField label="Functietitel" icon={<Briefcase size={14} />}>
              <input
                value={form.job_title}
                onChange={e => setForm(p => ({ ...p, job_title: e.target.value }))}
                placeholder="Social Media Manager"
                style={{ ...inputStyle(), paddingLeft: '36px' }}
              />
            </FormField>
          </div>
          <FormField label="Bio" icon={<FileText size={14} />}>
            <textarea
              value={form.bio}
              onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
              placeholder="Schrijf een korte bio over jezelf…"
              rows={3}
              style={{
                ...inputStyle(),
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: 1.5,
              }}
            />
          </FormField>

          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>Tijdzone</label>
            <select
              value={form.timezone}
              onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))}
              style={inputStyle()}
            >
              <option value="Europe/Amsterdam">Amsterdam (CET/CEST)</option>
              <option value="Europe/London">Londen (GMT/BST)</option>
              <option value="America/New_York">New York (EST/EDT)</option>
              <option value="America/Los_Angeles">Los Angeles (PST/PDT)</option>
            </select>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={saveProfile}
              disabled={saving}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                padding: '10px 22px', background: 'var(--accent1)',
                color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
                cursor: saving ? 'wait' : 'pointer', fontWeight: 600,
                fontSize: '.88rem', opacity: saving ? .7 : 1,
              }}
            >
              <Save size={14} />
              {saving ? 'Opslaan…' : 'Wijzigingen opslaan'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Password card ── */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <Lock size={15} color="var(--muted)" />
          <span style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.88rem' }}>
            Wachtwoord wijzigen
          </span>
        </div>
        <div style={cardBodyStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <FormField label="Nieuw wachtwoord">
              <input
                type="password"
                value={password.new}
                onChange={e => setPassword(p => ({ ...p, new: e.target.value }))}
                placeholder="Min. 8 tekens"
                style={inputStyle()}
              />
            </FormField>
            <FormField label="Herhaal wachtwoord">
              <input
                type="password"
                value={password.confirm}
                onChange={e => setPassword(p => ({ ...p, confirm: e.target.value }))}
                placeholder="Herhaal wachtwoord"
                style={inputStyle()}
              />
            </FormField>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={changePassword}
              disabled={savingPw || !password.new}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                padding: '10px 22px', background: 'var(--bg)',
                color: 'var(--text)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', cursor: savingPw ? 'wait' : 'pointer',
                fontWeight: 600, fontSize: '.88rem',
                opacity: savingPw || !password.new ? .6 : 1,
              }}
            >
              <Lock size={14} />
              {savingPw ? 'Wijzigen…' : 'Wachtwoord wijzigen'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Danger zone ── */}
      <div style={{
        ...cardStyle,
        border: '1px solid rgba(220,38,38,.25)',
      }}>
        <div style={{ ...cardHeaderStyle, borderBottom: '1px solid rgba(220,38,38,.2)' }}>
          <AlertTriangle size={15} color="#dc2626" />
          <span style={{
            fontFamily: 'var(--font-syne), sans-serif',
            fontWeight: 700, fontSize: '.88rem', color: '#dc2626',
          }}>
            Gevarenzone
          </span>
        </div>
        <div style={{ ...cardBodyStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '.88rem', marginBottom: '4px' }}>
              Account verwijderen
            </div>
            <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>
              Dit verwijdert permanent je account en alle bijbehorende gegevens.
              Deze actie kan niet ongedaan worden gemaakt.
            </div>
          </div>
          <button
            onClick={() => alert('Neem contact op met support om je account te verwijderen.')}
            style={{
              padding: '9px 18px', background: 'transparent',
              border: '1px solid rgba(220,38,38,.4)',
              borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              fontWeight: 600, fontSize: '.84rem', color: '#dc2626',
              flexShrink: 0,
            }}
          >
            Account verwijderen
          </button>
        </div>
      </div>
    </div>
  )
}
