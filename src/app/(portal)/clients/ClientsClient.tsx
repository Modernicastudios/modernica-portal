'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useClientFilter } from '@/components/layout/ClientFilter'
import type { Client, UserProfile } from '@/types'
import { Search, Users, X, Trash2 } from 'lucide-react'

interface ClientWithStats extends Client {
  activeProjects?: number
  pendingPosts?: number
  platforms?: string[]
  status?: 'actief' | 'inactief'
}

interface Props {
  clients: ClientWithStats[]
  pendingUsers: UserProfile[]
  agencyId: string
  isAdmin: boolean
}

type ModalMode = 'add' | 'edit'

interface ClientForm {
  company_name: string
  industry: string
  city: string
  contact_email: string
  contact_name: string
  phone: string
  website: string
  notes: string
  status: 'actief' | 'inactief'
}

const emptyForm: ClientForm = {
  company_name: '',
  industry: '',
  city: '',
  contact_email: '',
  contact_name: '',
  phone: '',
  website: '',
  notes: '',
  status: 'actief',
}

export default function ClientsClient({ clients: initialClients, pendingUsers, agencyId, isAdmin }: Props) {
  const [clients, setClients]           = useState<ClientWithStats[]>(initialClients)
  const [showModal, setShowModal]       = useState(false)
  const [modalMode, setModalMode]       = useState<ModalMode>('add')
  const [editingId, setEditingId]       = useState<string | null>(null)
  const [form, setForm]                 = useState<ClientForm>(emptyForm)
  const [inviteEmail, setInviteEmail]   = useState('')
  const [loading, setLoading]           = useState(false)
  const [toast, setToast]               = useState<string | null>(null)
  const [search, setSearch]             = useState('')

  const supabase = createClient()
  const { selectedClientId, setSelectedClientId } = useClientFilter()

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function openAddModal() {
    setModalMode('add')
    setEditingId(null)
    setForm(emptyForm)
    setInviteEmail('')
    setShowModal(true)
  }

  function openEditModal(client: ClientWithStats) {
    setModalMode('edit')
    setEditingId(client.id)
    setForm({
      company_name:  client.company_name,
      industry:      client.industry || '',
      city:          client.city || '',
      contact_email: client.contact_email || '',
      contact_name:  '',
      phone:         '',
      website:       '',
      notes:         '',
      status:        (client.status as 'actief' | 'inactief') || 'actief',
    })
    setShowModal(true)
  }

  async function deleteClient(id: string, name: string) {
    if (!isAdmin) return
    if (!confirm(`Klant "${name}" verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (!error) {
      setClients(prev => prev.filter(c => c.id !== id))
      setShowModal(false)
      showToast('Klant verwijderd')
    }
  }

  async function saveClient() {
    if (!isAdmin || !form.company_name.trim()) return
    setLoading(true)

    if (modalMode === 'add') {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          company_name:  form.company_name,
          industry:      form.industry || null,
          city:          form.city || null,
          contact_email: form.contact_email || null,
          agency_id:     agencyId,
        })
        .select()
        .single()

      if (!error && data) {
        setClients(prev => [...prev, { ...data, activeProjects: 0, pendingPosts: 0 }])
        if (inviteEmail) await sendInvite(data.id, inviteEmail)
        setShowModal(false)
        showToast('Klant toegevoegd!')
      } else {
        showToast(`Fout: ${error?.message || 'Opslaan mislukt'}`)
      }
    } else if (editingId) {
      const { data, error } = await supabase
        .from('clients')
        .update({
          company_name:  form.company_name,
          industry:      form.industry || null,
          city:          form.city || null,
          contact_email: form.contact_email || null,
        })
        .eq('id', editingId)
        .select()
        .single()

      if (!error && data) {
        setClients(prev => prev.map(c => c.id === editingId ? { ...c, ...data } : c))
        setShowModal(false)
        showToast('Klant bijgewerkt!')
      } else {
        showToast(`Fout: ${error?.message || 'Opslaan mislukt'}`)
      }
    }
    setLoading(false)
  }

  async function sendInvite(clientId: string, email: string) {
    const token   = crypto.randomUUID()
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const { error } = await supabase.from('client_invitations').insert({ agency_id: agencyId, client_id: clientId, email, token, expires_at: expires, accepted: false })
    if (error) { showToast(`Fout uitnodiging: ${error.message}`); return }
    const link = `${window.location.origin}/accept-invitation?token=${token}`
    await navigator.clipboard.writeText(link)
    showToast('Uitnodigingslink gekopieerd!')
  }

  async function copyInviteLink(clientId: string) {
    const token   = crypto.randomUUID()
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const { error } = await supabase.from('client_invitations').insert({ agency_id: agencyId, client_id: clientId, token, expires_at: expires, accepted: false })
    if (error) { showToast(`Fout: ${error.message}`); return }
    const link = `${window.location.origin}/accept-invitation?token=${token}`
    await navigator.clipboard.writeText(link)
    showToast('Link gekopieerd!')
  }

  const filtered = clients.filter(c => {
    if (selectedClientId && c.id !== selectedClientId) return false
    return (
      c.company_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.contact_email || '').toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <div className="animate-fade-up">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '80px', right: '24px', zIndex: 1000,
          background: 'var(--accent1)', color: '#fff', padding: '12px 20px',
          borderRadius: 'var(--radius-sm)', fontSize: '.85rem', fontWeight: 600,
          boxShadow: '0 4px 20px rgba(26,63,228,.3)',
        }}>
          {toast}
        </div>
      )}

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.5rem', marginBottom: '4px' }}>
            Klanten
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '.88rem' }}>
            Beheer al je klanten en projecten
          </p>
        </div>
        <button
          onClick={openAddModal}
          style={{
            background: 'var(--accent1)', color: '#fff', border: 'none',
            borderRadius: 'var(--radius-sm)', padding: '10px 20px',
            fontSize: '.88rem', fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(26,63,228,.3)',
          }}
        >
          + Nieuwe klant
        </button>
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: '24px', position: 'relative' }}>
        <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none', display: 'flex' }}>
          <Search size={16} />
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Zoek klanten op naam of e-mail..."
          style={{
            width: '100%', maxWidth: '420px', padding: '10px 14px 10px 38px',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            fontSize: '.88rem', background: 'var(--card)', outline: 'none',
            color: 'var(--text)', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Pending users */}
      {pendingUsers.length > 0 && (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent4)',
          borderRadius: 'var(--radius)', padding: '18px 20px', marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,.04)',
        }}>
          <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.92rem', marginBottom: '12px', color: 'var(--accent4)' }}>
            Wachtende gebruikers ({pendingUsers.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pendingUsers.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.88rem' }}>{u.full_name}</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>{u.email}</div>
                </div>
                <select
                  onChange={async (e) => {
                    if (!e.target.value) return
                    await supabase.from('user_profiles').update({ client_id: e.target.value }).eq('id', u.id)
                    showToast('Gebruiker gekoppeld!')
                  }}
                  style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '.82rem', background: 'var(--card)', color: 'var(--text)' }}
                >
                  <option value="">Koppel aan klant...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clients grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {filtered.map(client => (
          <ClientCard
            key={client.id}
            client={client}
            onEdit={() => openEditModal(client)}
            onInvite={() => copyInviteLink(client.id)}
          />
        ))}

        {filtered.length === 0 && search && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
            <Search size={32} style={{ marginBottom: '12px', opacity: 0.35 }} />
            <div style={{ fontWeight: 600, fontSize: '.95rem', marginBottom: '4px' }}>Geen resultaten</div>
            <div style={{ fontSize: '.85rem' }}>Geen klanten gevonden voor &quot;{search}&quot;</div>
          </div>
        )}

        {clients.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px 20px', color: 'var(--muted)' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--bg)', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Users size={32} style={{ opacity: 0.4 }} />
            </div>
            <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '8px', color: 'var(--text)' }}>
              Nog geen klanten
            </div>
            <div style={{ fontSize: '.88rem', marginBottom: '20px' }}>
              Voeg je eerste klant toe om te beginnen
            </div>
            <button
              onClick={openAddModal}
              style={{ background: 'var(--accent1)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px 24px', fontSize: '.88rem', fontWeight: 600, cursor: 'pointer' }}
            >
              + Klant toevoegen
            </button>
          </div>
        )}
      </div>

      {/* Add / edit modal */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(13,20,51,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: '16px' }}
          onClick={e => e.target === e.currentTarget && setShowModal(false)}
        >
          <div style={{ background: 'var(--card)', borderRadius: 'var(--radius)', padding: '32px', width: '100%', maxWidth: '560px', boxShadow: '0 20px 60px rgba(0,0,0,.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.1rem' }}>
                {modalMode === 'add' ? 'Nieuwe klant toevoegen' : 'Klant bewerken'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}><X size={20} /></button>
            </div>

            {/* Two-column field layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={formLabelStyle}>Bedrijfsnaam *</label>
                <input
                  autoFocus
                  value={form.company_name}
                  onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))}
                  placeholder="Bedrijf BV"
                  style={formInputStyle}
                />
              </div>
              <div>
                <label style={formLabelStyle}>Contactpersoon</label>
                <input
                  value={form.contact_name}
                  onChange={e => setForm(p => ({ ...p, contact_name: e.target.value }))}
                  placeholder="Jan de Vries"
                  style={formInputStyle}
                />
              </div>
              <div>
                <label style={formLabelStyle}>E-mail</label>
                <input
                  value={form.contact_email}
                  onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))}
                  placeholder="jan@bedrijf.nl"
                  type="email"
                  style={formInputStyle}
                />
              </div>
              <div>
                <label style={formLabelStyle}>Telefoon</label>
                <input
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+31 6 12345678"
                  style={formInputStyle}
                />
              </div>
              <div>
                <label style={formLabelStyle}>Branche</label>
                <input
                  value={form.industry}
                  onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}
                  placeholder="E-commerce, Horeca..."
                  style={formInputStyle}
                />
              </div>
              <div>
                <label style={formLabelStyle}>Stad</label>
                <input
                  value={form.city}
                  onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                  placeholder="Amsterdam"
                  style={formInputStyle}
                />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={formLabelStyle}>Website</label>
                <input
                  value={form.website}
                  onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
                  placeholder="https://bedrijf.nl"
                  style={formInputStyle}
                />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={formLabelStyle}>Notities</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Interne notities over deze klant..."
                  rows={3}
                  style={{ ...formInputStyle, resize: 'none', fontFamily: 'inherit' }}
                />
              </div>

              {/* Status toggle */}
              <div style={{ gridColumn: '1/-1' }}>
                <label style={formLabelStyle}>Status</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['actief', 'inactief'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, status: s }))}
                      style={{
                        padding: '7px 20px', border: `1.5px solid ${form.status === s ? (s === 'actief' ? '#00b89c' : 'var(--border)') : 'var(--border)'}`,
                        borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '.85rem', fontWeight: 600,
                        background: form.status === s ? (s === 'actief' ? 'rgba(0,184,156,.1)' : 'var(--bg)') : 'transparent',
                        color: form.status === s ? (s === 'actief' ? '#00b89c' : 'var(--text)') : 'var(--muted)',
                        transition: 'all .12s',
                      }}
                    >
                      {s === 'actief' ? 'Actief' : 'Inactief'}
                    </button>
                  ))}
                </div>
              </div>

              {modalMode === 'add' && (
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={formLabelStyle}>Uitnodigen via e-mail (optioneel)</label>
                  <input
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="klant@bedrijf.nl"
                    type="email"
                    style={formInputStyle}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ flex: 1, padding: '10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'none', cursor: 'pointer', fontSize: '.88rem', color: 'var(--text)' }}
              >
                Annuleren
              </button>
              {modalMode === 'edit' && editingId && (
                <button
                  onClick={() => {
                    const client = clients.find(c => c.id === editingId)
                    deleteClient(editingId, client?.company_name || 'Klant')
                  }}
                  style={{
                    padding: '10px 14px', background: 'none', border: '1px solid #e53935',
                    borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: '#e53935',
                    fontSize: '.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  <Trash2 size={14} /> Verwijderen
                </button>
              )}
              <button
                onClick={saveClient}
                disabled={loading || !form.company_name.trim()}
                style={{
                  flex: 2, padding: '10px', background: 'var(--accent1)', color: '#fff',
                  border: 'none', borderRadius: 'var(--radius-sm)', cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '.88rem', fontWeight: 700, opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Opslaan...' : (modalMode === 'add' ? 'Klant toevoegen' : 'Opslaan')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── ClientCard ─────────────────────────────────────────────────────────────────
function clientCardHoverIn(el: HTMLElement) {
  el.style.boxShadow = '0 8px 24px rgba(26,63,228,.1)'
  el.style.transform = 'translateY(-2px)'
}
function clientCardHoverOut(el: HTMLElement) {
  el.style.boxShadow = '0 2px 8px rgba(0,0,0,.05)'
  el.style.transform = 'none'
}

function ClientCard({ client, onEdit, onInvite }: {
  client: ClientWithStats
  onEdit: () => void
  onInvite: () => void
}) {
  const isActive      = (client.status ?? 'actief') === 'actief'
  const initials      = client.company_name.slice(0, 2).toUpperCase()
  const activeProjects = client.activeProjects ?? 0
  const pendingPosts   = client.pendingPosts ?? 0

  return (
    <div
      style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '0', overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,.05)',
        transition: 'box-shadow .15s, transform .15s',
      }}
      onMouseEnter={e => clientCardHoverIn(e.currentTarget as HTMLElement)}
      onMouseLeave={e => clientCardHoverOut(e.currentTarget as HTMLElement)}
    >
      {/* Card top strip */}
      <div style={{ height: '3px', background: isActive ? 'linear-gradient(90deg, var(--accent1), var(--accent2))' : 'var(--border)' }} />

      <div style={{ padding: '18px 20px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', gap: '10px' }}>
          {/* Avatar */}
          <div style={{
            width: '46px', height: '46px', borderRadius: 'var(--radius-sm)', flexShrink: 0,
            background: isActive ? 'linear-gradient(135deg, var(--accent1), var(--accent2))' : 'var(--bg)',
            border: isActive ? 'none' : '1.5px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1rem',
            color: isActive ? '#fff' : 'var(--muted)',
          }}>
            {initials}
          </div>

          {/* Status badge */}
          <span style={{
            fontSize: '.68rem', fontWeight: 700, padding: '3px 10px', borderRadius: '50px',
            background: isActive ? 'rgba(0,184,156,.1)' : 'rgba(107,114,128,.08)',
            color: isActive ? '#00b89c' : '#9ca3af',
            border: `1px solid ${isActive ? 'rgba(0,184,156,.2)' : 'rgba(107,114,128,.15)'}`,
            whiteSpace: 'nowrap',
          }}>
            {isActive ? 'Actief' : 'Inactief'}
          </span>
        </div>

        {/* Company name */}
        <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '4px', color: 'var(--text)', lineHeight: 1.3 }}>
          {client.company_name}
        </div>

        {/* Contact + email */}
        <div style={{ marginBottom: '14px' }}>
          {client.contact_email && (
            <div style={{ fontSize: '.75rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {client.contact_email}
            </div>
          )}
          {client.industry && (
            <div style={{ fontSize: '.73rem', color: 'var(--muted)', marginTop: '2px' }}>
              {client.industry}{client.city ? ` · ${client.city}` : ''}
            </div>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <div style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent1)', lineHeight: 1 }}>{activeProjects}</div>
            <div style={{ fontSize: '.65rem', color: 'var(--muted)', marginTop: '3px', fontWeight: 500 }}>Projecten</div>
          </div>
          <div style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent3)', lineHeight: 1 }}>{pendingPosts}</div>
            <div style={{ fontSize: '.65rem', color: 'var(--muted)', marginTop: '3px', fontWeight: 500 }}>Wachtend</div>
          </div>
        </div>

        {/* Platform chips */}
        {(client.platforms ?? []).length > 0 && (
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {(client.platforms ?? []).map(p => (
              <span
                key={p}
                style={{ fontSize: '.65rem', fontWeight: 600, padding: '2px 8px', borderRadius: '50px', background: 'rgba(26,63,228,.07)', color: 'var(--accent1)', border: '1px solid rgba(26,63,228,.12)' }}
              >
                {p}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
          <Link
            href={`/clients/${client.id}`}
            style={{
              flex: 1, padding: '8px 0', textAlign: 'center', background: 'var(--accent1)',
              color: '#fff', borderRadius: 'var(--radius-sm)', fontSize: '.8rem', fontWeight: 700,
              textDecoration: 'none', display: 'block',
            }}
          >
            Bekijken
          </Link>
          <button
            onClick={onInvite}
            style={{
              flex: 1, padding: '8px 0', background: 'transparent',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              fontSize: '.8rem', fontWeight: 600, color: 'var(--text)', cursor: 'pointer',
              transition: 'border-color .12s, color .12s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent1)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent1)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
          >
            Uitnodigen
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Shared form styles ─────────────────────────────────────────────────────────
const formInputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', fontSize: '.85rem', background: 'var(--bg)',
  outline: 'none', boxSizing: 'border-box', color: 'var(--text)',
}

const formLabelStyle: React.CSSProperties = {
  fontSize: '.78rem', fontWeight: 600, display: 'block', marginBottom: '5px', color: 'var(--text)',
}
