import { Target } from 'lucide-react'

export default function LeadsLocked() {
  return (
    <div style={{ maxWidth: '520px', margin: '40px auto', textAlign: 'center' }}>
      <div style={{
        width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 20px',
        background: 'rgba(26,63,228,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--accent1)',
      }}>
        <Target size={30} />
      </div>
      <h1 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.4rem', marginBottom: '10px' }}>
        Leadmachine staat nog uit
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '.92rem', lineHeight: 1.6 }}>
        Met de Leadmachine vinden we automatisch nieuwe klanten voor jou: het juiste bedrijf,
        de juiste contactpersoon en een kant-en-klaar bericht — direct in dit portaal.
      </p>
      <p style={{ color: 'var(--muted)', fontSize: '.92rem', marginTop: '14px' }}>
        Deze functie is nog niet geactiveerd voor jouw account. Neem contact op met Modernica om
        'm aan te zetten.
      </p>
    </div>
  )
}
