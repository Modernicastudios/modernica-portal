'use client'

import { Card, PageHeader, Badge } from '@/components/ui'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

type Checks = {
  db: boolean
  supabaseUrl: boolean
  serviceRole: boolean
  apify: boolean
  anthropic: boolean
  apollo: boolean
  millionverifier: boolean
  smartlead: boolean
  smartleadWebhook: boolean
  cron: boolean
  stripe: boolean
  appUrl: boolean
}

type Row = { key: keyof Checks; label: string; what: string; need: 'required' | 'recommended' | 'optional' }

const GROUPS: { title: string; rows: Row[] }[] = [
  {
    title: 'Basis (app draait hierop)',
    rows: [
      { key: 'db', label: 'Database-verbinding', what: 'Supabase is bereikbaar', need: 'required' },
      { key: 'supabaseUrl', label: 'Supabase URL', what: 'Adres van je database', need: 'required' },
      { key: 'serviceRole', label: 'Supabase service-sleutel', what: 'Server-toegang voor beheer', need: 'required' },
      { key: 'appUrl', label: 'App-URL', what: 'Gebruikt in e-mails en links', need: 'recommended' },
    ],
  },
  {
    title: 'Leadmachine — leads vinden & schrijven',
    rows: [
      { key: 'apify', label: 'Apify', what: 'Vindt bedrijven via Google Maps', need: 'required' },
      { key: 'anthropic', label: 'Anthropic (AI)', what: 'Schrijft de openingszin', need: 'required' },
      { key: 'millionverifier', label: 'MillionVerifier', what: 'Controleert of e-mails bestaan', need: 'recommended' },
      { key: 'apollo', label: 'Apollo', what: 'Extra contactgegevens (optioneel)', need: 'optional' },
    ],
  },
  {
    title: 'Leadmachine — versturen & automatisch draaien',
    rows: [
      { key: 'smartlead', label: 'Smartlead', what: 'Verstuurt de mails via je inboxen', need: 'required' },
      { key: 'smartleadWebhook', label: 'Smartlead webhook-geheim', what: 'Beveiligt het terugmelden van reacties', need: 'required' },
      { key: 'cron', label: 'Cron-geheim', what: 'Laat de dagelijkse robot draaien', need: 'required' },
    ],
  },
  {
    title: 'Betalingen',
    rows: [
      { key: 'stripe', label: 'Stripe', what: 'Abonnementen & facturatie', need: 'recommended' },
    ],
  },
]

export default function StatusBoard({ checks }: { checks: Checks }) {
  const allRows = GROUPS.flatMap(g => g.rows)
  const requiredRows = allRows.filter(r => r.need === 'required')
  const requiredOk = requiredRows.every(r => checks[r.key])
  const missingRequired = requiredRows.filter(r => !checks[r.key]).length

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      <PageHeader
        title="Systeemstatus"
        subtitle="In één oogopslag zien of alles goed is ingesteld. We tonen alleen óf iets is ingevuld — nooit de waarde zelf."
      />

      {/* Samenvatting */}
      <Card style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '14px',
        borderColor: requiredOk ? 'var(--accent3)' : 'var(--danger)',
        background: requiredOk ? 'rgba(0,184,156,.06)' : 'var(--danger-bg)' }}>
        {requiredOk
          ? <CheckCircle2 size={28} style={{ color: 'var(--accent3)', flexShrink: 0 }} />
          : <AlertTriangle size={28} style={{ color: 'var(--danger)', flexShrink: 0 }} />}
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>
            {requiredOk ? 'Alles staat klaar om te draaien' : `${missingRequired} verplichte instelling(en) ontbreken`}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '.85rem', marginTop: '2px' }}>
            {requiredOk
              ? 'Alle essentiële koppelingen zijn ingesteld.'
              : 'Vul de rood gemarkeerde sleutels in bij Vercel → Settings → Environment Variables.'}
          </div>
        </div>
      </Card>

      {GROUPS.map(group => (
        <Card key={group.title} style={{ marginBottom: '16px' }}>
          <div style={{ fontWeight: 700, fontSize: '.78rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: '12px' }}>
            {group.title}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {group.rows.map(row => {
              const ok = checks[row.key]
              return (
                <div key={row.key} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 8px', borderRadius: 'var(--radius-sm)' }}>
                  {ok
                    ? <CheckCircle2 size={20} style={{ color: 'var(--accent3)', flexShrink: 0 }} />
                    : row.need === 'optional'
                      ? <XCircle size={20} style={{ color: 'var(--muted)', flexShrink: 0, opacity: .5 }} />
                      : <XCircle size={20} style={{ color: 'var(--danger)', flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{row.label}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '.8rem' }}>{row.what}</div>
                  </div>
                  {!ok && (
                    <Badge tone={row.need === 'required' ? 'danger' : row.need === 'recommended' ? 'accent' : 'muted'}>
                      {row.need === 'required' ? 'Nodig' : row.need === 'recommended' ? 'Aanbevolen' : 'Optioneel'}
                    </Badge>
                  )}
                  {ok && <Badge tone="success">Actief</Badge>}
                </div>
              )
            })}
          </div>
        </Card>
      ))}

      <p style={{ color: 'var(--muted)', fontSize: '.8rem', textAlign: 'center', marginTop: '8px' }}>
        Iets aanpassen? Zet de sleutel in Vercel en doe een redeploy — deze pagina ververst dan mee.
      </p>
    </div>
  )
}
