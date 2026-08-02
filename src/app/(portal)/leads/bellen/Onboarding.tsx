'use client'

import { useState, useEffect } from 'react'
import { X, PhoneCall, Globe, BookOpen, ArrowRight, RefreshCw, Repeat, Trash2 } from 'lucide-react'

export default function Onboarding() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem('bellen_onboarded_v1') !== 'true') setShow(true)
    } catch { /* noop */ }
  }, [])

  function hide() {
    setShow(false)
    try { localStorage.setItem('bellen_onboarded_v1', 'true') } catch { /* noop */ }
  }

  if (!show) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(26, 23, 48, 0.75)', zIndex: 300,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        background: 'white', borderRadius: '20px 20px 0 0', padding: 24,
        width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 44, marginBottom: 6 }}>👋</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Welkom bij het bel-portaal</h2>
          <p style={{ fontSize: 13, color: '#5F5A72', marginTop: 4 }}>Even 30 seconden — de basis van hoe dit werkt.</p>
        </div>

        {/* 3 core steps */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#3F06E3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Stap voor stap</div>

          <Step num={1} icon={<Globe size={18} />} title="Check hun website eerst"
            desc="Klik op de 'Check website' knop. Kijk of de site verouderd is (goed teken om te pitchen) of al nieuw (dan → switch pitch of verwijder)." />

          <Step num={2} icon={<PhoneCall size={18} />} title="Klik grote paarse belknop"
            desc="Je telefoon opent automatisch — bel het bedrijf. In de app loopt een timer. Na afloop kies je een outcome-knop (bijv. Geen gehoor / Gesprek gehad / Callback)." />

          <Step num={3} icon={<BookOpen size={18} />} title="Twijfel je? 📖 Script staat klaar"
            desc="Rechtsboven — daar vind je pitch scripts, prijzen, cases en bezwaren-antwoorden. Alles voor tijdens het gesprek zonder hoeven scrollen." />
        </div>

        {/* Knop uitleg */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#3F06E3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>De 3 &quot;niet bellen&quot; knoppen</div>

          <ActionButton icon={<Repeat size={16} />} name="Skip →" color="#5F5A72"
            desc="Deze lead niet nu bellen, komt later weer in de queue." />

          <ActionButton icon={<ArrowRight size={16} />} name="Switch pitch (geel blok)" color="#F59E0B"
            desc="Website is prima → verkoop iets anders (social / recruitment / video). Lead blijft, maar met nieuwe dienst." />

          <ActionButton icon={<Trash2 size={16} />} name="Verwijder lead" color="#EF4444"
            desc="Geen enkele match — helemaal weg uit CRM. Bevestiging altijd nodig." />
        </div>

        {/* Queue uitleg */}
        <div style={{ padding: 14, background: '#F1ECFF', borderRadius: 12, marginBottom: 20, fontSize: 13, lineHeight: 1.5 }}>
          <strong style={{ color: '#3F06E3' }}>💡 Hoe krijg je de volgende lead?</strong>
          <p style={{ marginTop: 6, color: '#1A1730' }}>
            Na elk gesprek klik &quot;Opslaan + volgende&quot; en het systeem zoekt automatisch de volgende:
          </p>
          <ol style={{ paddingLeft: 20, marginTop: 6 }}>
            <li>Eerst callbacks waarvan de tijd is aangebroken</li>
            <li>Dan leads die aan jou zijn toegewezen</li>
            <li>Dan verse leads uit de pool</li>
          </ol>
        </div>

        {/* Callbacks uitleg */}
        <div style={{ padding: 14, background: '#FFF9EF', borderRadius: 12, marginBottom: 20, fontSize: 13, lineHeight: 1.5 }}>
          <strong style={{ color: '#92400E' }}>📞 Callbacks</strong>
          <p style={{ marginTop: 6, color: '#1A1730' }}>
            Als je bij een gesprek &quot;terugbellen&quot; kiest + datum invult, komt die lead automatisch weer bovenaan als de tijd is aangebroken.
            Bovenin zie je hoeveel callbacks vandaag openstaan.
          </p>
        </div>

        {/* Contact bij vragen */}
        <div style={{ padding: 14, background: '#F0FDF4', borderRadius: 12, marginBottom: 20, fontSize: 13, lineHeight: 1.5 }}>
          <strong style={{ color: '#065F46' }}>❓ Vragen tijdens werk?</strong>
          <p style={{ marginTop: 6, color: '#1A1730' }}>
            Bel of app Sjoerd direct. Beter 1 verkeerde beweging dan 100 twijfel-momenten. Alles kan achteraf worden bijgewerkt.
          </p>
        </div>

        <button onClick={hide} style={{
          width: '100%', padding: '14px 20px',
          background: '#3F06E3', color: 'white', border: 'none', borderRadius: 12,
          fontWeight: 700, fontSize: 15, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <PhoneCall size={16} /> Ik snap 't — start met bellen
        </button>

        <button onClick={hide} style={{
          width: '100%', marginTop: 8, padding: '8px',
          background: 'transparent', border: 'none', color: '#5F5A72',
          fontSize: 12, cursor: 'pointer',
        }}>
          Verberg permanent (kan je terugkrijgen door cache te leggen)
        </button>
      </div>
    </div>
  )
}

function Step({ num, icon, title, desc }: any) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
      <div style={{
        flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
        background: '#3F06E3', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: 14,
      }}>{num}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ color: '#3F06E3' }}>{icon}</span>
          <strong style={{ fontSize: 14 }}>{title}</strong>
        </div>
        <p style={{ fontSize: 13, color: '#5F5A72', lineHeight: 1.5 }}>{desc}</p>
      </div>
    </div>
  )
}

function ActionButton({ icon, name, color, desc }: any) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
      <div style={{
        flexShrink: 0, padding: '4px 10px', borderRadius: 6,
        background: color + '20', color, fontSize: 11, fontWeight: 700,
        display: 'inline-flex', alignItems: 'center', gap: 4,
      }}>{icon} {name}</div>
      <p style={{ flex: 1, fontSize: 12, color: '#5F5A72', lineHeight: 1.5 }}>{desc}</p>
    </div>
  )
}
