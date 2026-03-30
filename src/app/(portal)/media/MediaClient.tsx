'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Link2, Trash2, Upload, Download, X } from 'lucide-react'

interface Props {
  assets: any[]
  clients: any[]
  agencyId: string
  userId: string
  isAdmin: boolean
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + ' KB'
  }
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getAssetType(fileType: string): 'image' | 'video' | 'document' {
  if (fileType.startsWith('image/')) return 'image'
  if (fileType.startsWith('video/')) return 'video'
  return 'document'
}

function VideoIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
    </svg>
  )
}

function DocIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  )
}

export default function MediaClient({ assets: initialAssets, clients, agencyId, userId, isAdmin }: Props) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [assets, setAssets] = useState<any[]>(initialAssets)
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'document'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [uploading, setUploading] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploadClientId, setUploadClientId] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const filteredAssets = assets.filter((asset) => {
    const type = getAssetType(asset.file_type)
    if (filter !== 'all' && type !== filter) return false
    if (searchQuery && !asset.file_name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (clientFilter && asset.client_id !== clientFilter) return false
    return true
  })

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop() || 'bin'
      const timestamp = Date.now()
      const random = Math.random().toString(36).slice(2, 8)
      const path = `${agencyId}/${timestamp}_${random}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('media-library')
        .upload(path, file, { upsert: false })

      if (uploadError) {
        showToast(`Upload mislukt: ${uploadError.message}`)
        continue
      }

      const { data: urlData } = supabase.storage.from('media-library').getPublicUrl(path)
      const publicUrl = urlData.publicUrl

      const { data: inserted, error: insertError } = await supabase
        .from('media_assets')
        .insert({
          agency_id: agencyId,
          uploaded_by: userId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: path,
          public_url: publicUrl,
          client_id: uploadClientId || null,
        })
        .select('*, clients(company_name)')
        .single()

      if (!insertError && inserted) {
        setAssets((prev) => [inserted, ...prev])
        showToast('Bestand geüpload!')
      } else if (insertError) {
        showToast(`Fout bij opslaan: ${insertError.message}`)
      }
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      if (!isAdmin) return
      handleUpload(e.dataTransfer.files)
    },
    [isAdmin, agencyId, userId, uploadClientId]
  )

  async function deleteAsset(asset: any) {
    const { error: storageError } = await supabase.storage
      .from('media-library')
      .remove([asset.storage_path])

    if (storageError) {
      showToast(`Verwijderen mislukt: ${storageError.message}`)
      return
    }

    const { error: dbError } = await supabase.from('media_assets').delete().eq('id', asset.id)
    if (dbError) {
      showToast(`Databasefout: ${dbError.message}`)
      return
    }

    setAssets((prev) => prev.filter((a) => a.id !== asset.id))
    if (selectedAsset?.id === asset.id) setSelectedAsset(null)
    showToast('Bestand verwijderd.')
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url)
    showToast('URL gekopieerd!')
  }

  // ── Styles ────────────────────────────────────────────────────────────────

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'var(--bg)',
    color: 'var(--text)',
    fontFamily: 'var(--font-syne), sans-serif',
    padding: '32px 24px',
  }

  const headerStyle: React.CSSProperties = {
    marginBottom: 28,
  }

  const titleRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '1.75rem',
    fontWeight: 700,
    margin: 0,
    letterSpacing: '-0.02em',
  }

  const badgeStyle: React.CSSProperties = {
    background: 'var(--accent1)',
    color: '#fff',
    borderRadius: 20,
    padding: '2px 10px',
    fontSize: '0.78rem',
    fontWeight: 700,
    letterSpacing: '0.02em',
  }

  const subtitleStyle: React.CSSProperties = {
    fontSize: '0.9rem',
    color: 'var(--muted)',
    margin: 0,
  }

  const controlsStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 10,
    marginTop: 20,
    alignItems: 'center',
  }

  const pillBase: React.CSSProperties = {
    padding: '6px 16px',
    borderRadius: 20,
    border: '1.5px solid var(--border)',
    background: 'transparent',
    color: 'var(--text)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 500,
    fontFamily: 'var(--font-syne), sans-serif',
    transition: 'all 0.15s',
  }

  const pillActive: React.CSSProperties = {
    ...pillBase,
    background: 'var(--accent1)',
    borderColor: 'var(--accent1)',
    color: '#fff',
  }

  const selectStyle: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1.5px solid var(--border)',
    background: 'var(--card)',
    color: 'var(--text)',
    fontSize: '0.85rem',
    fontFamily: 'var(--font-syne), sans-serif',
    cursor: 'pointer',
    outline: 'none',
  }

  const searchStyle: React.CSSProperties = {
    padding: '6px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1.5px solid var(--border)',
    background: 'var(--card)',
    color: 'var(--text)',
    fontSize: '0.85rem',
    fontFamily: 'var(--font-syne), sans-serif',
    outline: 'none',
    width: 200,
  }

  const uploadBtnStyle: React.CSSProperties = {
    marginLeft: 'auto',
    padding: '7px 18px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'var(--accent1)',
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.85rem',
    fontFamily: 'var(--font-syne), sans-serif',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
  }

  const dropZoneStyle: React.CSSProperties = {
    border: `2px dashed ${dragOver ? 'var(--accent1)' : 'var(--border)'}`,
    borderRadius: 'var(--radius)',
    padding: '60px 32px',
    textAlign: 'center',
    background: dragOver ? 'color-mix(in srgb, var(--accent1) 6%, transparent)' : 'var(--card)',
    cursor: isAdmin ? 'pointer' : 'default',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
    color: 'var(--muted)',
    marginTop: 8,
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 14,
    marginTop: 8,
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'box-shadow 0.15s, transform 0.15s',
  }

  const iconPreviewStyle: React.CSSProperties = {
    height: 140,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'color-mix(in srgb, var(--accent3) 18%, var(--card))',
    color: 'var(--accent3)',
  }

  const videoPreviewStyle: React.CSSProperties = {
    ...iconPreviewStyle,
    background: 'color-mix(in srgb, var(--accent1) 15%, var(--card))',
    color: 'var(--accent1)',
  }

  const cardBodyStyle: React.CSSProperties = {
    padding: '10px 12px',
  }

  const fileNameStyle: React.CSSProperties = {
    fontWeight: 700,
    fontSize: '0.82rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginBottom: 6,
  }

  const metaRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap' as const,
    marginBottom: 4,
  }

  const typeBadgeStyle: React.CSSProperties = {
    padding: '1px 7px',
    borderRadius: 4,
    fontSize: '0.72rem',
    fontWeight: 700,
    background: 'color-mix(in srgb, var(--accent1) 15%, transparent)',
    color: 'var(--accent1)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  }

  const metaTextStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: 'var(--muted)',
  }

  const clientNameStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: 'var(--muted)',
    marginBottom: 8,
    fontStyle: 'italic',
  }

  const actionRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: 6,
    marginTop: 8,
  }

  const copyBtnStyle: React.CSSProperties = {
    flex: 1,
    padding: '4px 0',
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text)',
    fontSize: '0.75rem',
    cursor: 'pointer',
    fontFamily: 'var(--font-syne), sans-serif',
  }

  const deleteBtnStyle: React.CSSProperties = {
    padding: '4px 8px',
    borderRadius: 6,
    border: '1px solid color-mix(in srgb, red 40%, transparent)',
    background: 'transparent',
    color: '#f87171',
    fontSize: '0.8rem',
    cursor: 'pointer',
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16,
  }

  const modalStyle: React.CSSProperties = {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    width: '100%',
    maxWidth: 700,
    overflow: 'hidden',
    boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
  }

  const modalHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid var(--border)',
  }

  const modalBodyStyle: React.CSSProperties = {
    display: 'flex',
    gap: 0,
  }

  const modalPreviewStyle: React.CSSProperties = {
    width: 280,
    minWidth: 280,
    background: 'color-mix(in srgb, var(--bg) 60%, var(--card))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 260,
  }

  const modalInfoStyle: React.CSSProperties = {
    flex: 1,
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  }

  const infoLabelStyle: React.CSSProperties = {
    fontSize: '0.72rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: 'var(--muted)',
    marginBottom: 2,
  }

  const infoValueStyle: React.CSSProperties = {
    fontSize: '0.88rem',
    fontWeight: 500,
    wordBreak: 'break-all' as const,
  }

  const urlInputRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: 6,
  }

  const urlInputStyle: React.CSSProperties = {
    flex: 1,
    padding: '5px 10px',
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    color: 'var(--muted)',
    fontSize: '0.78rem',
    outline: 'none',
    fontFamily: 'monospace',
  }

  const smallBtnStyle: React.CSSProperties = {
    padding: '5px 12px',
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--accent1)',
    color: '#fff',
    fontSize: '0.78rem',
    cursor: 'pointer',
    fontWeight: 600,
    fontFamily: 'var(--font-syne), sans-serif',
    whiteSpace: 'nowrap' as const,
  }

  const modalActionsStyle: React.CSSProperties = {
    padding: '14px 20px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    gap: 10,
    justifyContent: 'flex-end',
  }

  const downloadBtnStyle: React.CSSProperties = {
    padding: '8px 18px',
    borderRadius: 'var(--radius-sm)',
    border: '1.5px solid var(--border)',
    background: 'transparent',
    color: 'var(--text)',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font-syne), sans-serif',
  }

  const modalDeleteBtnStyle: React.CSSProperties = {
    padding: '8px 18px',
    borderRadius: 'var(--radius-sm)',
    border: '1.5px solid color-mix(in srgb, red 40%, transparent)',
    background: 'transparent',
    color: '#f87171',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font-syne), sans-serif',
  }

  const toastStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 28,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'var(--accent1)',
    color: '#fff',
    padding: '10px 24px',
    borderRadius: 30,
    fontWeight: 700,
    fontSize: '0.88rem',
    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
    zIndex: 2000,
    fontFamily: 'var(--font-syne), sans-serif',
    pointerEvents: 'none',
  }

  const spinnerStyle: React.CSSProperties = {
    display: 'inline-block',
    width: 16,
    height: 16,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite',
  }

  const emptyStateStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '60px 20px',
    color: 'var(--muted)',
  }

  const closeBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'var(--muted)',
    cursor: 'pointer',
    fontSize: '1.4rem',
    lineHeight: 1,
    padding: 4,
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* HEADER */}
      <div style={headerStyle}>
        <div style={titleRowStyle}>
          <h1 style={titleStyle}>Media Library</h1>
          <span style={badgeStyle}>{assets.length}</span>
        </div>
        <p style={subtitleStyle}>
          {assets.length === 0
            ? 'Nog geen bestanden geüpload'
            : `${assets.length} bestand${assets.length !== 1 ? 'en' : ''} in de bibliotheek`}
        </p>

        {/* Controls */}
        <div style={controlsStyle}>
          {/* Filter pills */}
          {(['all', 'image', 'video', 'document'] as const).map((f) => {
            const labels: Record<string, string> = {
              all: 'Alle',
              image: 'Afbeeldingen',
              video: "Video's",
              document: 'Documenten',
            }
            return (
              <button
                key={f}
                style={filter === f ? pillActive : pillBase}
                onClick={() => setFilter(f)}
              >
                {labels[f]}
              </button>
            )
          })}

          {/* Client filter */}
          <select
            style={selectStyle}
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
          >
            <option value="">Alle klanten</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name}
              </option>
            ))}
          </select>

          {/* Search */}
          <input
            style={searchStyle}
            type="text"
            placeholder="Zoeken op bestandsnaam…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Upload button (admin only) */}
          {isAdmin && (
            <>
              <select
                style={{ ...selectStyle, maxWidth: 160 }}
                value={uploadClientId}
                onChange={(e) => setUploadClientId(e.target.value)}
                title="Koppel aan klant"
              >
                <option value="">Geen klant</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
              <button
                style={uploadBtnStyle}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <span style={spinnerStyle} /> : <Upload size={14} />}
                {uploading ? 'Uploaden…' : 'Uploaden'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,application/pdf"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleUpload(e.target.files)}
      />

      {/* CONTENT */}
      {assets.length === 0 ? (
        /* Large drop zone when no assets */
        <div
          style={dropZoneStyle}
          onDragOver={(e) => { e.preventDefault(); if (isAdmin) setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => isAdmin && fileInputRef.current?.click()}
        >
          <div style={{ color: dragOver ? 'var(--accent1)' : 'var(--muted)', transition: 'color 0.2s' }}>
            <UploadIcon />
          </div>
          <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: dragOver ? 'var(--accent1)' : 'var(--text)' }}>
            {isAdmin ? 'Sleep bestanden hierheen of klik om te uploaden' : 'Nog geen bestanden'}
          </p>
          {isAdmin && (
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>
              Ondersteunde formaten: afbeeldingen, video&apos;s, PDF
            </p>
          )}
          {uploading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent1)' }}>
              <span style={{ ...spinnerStyle, borderTopColor: 'var(--accent1)', borderColor: 'color-mix(in srgb, var(--accent1) 30%, transparent)' }} />
              <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Bezig met uploaden…</span>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Drop zone overlay for drag events when assets exist */}
          <div
            onDragOver={(e) => { e.preventDefault(); if (isAdmin) setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{ position: 'relative' }}
          >
            {dragOver && isAdmin && (
              <div style={{
                position: 'absolute',
                inset: 0,
                border: '2px dashed var(--accent1)',
                borderRadius: 'var(--radius)',
                background: 'color-mix(in srgb, var(--accent1) 8%, transparent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                pointerEvents: 'none',
              }}>
                <p style={{ fontWeight: 700, color: 'var(--accent1)', fontSize: '1.1rem' }}>
                  Bestanden loslaten om te uploaden
                </p>
              </div>
            )}

            {filteredAssets.length === 0 ? (
              <div style={emptyStateStyle}>
                <p style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 6px' }}>Geen resultaten</p>
                <p style={{ fontSize: '0.85rem', margin: 0 }}>Pas de filters aan om meer te zien.</p>
              </div>
            ) : (
              <div style={gridStyle}>
                {filteredAssets.map((asset) => {
                  const type = getAssetType(asset.file_type)
                  return (
                    <div
                      key={asset.id}
                      style={cardStyle}
                      onClick={() => setSelectedAsset(asset)}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLDivElement
                        el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)'
                        el.style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLDivElement
                        el.style.boxShadow = 'none'
                        el.style.transform = 'none'
                      }}
                    >
                      {/* Preview */}
                      {type === 'image' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={asset.public_url}
                          alt={asset.file_name}
                          style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
                        />
                      ) : type === 'video' ? (
                        <div style={videoPreviewStyle}>
                          <VideoIcon />
                        </div>
                      ) : (
                        <div style={iconPreviewStyle}>
                          <DocIcon />
                        </div>
                      )}

                      {/* Body */}
                      <div style={cardBodyStyle}>
                        <div style={fileNameStyle} title={asset.file_name}>
                          {asset.file_name}
                        </div>
                        <div style={metaRowStyle}>
                          <span style={typeBadgeStyle}>{type}</span>
                          <span style={metaTextStyle}>{formatFileSize(asset.file_size)}</span>
                          <span style={metaTextStyle}>·</span>
                          <span style={metaTextStyle}>{formatDate(asset.created_at)}</span>
                        </div>
                        {asset.clients?.company_name && (
                          <div style={clientNameStyle}>{asset.clients.company_name}</div>
                        )}
                        <div
                          style={actionRowStyle}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            style={{ ...copyBtnStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                            onClick={() => copyUrl(asset.public_url)}
                          >
                            <Link2 size={12} /> URL
                          </button>
                          {isAdmin && (
                            <button
                              style={{ ...deleteBtnStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => deleteAsset(asset)}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ASSET DETAIL MODAL */}
      {selectedAsset && (
        <div style={overlayStyle} onClick={() => setSelectedAsset(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div style={modalHeaderStyle}>
              <div style={{ fontWeight: 700, fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {selectedAsset.file_name}
              </div>
              <button style={{ ...closeBtnStyle, display: 'flex', alignItems: 'center' }} onClick={() => setSelectedAsset(null)}><X size={18} /></button>
            </div>

            {/* Modal body */}
            <div style={modalBodyStyle}>
              {/* Preview */}
              <div style={modalPreviewStyle}>
                {getAssetType(selectedAsset.file_type) === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedAsset.public_url}
                    alt={selectedAsset.file_name}
                    style={{ maxWidth: '100%', maxHeight: 320, objectFit: 'contain', display: 'block' }}
                  />
                ) : getAssetType(selectedAsset.file_type) === 'video' ? (
                  <div style={{ color: 'var(--accent1)', textAlign: 'center' }}>
                    <VideoIcon />
                    <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>Video bestand</p>
                  </div>
                ) : (
                  <div style={{ color: 'var(--accent3)', textAlign: 'center' }}>
                    <DocIcon />
                    <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>Document</p>
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={modalInfoStyle}>
                <div>
                  <p style={infoLabelStyle}>Bestandsnaam</p>
                  <p style={{ ...infoValueStyle, margin: 0 }}>{selectedAsset.file_name}</p>
                </div>
                <div>
                  <p style={infoLabelStyle}>Type</p>
                  <p style={{ ...infoValueStyle, margin: 0 }}>{selectedAsset.file_type}</p>
                </div>
                <div>
                  <p style={infoLabelStyle}>Grootte</p>
                  <p style={{ ...infoValueStyle, margin: 0 }}>{formatFileSize(selectedAsset.file_size)}</p>
                </div>
                {selectedAsset.clients?.company_name && (
                  <div>
                    <p style={infoLabelStyle}>Klant</p>
                    <p style={{ ...infoValueStyle, margin: 0 }}>{selectedAsset.clients.company_name}</p>
                  </div>
                )}
                <div>
                  <p style={infoLabelStyle}>Geüpload op</p>
                  <p style={{ ...infoValueStyle, margin: 0 }}>{formatDate(selectedAsset.created_at)}</p>
                </div>
                <div>
                  <p style={infoLabelStyle}>Publieke URL</p>
                  <div style={urlInputRowStyle}>
                    <input
                      style={urlInputStyle}
                      type="text"
                      readOnly
                      value={selectedAsset.public_url}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      style={smallBtnStyle}
                      onClick={() => copyUrl(selectedAsset.public_url)}
                    >
                      Kopieer
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal actions */}
            <div style={modalActionsStyle}>
              {isAdmin && (
                <button
                  style={{ ...modalDeleteBtnStyle, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  onClick={() => deleteAsset(selectedAsset)}
                >
                  <Trash2 size={15} /> Verwijderen
                </button>
              )}
              <button
                style={{ ...downloadBtnStyle, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                onClick={() => window.open(selectedAsset.public_url, '_blank')}
              >
                <Download size={15} /> Downloaden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && <div style={toastStyle}>{toast}</div>}
    </div>
  )
}
