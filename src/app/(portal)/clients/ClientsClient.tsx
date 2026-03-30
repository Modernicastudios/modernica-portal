'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Client, UserProfile } from '@/types'

interface Props {
  clients: Client[]
  pendingUsers: UserProfile[]
  agencyId: string
}

export default function ClientsClient({ clients: initialClients, pendingUsers, agencyId }: Props) {
  const [clients, setClients] = useState(initialClients)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newClient, setNewClient] = useState({ company_name: '', industry: '', city: '', contact_email: '' })
  const [inviteEmail, setInviteEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const supabase = createClient()

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function addClient() {
    if (!newClient.company_name.trim()) return
    setLoading(true)

    const { data, error } = await supabase
      .from('clients')
      .insert({ ...newClient, agency_id: agencyId })
      .select()
      .single()

    if (!error && data) {
      setClients(prev => [...prev, data])
      setNewClient({ company_name: '', industry: '', city: '', contact_email: '' })
      setShowAddModal(false)
      showToast('Klant toegevoegd!')

      // Send invite if email given
      if (inviteEmail) {
        await sendInvite(data.id, inviteEmail)
      }
    }
    setLoading(false)
  }

  async function sendInvite(clientId: string, email: string) {
    const token = crypto.randomUUID()
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    await supabase.from('invitations').insert({
      agency_id: agencyId,
      client_id: clientId,
      email,
      token,
      expires_at: expires,
    })

    const link = `${window.location.origin}/accept-invitation?token=${token}`
    showToast(`Uitnodigingslink: ${link}`)
  }

  async function copyInviteLink(clientId: string) {
    const token = crypto.randomUUID()
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    await supabase.from('invitations').insert({
      agency_id: agencyId,
      client_id: clientId,
      token,
      expires_at: expires,
    })

    const link = `${window.location.origin}/accept-invitation?token=${token}`
    await navigator.clipboard.writeText(link)
    showToast('Link gekopieerd!')
  }

  const cardStyle = {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '20px',
    boxShadow: '0 2px 12px rgba(26,63,228,.06)',
  }

  return (
    <div className="animate-fade-up">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '80px', right: '24px', zIndex: 1000,
          background: 'var(--accent1)', color: '#fff', padding: '12px 20px',
          borderRadius: 'var(--radius-sm)', fontSize: '.85rem', fontWeight: 600,
          boxShadow: '0 4px 20px rgba(26,63,228,.3)', animation: 'fadeIn .2s ease',
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1.4rem' }}>Klantbeheer</h2>
          <p style={{ color: 'var(--muted)', fontSize: '.85rem', marginTop: '4px' }}>{clients.length} actieve klanten</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            background: 'var(--accent1)', color: '#fff', border: 'none',
            borderRadius: 'var(--radius-sm)', padding: '10px 20px',
            fontSize: '.88rem', fontWeight: 600, cursor: 'pointer',
          }}
        >
          + Nieuwe klant
        </button>
      </div>

      {/* Pending users */}
      {pendingUsers.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: '20px', borderLeft: '3px solid var(--accent4)' }}>
          <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '.95rem', marginBottom: '12px', color: 'var(--accent4)' }}>
            ⏳ Wachtende gebruikers ({pendingUsers.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pendingUsers.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
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
                  style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '.82rem', background: 'var(--card)' }}
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {clients.map(client => (
          <div key={client.id} style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, var(--accent1), var(--accent2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#fff',
              }}>
                {client.company_name[0].toUpperCase()}
              </div>
              <button
                onClick={() => copyInviteLink(client.id)}
                title="Kopieer uitnodigingslink"
                style={{
                  background: 'rgba(26,63,228,.08)', border: '1px solid rgba(26,63,228,.15)',
                  borderRadius: 'var(--radius-sm)', padding: '5px 10px', fontSize: '.72rem',
                  color: 'var(--accent1)', fontWeight: 600, cursor: 'pointer',
                }}
              >
                🔗 Uitnodigen
              </button>
            </div>
            <div style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>
              {client.company_name}
            </div>
            {client.industry && <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginBottom: '2px' }}>{client.industry}</div>}
            {client.city && <div style={{ fontSize: '.78rem', color: 'var(--muted)' }}>📍 {client.city}</div>}
          </div>
        ))}

        {clients.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>👥</div>
            <div style={{ fontWeight: 600 }}>Nog geen klanten</div>
            <div style={{ fontSize: '.85rem', marginTop: '4px' }}>Voeg je eerste klant toe om te beginnen</div>
          </div>
        )}
      </div>

      {/* Add client modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(13,20,51,.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500,
        }} onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
          <div style={{ background: 'var(--card)', borderRadius: 'var(--radius)', padding: '32px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 700, fontSize: '1.1rem', marginBottom: '20px' }}>Nieuwe klant toevoegen</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { key: 'company_name', label: 'Bedrijfsnaam *', placeholder: 'Bedrijf BV' },
                { key: 'industry', label: 'Branche', placeholder: 'E-commerce, Horeca...' },
                { key: 'city', label: 'Stad', placeholder: 'Amsterdam' },
                { key: 'contact_email', label: 'Contactpersoon e-mail', placeholder: 'contact@bedrijf.nl' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: '.8rem', fontWeight: 600, display: 'block', marginBottom: '5px' }}>{label}</label>
                  <input
                    value={(newClient as any)[key]}
                    onChange={e => setNewClient(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.88rem', background: 'var(--bg)', outline: 'none' }}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '.8rem', fontWeight: 600, display: 'block', marginBottom: '5px' }}>Uitnodigen via e-mail (optioneel)</label>
                <input
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="klant@bedrijf.nl"
                  type="email"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.88rem', background: 'var(--bg)', outline: 'none' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'none', cursor: 'pointer', fontSize: '.88rem' }}>
                Annuleren
              </button>
              <button onClick={addClient} disabled={loading} style={{ flex: 1, padding: '10px', background: 'var(--accent1)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '.88rem', fontWeight: 600 }}>
                {loading ? 'Opslaan...' : 'Klant toevoegen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
