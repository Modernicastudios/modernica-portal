'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  agency: any
  userId: string
  agencyId: string
}

export default function OnboardingClient({ agency, userId, agencyId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1 state
  const [agencyName, setAgencyName] = useState<string>(agency?.name || '')
  const [primaryColor, setPrimaryColor] = useState<string>('#1a3fe4')
  const [secondaryColor, setSecondaryColor] = useState<string>('#4f7bff')

  // Step 2 state
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoUploaded, setLogoUploaded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 3 state
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientCreated, setClientCreated] = useState(false)

  // --- Step 1: Save agency info ---
  async function handleStep1() {
    setLoading(true)
    setError(null)
    try {
      // Update agency name
      await supabase
        .from('agencies')
        .update({ name: agencyName })
        .eq('id', agencyId)

      // Upsert brand kit colors
      const { data: existingKit } = await supabase
        .from('brand_kits')
        .select('id')
        .eq('agency_id', agencyId)
        .single()

      if (existingKit) {
        await supabase
          .from('brand_kits')
          .update({ primary_color: primaryColor, secondary_color: secondaryColor })
          .eq('id', existingKit.id)
      } else {
        await supabase
          .from('brand_kits')
          .insert({ agency_id: agencyId, primary_color: primaryColor, secondary_color: secondaryColor })
      }

      setStep(2)
    } catch (err: any) {
      setError(err.message || 'Er is iets misgegaan')
    } finally {
      setLoading(false)
    }
  }

  // --- Step 2: Handle file selection ---
  function handleFileSelect(file: File) {
    setLogoFile(file)
    const url = URL.createObjectURL(file)
    setLogoPreview(url)
  }

  function handleDropZoneClick() {
    fileInputRef.current?.click()
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  async function handleLogoUpload() {
    if (!logoFile) return
    setLoading(true)
    setError(null)
    try {
      const ext = logoFile.name.split('.').pop() || 'png'
      const path = `${agencyId}/logo.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('agency-assets')
        .upload(path, logoFile, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('agency-assets')
        .getPublicUrl(path)

      const publicUrl = urlData.publicUrl

      // Update brand kit logo_url
      const { data: existingKit } = await supabase
        .from('brand_kits')
        .select('id')
        .eq('agency_id', agencyId)
        .single()

      if (existingKit) {
        await supabase
          .from('brand_kits')
          .update({ logo_url: publicUrl })
          .eq('id', existingKit.id)
      } else {
        await supabase
          .from('brand_kits')
          .insert({ agency_id: agencyId, logo_url: publicUrl })
      }

      setLogoUploaded(true)
    } catch (err: any) {
      setError(err.message || 'Upload mislukt')
    } finally {
      setLoading(false)
    }
  }

  // --- Step 3: Create client ---
  async function handleCreateClient() {
    if (!clientName.trim() || !clientEmail.trim()) {
      setError('Vul bedrijfsnaam en e-mailadres in')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await supabase
        .from('clients')
        .insert({
          agency_id: agencyId,
          company_name: clientName.trim(),
          contact_email: clientEmail.trim(),
        })

      setClientCreated(true)
    } catch (err: any) {
      setError(err.message || 'Klant aanmaken mislukt')
    } finally {
      setLoading(false)
    }
  }

  const TOTAL_STEPS = 3

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '20px',
    }}>
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '48px',
        width: '100%',
        maxWidth: '520px',
        boxShadow: '0 20px 80px rgba(26,63,228,.12)',
        animation: 'fadeUp 0.35s ease',
      }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '40px' }}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              style={{
                width: i + 1 === step ? '28px' : '10px',
                height: '10px',
                borderRadius: '50px',
                background: i + 1 <= step ? 'var(--accent1)' : 'var(--border)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Step 1: Agency info */}
        {step === 1 && (
          <div style={{ animation: 'fadeUp 0.25s ease' }}>
            <h1 style={{
              fontFamily: 'var(--font-syne), sans-serif',
              fontWeight: 800,
              fontSize: '1.8rem',
              color: 'var(--text)',
              marginBottom: '8px',
            }}>
              Welkom bij Modernica 👋
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginBottom: '32px' }}>
              Stel je agency in een paar stappen in.
            </p>

            <label style={labelStyle}>Agencynaam</label>
            <input
              value={agencyName}
              onChange={e => setAgencyName(e.target.value)}
              placeholder="Naam van je agency"
              style={inputStyle}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
              <div>
                <label style={labelStyle}>Primaire kleur</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    style={{ width: '44px', height: '44px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: '2px' }}
                  />
                  <span style={{ fontSize: '.82rem', color: 'var(--muted)', fontFamily: 'monospace' }}>{primaryColor}</span>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Secundaire kleur</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={e => setSecondaryColor(e.target.value)}
                    style={{ width: '44px', height: '44px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: '2px' }}
                  />
                  <span style={{ fontSize: '.82rem', color: 'var(--muted)', fontFamily: 'monospace' }}>{secondaryColor}</span>
                </div>
              </div>
            </div>

            {error && <p style={errorStyle}>{error}</p>}

            <button
              onClick={handleStep1}
              disabled={loading || !agencyName.trim()}
              style={{ ...primaryBtnStyle, marginTop: '32px', opacity: loading || !agencyName.trim() ? 0.6 : 1 }}
            >
              {loading ? 'Opslaan...' : 'Volgende →'}
            </button>
          </div>
        )}

        {/* Step 2: Logo upload */}
        {step === 2 && (
          <div style={{ animation: 'fadeUp 0.25s ease' }}>
            <h1 style={{
              fontFamily: 'var(--font-syne), sans-serif',
              fontWeight: 800,
              fontSize: '1.8rem',
              color: 'var(--text)',
              marginBottom: '8px',
            }}>
              Upload je logo
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginBottom: '32px' }}>
              Je logo verschijnt in de zijbalk en op klantportalen.
            </p>

            {/* Drop zone */}
            <div
              onClick={handleDropZoneClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${isDragging ? 'var(--accent1)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                padding: '40px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: isDragging ? 'rgba(26,63,228,.04)' : 'var(--bg)',
                transition: 'all 0.2s',
                marginBottom: '20px',
              }}
            >
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  style={{ maxHeight: '80px', maxWidth: '200px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
                />
              ) : (
                <>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🖼️</div>
                  <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '.9rem', marginBottom: '4px' }}>
                    Klik of sleep een afbeelding hierheen
                  </div>
                  <div style={{ fontSize: '.78rem', color: 'var(--muted)' }}>
                    PNG, JPG, SVG — max. 5 MB
                  </div>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />

            {logoUploaded && (
              <div style={{
                background: 'rgba(0,184,156,.1)',
                border: '1px solid rgba(0,184,156,.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                fontSize: '.85rem',
                color: '#00b89c',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                ✅ Logo succesvol geüpload
              </div>
            )}

            {error && <p style={errorStyle}>{error}</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
              {logoFile && !logoUploaded && (
                <button
                  onClick={handleLogoUpload}
                  disabled={loading}
                  style={{ ...primaryBtnStyle, opacity: loading ? 0.6 : 1 }}
                >
                  {loading ? 'Uploaden...' : 'Logo uploaden'}
                </button>
              )}
              <button
                onClick={() => setStep(3)}
                disabled={loading}
                style={{ ...primaryBtnStyle, opacity: loading ? 0.6 : 1 }}
              >
                Volgende →
              </button>
              <button
                onClick={() => setStep(3)}
                style={skipBtnStyle}
              >
                Logo later instellen
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Invite first client */}
        {step === 3 && (
          <div style={{ animation: 'fadeUp 0.25s ease' }}>
            <h1 style={{
              fontFamily: 'var(--font-syne), sans-serif',
              fontWeight: 800,
              fontSize: '1.8rem',
              color: 'var(--text)',
              marginBottom: '8px',
            }}>
              Eerste klant uitnodigen
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginBottom: '32px' }}>
              Voeg je eerste klant toe om aan de slag te gaan.
            </p>

            {clientCreated ? (
              <div style={{
                background: 'rgba(0,184,156,.1)',
                border: '1px solid rgba(0,184,156,.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                fontSize: '.88rem',
                color: '#00b89c',
                marginBottom: '24px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>🎉</div>
                <strong>{clientName}</strong> is aangemaakt!
              </div>
            ) : (
              <>
                <label style={labelStyle}>Bedrijfsnaam</label>
                <input
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="Naam van de klant"
                  style={inputStyle}
                />

                <label style={{ ...labelStyle, marginTop: '16px' }}>Contact e-mailadres</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  placeholder="email@klant.nl"
                  style={inputStyle}
                />

                {error && <p style={errorStyle}>{error}</p>}

                <button
                  onClick={handleCreateClient}
                  disabled={loading || !clientName.trim() || !clientEmail.trim()}
                  style={{ ...primaryBtnStyle, marginTop: '24px', opacity: loading || !clientName.trim() || !clientEmail.trim() ? 0.6 : 1 }}
                >
                  {loading ? 'Aanmaken...' : 'Klant aanmaken'}
                </button>
              </>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: clientCreated ? '0' : '12px' }}>
              <button
                onClick={() => router.push('/dashboard')}
                style={primaryBtnStyle}
              >
                Naar dashboard →
              </button>
              {!clientCreated && (
                <button
                  onClick={() => router.push('/dashboard')}
                  style={skipBtnStyle}
                >
                  Later doen
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Shared styles
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '.8rem',
  fontWeight: 600,
  color: 'var(--muted)',
  textTransform: 'uppercase',
  letterSpacing: '.06em',
  marginBottom: '6px',
  marginTop: '4px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  fontSize: '.9rem',
  color: 'var(--text)',
  background: 'var(--bg)',
  outline: 'none',
  boxSizing: 'border-box',
}

const primaryBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  background: 'var(--accent1)',
  color: '#fff',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  fontSize: '.92rem',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'var(--font-syne), sans-serif',
  letterSpacing: '.02em',
  transition: 'opacity 0.15s',
}

const skipBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  background: 'transparent',
  color: 'var(--muted)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  fontSize: '.88rem',
  cursor: 'pointer',
  transition: 'opacity 0.15s',
}

const errorStyle: React.CSSProperties = {
  color: '#e53935',
  fontSize: '.82rem',
  marginTop: '8px',
  padding: '8px 12px',
  background: 'rgba(229,57,53,.08)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid rgba(229,57,53,.2)',
}
