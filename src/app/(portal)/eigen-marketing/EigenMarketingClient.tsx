'use client'

import Link from 'next/link'
import { Card, PageHeader, Badge } from '@/components/ui'
import {
  Target, CalendarDays, TrendingUp, Rocket, ArrowRight, CheckCircle2,
  Mail, MessageSquareReply, Trophy, Send,
} from 'lucide-react'

type Counts = { total: number; queued: number; pushed: number; replied: number; won: number }

export default function EigenMarketingClient({
  agencyName, leadMachineOn, campaignActive, smartleadLinked, counts,
}: {
  agencyName: string
  leadMachineOn: boolean
  campaignActive: boolean
  smartleadLinked: boolean
  counts: Counts
}) {
  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <PageHeader
        title="Eigen marketing"
        subtitle={`Wat je voor klanten doet, doe je ook voor ${agencyName}. Zet hier je eigen groei op de automaat — los van je klanten.`}
      />

      {/* Hero / pitch */}
      <Card style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #0f1a30 0%, #1b2c52 100%)', border: 'none', color: '#fff', padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,.18)', borderRadius: '14px', padding: '12px', flexShrink: 0 }}>
            <Rocket size={26} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: 'var(--font-syne), sans-serif', fontWeight: 800, fontSize: '1.3rem', margin: '0 0 6px' }}>
              Practice what you preach
            </h2>
            <p style={{ margin: 0, opacity: .9, fontSize: '.92rem', lineHeight: 1.5, maxWidth: '560px' }}>
              Laat de leadmachine elke dag automatisch nieuwe bedrijven vinden die jóuw diensten nodig hebben,
              een persoonlijke openingszin schrijven en mailen vanuit je eigen inboxen. Jij doet niets — behalve reageren als er een lead binnenkomt.
            </p>
          </div>
        </div>
      </Card>

      {/* Mini-overzicht eigen leads */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <StatTile icon={<Mail size={18} />} label="Eigen leads" value={counts.total} tone="accent" />
        <StatTile icon={<Send size={18} />} label="Verstuurd" value={counts.pushed} tone="muted" />
        <StatTile icon={<MessageSquareReply size={18} />} label="Reacties" value={counts.replied} tone="accent" />
        <StatTile icon={<Trophy size={18} />} label="Gewonnen" value={counts.won} tone="success" />
      </div>

      {/* Eigen leadmachine */}
      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div style={{ background: 'rgba(26,63,228,.1)', color: 'var(--accent1)', borderRadius: '12px', padding: '10px', flexShrink: 0 }}>
            <Target size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem' }}>Eigen leadmachine</h3>
              {!leadMachineOn ? <Badge tone="muted">Niet geactiveerd</Badge>
                : campaignActive ? <Badge tone="success">Actief</Badge>
                : <Badge tone="accent">Klaar om te starten</Badge>}
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '.86rem', margin: '6px 0 14px', lineHeight: 1.5 }}>
              {!leadMachineOn
                ? 'De leadmachine staat nog uit voor jouw agency. Een super admin kan deze aanzetten.'
                : campaignActive
                  ? smartleadLinked
                    ? 'Je eigen campagne draait en is gekoppeld aan Smartlead — leads worden automatisch gevonden én verstuurd.'
                    : 'Je eigen campagne draait en vindt dagelijks leads. Koppel Smartlead (campagne-ID) zodra je inboxen warm zijn om te gaan versturen.'
                  : 'Zet je eigen campagne op: kies je doelgroep, plaats en welke dienst je pitcht. Daarna draait het vanzelf.'}
            </p>
            <Link href="/leads" style={linkBtn}>
              {campaignActive ? 'Beheer eigen leads' : 'Eigen campagne opzetten'} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </Card>

      {/* Eigen content & social */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <HubCard
          icon={<CalendarDays size={22} />}
          title="Eigen content"
          text="Plan je eigen posts en houd je merk zichtbaar — net als je voor klanten doet."
          href="/content"
          cta="Naar contentkalender"
        />
        <HubCard
          icon={<TrendingUp size={22} />}
          title="Eigen social & resultaten"
          text="Volg de groei van je eigen kanalen en zie wat werkt."
          href="/analytics/social"
          cta="Bekijk social-resultaten"
        />
      </div>

      {/* Checklist */}
      <Card style={{ marginTop: '20px' }}>
        <div style={{ fontWeight: 700, fontSize: '.78rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: '12px' }}>
          Zo zet je je eigen groei op de automaat
        </div>
        {[
          'Zet je eigen leadcampagne op (doelgroep + plaats + dienst die je pitcht).',
          'Laat de robot dagelijks automatisch bedrijven vinden en mails schrijven.',
          'Koppel Smartlead zodra je inboxen warm zijn — dan gaat het versturen automatisch.',
          'Reageer snel als er een lead binnenkomt (je krijgt een melding via het belletje).',
        ].map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '7px 0' }}>
            <CheckCircle2 size={18} style={{ color: 'var(--accent3)', flexShrink: 0, marginTop: '1px' }} />
            <span style={{ fontSize: '.88rem' }}>{step}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}

const linkBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '7px', textDecoration: 'none',
  background: 'var(--accent1)', color: '#fff', padding: '9px 16px',
  borderRadius: 'var(--radius-sm)', fontSize: '.85rem', fontWeight: 600,
}

function StatTile({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: 'accent' | 'success' | 'muted' }) {
  const fg = tone === 'success' ? 'var(--accent3)' : tone === 'accent' ? 'var(--accent1)' : 'var(--muted)'
  return (
    <Card padding={16} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ color: fg, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontWeight: 800, fontSize: '1.4rem', lineHeight: 1 }}>{value}</div>
        <div style={{ color: 'var(--muted)', fontSize: '.76rem', marginTop: '3px' }}>{label}</div>
      </div>
    </Card>
  )
}

function HubCard({ icon, title, text, href, cta }: { icon: React.ReactNode; title: string; text: string; href: string; cta: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
      <Card style={{ height: '100%', transition: 'transform .15s, box-shadow .15s', cursor: 'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow)' }}>
        <div style={{ background: 'rgba(26,63,228,.1)', color: 'var(--accent1)', borderRadius: '12px', padding: '10px', width: 'fit-content', marginBottom: '12px' }}>
          {icon}
        </div>
        <h3 style={{ margin: '0 0 6px', fontWeight: 700, fontSize: '1rem' }}>{title}</h3>
        <p style={{ color: 'var(--muted)', fontSize: '.85rem', margin: '0 0 14px', lineHeight: 1.5 }}>{text}</p>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent1)', fontSize: '.84rem', fontWeight: 600 }}>
          {cta} <ArrowRight size={15} />
        </span>
      </Card>
    </Link>
  )
}
