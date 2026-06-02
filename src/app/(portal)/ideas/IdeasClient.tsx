'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Lightbulb, User, Trash2, Copy, Check, Plus, X, ArrowRight, Sparkles } from 'lucide-react'
import { PlatformIcon, PlatformBadge, PLATFORM_COLORS as IMPORTED_PLATFORM_COLORS } from '@/components/ui/PlatformIcon'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  ideas: any[]
  clients: any[]
  agencyId: string
  isAdmin: boolean
}

// ─── Platform config ─────────────────────────────────────────────────────────

const PLATFORMS: Record<string, { label: string; color: string; bg: string }> = {
  instagram: { label: 'Instagram', color: '#e1306c', bg: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)' },
  tiktok:    { label: 'TikTok',    color: '#69c9d0', bg: 'linear-gradient(135deg,#010101,#69c9d0)' },
  linkedin:  { label: 'LinkedIn',  color: '#0077b5', bg: '#0077b5' },
  youtube:   { label: 'YouTube',   color: '#ff0000', bg: '#ff0000' },
  facebook:  { label: 'Facebook',  color: '#1877f2', bg: '#1877f2' },
}

const PLATFORM_FILTERS = [
  { key: 'all',       label: 'Alle' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok',    label: 'TikTok' },
  { key: 'linkedin',  label: 'LinkedIn' },
  { key: 'youtube',   label: 'YouTube' },
  { key: 'facebook',  label: 'Facebook' },
]

const CONTENT_TYPES = ['Post', 'Reel', 'Story', 'Carousel', 'Video']

// ─── Script templates ─────────────────────────────────────────────────────────

interface Template {
  id: number
  category: 'reels' | 'posts' | 'carousels' | 'linkedin' | 'campagnes'
  categoryLabel: string
  categoryEmoji?: string
  title: string
  description: string
  body: string
}

const TEMPLATES: Template[] = [
  {
    id: 1,
    category: 'reels',
    categoryLabel: 'Reel',
    categoryEmoji: '📱',
    title: 'Hook – Probleem – Oplossing',
    description: 'Bewezen 3-staps formule voor directe aandacht en conversie.',
    body: `Hook (1-3s): [Schok of vraag die de kijker stopt]
Probleem: [Beschrijf de pain point van je doelgroep]
Oplossing: [Jouw product/dienst als antwoord]
CTA: [Volg ons voor meer tips / Link in bio]`,
  },
  {
    id: 2,
    category: 'reels',
    categoryLabel: 'Reel',
    categoryEmoji: '📱',
    title: '3 Tips Format',
    description: 'Edukatieve reel met hoge opslagkans en bereik.',
    body: `Opening: "3 tips voor [onderwerp] die ik wou dat ik eerder wist"
Tip 1: [Tip + korte uitleg — 3 seconden]
Tip 2: [Tip + korte uitleg — 3 seconden]
Tip 3: [Beste tip, meest verrassend — 3 seconden]
CTA: "Sla dit op! / Deel met iemand die dit nodig heeft"`,
  },
  {
    id: 3,
    category: 'reels',
    categoryLabel: 'Reel',
    categoryEmoji: '📱',
    title: 'Voor/Na Transformatie',
    description: 'Visueel krachtig format dat resultaten toont.',
    body: `Voor: [Laat het probleem of beginpunt zien — duidelijk herkenbaar]
Transformatie: [Snelle montage / tijdslapse]
Na: [Eindresultaat — zo indrukwekkend mogelijk]
CTA: "[Wat is jouw resultaat? Vertel het in de comments]"`,
  },
  {
    id: 4,
    category: 'reels',
    categoryLabel: 'Reel',
    categoryEmoji: '📱',
    title: 'POV Format',
    description: 'Meeslepend perspectief-gedreven format met hoge betrokkenheid.',
    body: `POV: [Klant perspectief of herkenbare situatie]
[Vertel het verhaal in 20-30 seconden — empathisch en specifiek]
Einde: [Oplossing of verrassende wending]
CTA: "Herken je dit? Reageer hieronder 👇"`,
  },
  {
    id: 5,
    category: 'reels',
    categoryLabel: 'Reel',
    categoryEmoji: '📱',
    title: 'Dag in het Leven',
    description: 'Authentiek achter-de-schermen format dat vertrouwen bouwt.',
    body: `Opening: [Energiek begin — wakker worden / werkstart]
Moment 1: [Ochtendroutine of voorbereiding]
Moment 2: [Key activiteit of hoogtepunt van de dag]
Moment 3: [Resultaat, afsluiting of fun feit]
CTA: "Volg voor meer kijkjes achter de schermen 👀"`,
  },
  {
    id: 6,
    category: 'carousels',
    categoryLabel: 'Carrousel',
    categoryEmoji: '🎠',
    title: 'Carrousel Opener',
    description: 'Maximale slide-throughs door nieuwsgierigheid te wekken.',
    body: `Slide 1: [Sterke belofte of prikkelende vraag — dwingt door te swipen]
Slide 2: [Stap 1 of argument 1 — kort en visueel]
Slide 3: [Stap 2 of argument 2]
Slide 4: [Stap 3 of argument 3]
Slide 5: [Stap 4 of argument 4]
Laatste slide: [Samenvatting + CTA: "Tag iemand die dit nodig heeft"]`,
  },
  {
    id: 7,
    category: 'posts',
    categoryLabel: 'Post',
    categoryEmoji: '📝',
    title: 'Social Proof Post',
    description: 'Bouw vertrouwen met echte klantresultaten.',
    body: `Opening: [Klantresultaat in concrete cijfers — zo specifiek mogelijk]
Verhaal: [Hoe we dit resultaat samen bereikten — de journey]
Quote: "[Directe klant testimonial — zo authentiek mogelijk]"
CTA: "Wil jij ook zulke resultaten? Stuur ons een DM 📩"`,
  },
  {
    id: 8,
    category: 'posts',
    categoryLabel: 'Post',
    categoryEmoji: '📝',
    title: 'Thought Leadership',
    description: 'Positioneer jezelf als expert met een sterk standpunt.',
    body: `Stelling: [Controversieel of verrassend standpunt in jouw vakgebied]
Onderbouwing 1: [Eerste argument met bewijs of voorbeeld]
Onderbouwing 2: [Tweede argument]
Onderbouwing 3: [Derde argument — sterkste als laatste]
Conclusie: [Jouw visie en advies]
CTA: "Ben jij het eens? Laat het weten in de comments 👇"`,
  },
  {
    id: 9,
    category: 'linkedin',
    categoryLabel: 'LinkedIn',
    categoryEmoji: '💼',
    title: 'LinkedIn Storytelling',
    description: 'Persoonlijk verhaal dat resonanties en shares genereert.',
    body: `Haak: [Persoonlijke ervaring of mislukking — kwetsbaar en eerlijk]
Verhaal: [Wat er exact gebeurde — specifiek en levendig]
Lesson:
  → Takeaway 1: [Concreet en actioneerbaar]
  → Takeaway 2: [Verrassend of counter-intuïtief]
  → Takeaway 3: [Het belangrijkste inzicht]
CTA: "Volg mij voor meer lessen / Repost als je dit herkent ♻️"`,
  },
  {
    id: 10,
    category: 'linkedin',
    categoryLabel: 'LinkedIn',
    categoryEmoji: '💼',
    title: 'LinkedIn Tips Post',
    description: 'Praktische lijst die opgeslagen en gedeeld wordt.',
    body: `Opening: [Specifiek resultaat dat je haalde — maak het concreet]
Tip 1: [Kort, actioneerbaar, onmiddellijk toepasbaar]
Tip 2: [Idem]
Tip 3: [Idem]
Tip 4: [Idem]
Tip 5: [Meest waardevolle tip — bewaar voor het einde]
Sluiting: "Welke tip ga jij als eerste proberen? 👇"`,
  },
  {
    id: 11,
    category: 'campagnes',
    categoryLabel: 'Campagne',
    categoryEmoji: '🚀',
    title: 'Product Launch Flow',
    description: 'Complete 4-weekse lanceerstrategie voor maximale impact.',
    body: `Week 1 — Teaser: [Laat mysterieuze hints vallen, wek nieuwsgierigheid]
Week 2 — Onthulling: [Grote reveal + early access voor volgers]
Week 3 — Social Proof: [Deel eerste reviews, resultaten, testimonials]
Week 4 — Last Call: [Urgentie creëren + laatste kans communicatie]
Post-launch: [Bedanking + resultaten delen + volgende stap aankondigen]`,
  },
  {
    id: 12,
    category: 'campagnes',
    categoryLabel: 'Campagne',
    categoryEmoji: '🚀',
    title: 'Seizoensactie',
    description: 'Bewezen tijdgebonden campagnestructuur voor meer verkoop.',
    body: `2 weken voor: [Aankondiging + aftellen starten — bouw anticipatie op]
1 week voor: [Herinnering sturen + voordelen benadrukken]
3 dagen voor: [Urgentie vergroten — "bijna zover!"]
Dag van: [Live updates + urgentie maximaliseren]
Na afloop: [Resultaten delen + volgende actie aankondigen]`,
  },
]

const TEMPLATE_FILTERS = [
  { key: 'all',       label: 'Alle' },
  { key: 'reels',     label: 'Reels' },
  { key: 'posts',     label: 'Posts' },
  { key: 'carousels', label: 'Carrousels' },
  { key: 'linkedin',  label: 'LinkedIn' },
  { key: 'campagnes', label: 'Campagnes' },
]

const CATEGORY_COLORS: Record<string, string> = {
  reels:     '#e1306c',
  posts:     'var(--accent1)',
  carousels: '#f59e0b',
  linkedin:  '#0077b5',
  campagnes: 'var(--accent3)',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

// ─── Component ───────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: '',
  platform: 'instagram',
  content_type: 'Post',
  notes: '',
  tags: '',
  client_id: '',
}

export default function IdeasClient({ ideas: initialIdeas, clients, agencyId, isAdmin }: Props) {
  const supabase = createClient()

  // ── Global state ──────────────────────────────────────────────────────────
  const [tab, setTab] = useState<'ideas' | 'templates'>('ideas')
  const [ideas, setIdeas] = useState<any[]>(initialIdeas)
  const [platformFilter, setPlatformFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // ── Template state ────────────────────────────────────────────────────────
  const [templateFilter, setTemplateFilter] = useState('all')
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // ── Toast helper ──────────────────────────────────────────────────────────
  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── AI: idee laten bedenken (binnen je eigen agency afgeschermd) ────────────
  const [aiBusy, setAiBusy] = useState(false)
  async function aiIdea() {
    setAiBusy(true)
    try {
      const brief = form.title.trim()
      const prompt = `Bedenk één concreet content-idee voor ${form.platform} (${form.content_type}).${brief ? ` Onderwerp/richting: ${brief}.` : ''} Geef het terug in exact dit formaat, in het Nederlands:\nTitel: <korte pakkende titel>\nOmschrijving: <2-3 zinnen met de uitwerking/insteek>`
      const res = await fetch('/api/ai/assist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      })
      const data = await res.json()
      if (!res.ok || !data.text) { showToast(data.error || 'AI is even niet beschikbaar', 'error'); return }
      const text: string = data.text
      const titleM = text.match(/Titel:\s*(.+)/i)
      const descM = text.match(/Omschrijving:\s*([\s\S]+)/i)
      setForm(f => ({
        ...f,
        title: titleM ? titleM[1].trim() : (f.title || text.split('\n')[0].slice(0, 80)),
        notes: descM ? descM[1].trim() : text.trim(),
      }))
    } catch { showToast('Er ging iets mis met de AI', 'error') } finally { setAiBusy(false) }
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!isAdmin) return
    if (!form.title.trim()) { showToast('Titel is verplicht', 'error'); return }
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      platform: form.platform,
      content_type: form.content_type,
      notes: form.notes,
      client_id: form.client_id || null,
      agency_id: agencyId,
      status: 'idea',
      scheduled_at: null,
    }
    const { data, error } = await supabase.from('content_posts').insert(payload).select('*, clients(company_name)').single()
    setSaving(false)
    if (error) { showToast('Opslaan mislukt', 'error'); return }
    setIdeas(prev => [data, ...prev])
    setShowModal(false)
    setForm({ ...EMPTY_FORM })
    showToast('Idee opgeslagen')
  }

  async function handleDelete(id: string) {
    if (!isAdmin) return
    const { error } = await supabase.from('content_posts').delete().eq('id', id)
    if (error) { showToast('Verwijderen mislukt', 'error'); return }
    setIdeas(prev => prev.filter(i => i.id !== id))
    showToast('Idee verwijderd')
  }

  // ── Template copy ─────────────────────────────────────────────────────────
  function copyTemplate(t: Template) {
    navigator.clipboard.writeText(t.body).then(() => {
      setCopiedId(t.id)
      showToast('Template gekopieerd naar klembord')
      setTimeout(() => setCopiedId(null), 2500)
    })
  }

  // ── Filtered lists ────────────────────────────────────────────────────────
  const filteredIdeas = platformFilter === 'all'
    ? ideas
    : ideas.filter(i => i.platform === platformFilter)

  const filteredTemplates = templateFilter === 'all'
    ? TEMPLATES
    : TEMPLATES.filter(t => t.category === templateFilter)

  // ─────────────────────────────────────────────────────────────────────────
  // Styles
  // ─────────────────────────────────────────────────────────────────────────

  const wrapperStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'var(--bg)',
    padding: '32px 28px',
    fontFamily: 'var(--font-syne, Inter, sans-serif)',
  }

  const headerStyle: React.CSSProperties = {
    marginBottom: '28px',
  }

  const h1Style: React.CSSProperties = {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: 'var(--text)',
    margin: 0,
    letterSpacing: '-0.5px',
  }

  const subStyle: React.CSSProperties = {
    color: 'var(--muted)',
    fontSize: '0.9rem',
    marginTop: '4px',
  }

  const tabBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: '6px',
    marginBottom: '28px',
    borderBottom: '2px solid var(--border)',
    paddingBottom: '0',
  }

  function tabBtnStyle(active: boolean): React.CSSProperties {
    return {
      padding: '10px 20px',
      background: 'none',
      border: 'none',
      borderBottom: active ? '2px solid var(--accent1)' : '2px solid transparent',
      marginBottom: '-2px',
      color: active ? 'var(--accent1)' : 'var(--muted)',
      fontWeight: active ? 700 : 500,
      fontSize: '0.92rem',
      cursor: 'pointer',
      transition: 'all .18s',
      fontFamily: 'inherit',
    }
  }

  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  }

  function pillStyle(active: boolean, color?: string): React.CSSProperties {
    return {
      padding: '6px 16px',
      borderRadius: '999px',
      border: `1.5px solid ${active ? (color || 'var(--accent1)') : 'var(--border)'}`,
      background: active ? (color ? color + '18' : 'rgba(99,102,241,.1)') : 'transparent',
      color: active ? (color || 'var(--accent1)') : 'var(--muted)',
      fontWeight: active ? 600 : 400,
      fontSize: '0.82rem',
      cursor: 'pointer',
      transition: 'all .15s',
      fontFamily: 'inherit',
    }
  }

  const newBtnStyle: React.CSSProperties = {
    marginLeft: 'auto',
    padding: '8px 18px',
    background: 'var(--accent1)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-sm, 8px)',
    fontWeight: 700,
    fontSize: '0.88rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 2px 12px rgba(99,102,241,.3)',
    transition: 'all .15s',
  }

  const masonryStyle: React.CSSProperties = {
    columns: 3,
    columnGap: '16px',
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--card)',
    border: '1.5px solid var(--border)',
    borderRadius: '10px',
    overflow: 'hidden',
    breakInside: 'avoid',
    marginBottom: '14px',
    transition: 'box-shadow .18s, transform .18s',
  }

  function platformColor(p: string): string {
    return PLATFORMS[p]?.color || '#6b7280'
  }

  function platformBadgeStyle(p: string): React.CSSProperties {
    const col = platformColor(p)
    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 10px',
      borderRadius: '999px',
      background: col + '18',
      color: col,
      fontSize: '0.72rem',
      fontWeight: 700,
      letterSpacing: '0.3px',
      textTransform: 'uppercase' as const,
    }
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,.55)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  }

  const modalStyle: React.CSSProperties = {
    background: 'var(--card)',
    border: '1.5px solid var(--border)',
    borderRadius: '16px',
    padding: '32px',
    width: '100%',
    maxWidth: '520px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 24px 60px rgba(0,0,0,.25)',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: 'var(--bg)',
    border: '1.5px solid var(--border)',
    borderRadius: 'var(--radius-sm, 8px)',
    color: 'var(--text)',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color .15s',
  }

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    resize: 'vertical',
    minHeight: '90px',
  }

  const toastStyle: React.CSSProperties = {
    position: 'fixed',
    top: '24px',
    right: '24px',
    zIndex: 9999,
    background: toast?.type === 'error' ? '#ef4444' : '#10b981',
    color: '#fff',
    padding: '12px 20px',
    borderRadius: '10px',
    fontWeight: 600,
    fontSize: '0.88rem',
    boxShadow: '0 8px 24px rgba(0,0,0,.2)',
    animation: 'fadeSlideIn .25s ease',
    fontFamily: 'inherit',
  }

  const templateGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  }

  function templateCardStyle(): React.CSSProperties {
    return {
      background: 'var(--card)',
      border: '1.5px solid var(--border)',
      borderRadius: '10px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      transition: 'box-shadow .18s, transform .18s',
    }
  }

  function categoryBadgeStyle(cat: string): React.CSSProperties {
    const color = CATEGORY_COLORS[cat] || '#6b7280'
    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '3px 10px',
      borderRadius: '999px',
      background: color + '1a',
      color: color,
      fontSize: '0.72rem',
      fontWeight: 700,
      letterSpacing: '0.3px',
      textTransform: 'uppercase' as const,
      width: 'fit-content',
    }
  }

  const emptyStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '80px 20px',
    color: 'var(--muted)',
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fadeUp .35s ease both; }
        .idea-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,.1); transform: translateY(-2px); }
        .template-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,.1); transform: translateY(-2px); }
        .icon-btn { background:none; border:none; cursor:pointer; padding:4px 6px; border-radius:6px; transition:background .15s; font-size:.85rem; }
        .icon-btn:hover { background: var(--border); }
        .copy-btn:hover { opacity:.85; }
        input:focus, select:focus, textarea:focus { border-color: var(--accent1) !important; }
      `}</style>

      <div style={wrapperStyle} className="animate-fade-up">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={headerStyle}>
          <h1 style={h1Style}>Ideeënbord</h1>
          <p style={subStyle}>Bewaar en organiseer content ideeën</p>
        </div>

        {/* ── Tab bar ────────────────────────────────────────────────────── */}
        <div style={tabBarStyle}>
          <button style={tabBtnStyle(tab === 'ideas')}     onClick={() => setTab('ideas')}>Ideeën</button>
          <button style={tabBtnStyle(tab === 'templates')} onClick={() => setTab('templates')}>Script Templates</button>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* IDEAS TAB                                                       */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {tab === 'ideas' && (
          <>
            {/* Toolbar */}
            <div style={toolbarStyle}>
              {PLATFORM_FILTERS.map(f => (
                <button
                  key={f.key}
                  style={{ ...pillStyle(platformFilter === f.key, f.key !== 'all' ? platformColor(f.key) : undefined), display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  onClick={() => setPlatformFilter(f.key)}
                >
                  {f.key !== 'all' && <PlatformIcon platform={f.key} size={13} color={platformFilter === f.key ? platformColor(f.key) : undefined} />}
                  {f.label}
                </button>
              ))}
              <button
                style={newBtnStyle}
                onClick={() => { setForm({ ...EMPTY_FORM }); setShowModal(true) }}
              >
                <Plus size={15} /> Nieuw idee
              </button>
            </div>

            {/* Masonry grid */}
            {filteredIdeas.length === 0 ? (
              <div style={emptyStyle}>
                <Lightbulb size={40} style={{ marginBottom: '16px', opacity: 0.3 }} />
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
                  Nog geen ideeën
                </div>
                <div style={{ marginBottom: '20px', fontSize: '0.9rem' }}>
                  Gooi hier je inspiratie neer voordat het verdwijnt.
                </div>
                <button
                  style={{ ...newBtnStyle, marginLeft: 0 }}
                  onClick={() => { setForm({ ...EMPTY_FORM }); setShowModal(true) }}
                >
                  <Plus size={15} /> Eerste idee toevoegen
                </button>
              </div>
            ) : (
              <div style={masonryStyle}>
                {filteredIdeas.map(idea => (
                  <div key={idea.id} style={cardStyle} className="idea-card">
                    <div style={{ padding: '14px' }}>
                      {/* Platform badge */}
                      <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <PlatformBadge platform={idea.platform} />
                        {idea.content_type && (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: 'var(--border)',
                            color: 'var(--muted)',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                          }}>
                            {idea.content_type}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text)', marginBottom: '6px', lineHeight: 1.35 }}>
                        {idea.title}
                      </div>

                      {/* Notes */}
                      {idea.notes && (
                        <div style={{
                          fontSize: '0.82rem',
                          color: 'var(--muted)',
                          marginBottom: '8px',
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical' as const,
                          overflow: 'hidden',
                        }}>
                          {idea.notes}
                        </div>
                      )}

                      {/* Client */}
                      {idea.clients?.company_name && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={11} /> {idea.clients.company_name}
                        </div>
                      )}

                      {/* Tags */}
                      {idea.tags && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                          {String(idea.tags).split(',').map((t: string) => t.trim()).filter(Boolean).map((tag: string) => (
                            <span key={tag} style={{
                              padding: '2px 8px',
                              borderRadius: '999px',
                              background: 'rgba(99,102,241,.1)',
                              color: 'var(--accent1)',
                              fontSize: '0.7rem',
                              fontWeight: 500,
                            }}>#{tag}</span>
                          ))}
                        </div>
                      )}

                      {/* Bottom row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                          {formatDate(idea.created_at)}
                        </span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            className="icon-btn"
                            title="Naar post"
                            onClick={() => window.location.href = `/content?idea=${idea.id}`}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <ArrowRight size={14} />
                          </button>
                          {isAdmin && (
                            <button
                              className="icon-btn"
                              title="Verwijderen"
                              onClick={() => handleDelete(idea.id)}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* TEMPLATES TAB                                                  */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {tab === 'templates' && (
          <>
            {/* Filter pills */}
            <div style={{ ...toolbarStyle, marginBottom: '24px' }}>
              {TEMPLATE_FILTERS.map(f => (
                <button
                  key={f.key}
                  style={pillStyle(templateFilter === f.key, f.key !== 'all' ? CATEGORY_COLORS[f.key] : undefined)}
                  onClick={() => setTemplateFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Template grid */}
            <div style={templateGridStyle}>
              {filteredTemplates.map(t => (
                <div key={t.id} style={templateCardStyle()} className="template-card">
                  {/* Category badge */}
                  <div style={categoryBadgeStyle(t.category)}>
                    {t.categoryLabel}
                  </div>

                  {/* Title */}
                  <div style={{ fontWeight: 700, fontSize: '0.97rem', color: 'var(--text)', lineHeight: 1.3 }}>
                    {t.title}
                  </div>

                  {/* Description */}
                  <div style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                    {t.description}
                  </div>

                  {/* Expandable body */}
                  <div>
                    <button
                      onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: CATEGORY_COLORS[t.category] || 'var(--accent1)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '0',
                        fontFamily: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {expandedId === t.id ? '▲ Verberg template' : '▼ Bekijk template'}
                    </button>

                    {expandedId === t.id && (
                      <div style={{
                        marginTop: '10px',
                        padding: '12px 14px',
                        background: (CATEGORY_COLORS[t.category] || '#6b7280') + '0d',
                        border: `1.5px solid ${(CATEGORY_COLORS[t.category] || '#6b7280')}30`,
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        color: 'var(--text)',
                        lineHeight: 1.7,
                        whiteSpace: 'pre-line',
                        fontFamily: 'monospace',
                      }}>
                        {t.body}
                      </div>
                    )}
                  </div>

                  {/* Copy button */}
                  <button
                    className="copy-btn"
                    onClick={() => copyTemplate(t)}
                    style={{
                      marginTop: 'auto',
                      padding: '9px 0',
                      background: copiedId === t.id
                        ? '#10b981'
                        : (CATEGORY_COLORS[t.category] || 'var(--accent1)'),
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'background .2s, opacity .15s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    {copiedId === t.id ? <><Check size={14} style={{ marginRight: 5 }} />Gekopieerd!</> : <><Copy size={14} style={{ marginRight: 5 }} />Kopiëren</>}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      {showModal && (
        <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={modalStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>
                Nieuw idee
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Title */}
              <div>
                <label style={labelStyle}>Titel *</label>
                <input
                  style={inputStyle}
                  placeholder="Geef je idee een naam…"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>

              {/* Platform + Content type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Platform</label>
                  <select
                    style={inputStyle}
                    value={form.platform}
                    onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                  >
                    {Object.entries(PLATFORMS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Content type</label>
                  <select
                    style={inputStyle}
                    value={form.content_type}
                    onChange={e => setForm(f => ({ ...f, content_type: e.target.value }))}
                  >
                    {CONTENT_TYPES.map(ct => (
                      <option key={ct} value={ct}>{ct}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Client */}
              {clients.length > 0 && (
                <div>
                  <label style={labelStyle}>Klant</label>
                  <select
                    style={inputStyle}
                    value={form.client_id}
                    onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
                  >
                    <option value="">— Geen klant —</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.company_name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <label style={labelStyle}>Omschrijving / Notities</label>
                  <button
                    type="button"
                    onClick={aiIdea}
                    disabled={aiBusy}
                    title="Laat de AI een idee bedenken op basis van platform en type. Tip: typ eerst een richting in de titel."
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', border: '1px solid var(--accent1)', background: 'transparent', color: 'var(--accent1)', borderRadius: 'var(--radius-pill)', fontSize: '.72rem', fontWeight: 600, cursor: aiBusy ? 'wait' : 'pointer', opacity: aiBusy ? 0.6 : 1, marginBottom: '6px' }}
                  >
                    <Sparkles size={12} /> {aiBusy ? 'Bezig…' : 'Bedenk met AI'}
                  </button>
                </div>
                <textarea
                  style={textareaStyle}
                  placeholder="Beschrijf het idee, inspiratie, referenties…"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

              {/* Tags */}
              <div>
                <label style={labelStyle}>Tags</label>
                <input
                  style={inputStyle}
                  placeholder="zomer, sale, trending (komma-gescheiden)"
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 20px',
                    background: 'transparent',
                    border: '1.5px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--muted)',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Annuleren
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: '10px 24px',
                    background: saving ? 'var(--muted)' : 'var(--accent1)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: saving ? 'none' : '0 2px 12px rgba(99,102,241,.3)',
                    transition: 'all .15s',
                  }}
                >
                  {saving ? 'Opslaan…' : 'Idee opslaan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={toastStyle}>
          {toast.msg}
        </div>
      )}
    </>
  )
}
