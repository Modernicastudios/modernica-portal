// Types voor de Leadmachine (lead-generatie / verrijking / outreach).
// Komt overeen met de tabellen uit migratie 020_leadmachine.sql.

export type LeadService =
  | 'website'
  | 'social'
  | 'ads'
  | 'video'
  | 'recruitment'
  | 'local'

export type LeadCampaignStatus = 'draft' | 'active' | 'paused' | 'done'

export interface LeadCampaign {
  id: string
  agency_id: string
  client_id: string | null
  created_by: string | null
  name: string
  status: LeadCampaignStatus
  region: string | null
  sbi_code: string | null
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface LeadCompany {
  id: string
  agency_id: string
  client_id: string | null
  campaign_id: string | null
  kvk_number: string | null
  name: string
  domain: string | null
  website_url: string | null
  phone: string | null
  address: string | null
  city: string | null
  sbi_code: string | null
  source: string | null
  created_at: string
}

export interface LeadContact {
  id: string
  agency_id: string
  client_id: string | null
  company_id: string
  full_name: string | null
  role: string | null
  email: string | null
  found_via: 'apollo' | 'site_scrape' | 'pattern' | null
  confidence: number | null
  email_verified: 'valid' | 'risky' | 'invalid' | null
  created_at: string
}

export interface LeadSignal {
  id: string
  agency_id: string
  client_id: string | null
  company_id: string
  type: LeadService
  score: number | null
  detail: Record<string, unknown>
  created_at: string
}

export interface LeadServiceFit {
  id: string
  agency_id: string
  client_id: string | null
  company_id: string
  service: LeadService
  score: number | null
  rank: number | null
  pitchable: boolean
  modules: string[]
  created_at: string
}

export interface LeadOutreach {
  id: string
  agency_id: string
  client_id: string | null
  company_id: string
  contact_id: string | null
  service_fit_id: string | null
  service: LeadService | null
  is_primary: boolean
  opening_line: string | null
  status: 'draft' | 'queued' | 'pushed' | 'skipped' | 'replied' | 'won' | 'lost'
  smartlead_campaign_id: string | null
  created_at: string
  updated_at: string
}

export interface LeadJob {
  id: string
  agency_id: string
  client_id: string | null
  company_id: string | null
  stage: 'enrich' | 'signals' | 'route' | 'personalize' | 'verify' | 'push'
  status: 'pending' | 'running' | 'done' | 'error'
  error: string | null
  created_at: string
  updated_at: string
}

// ==============================================================
// CRM extensions (migration 027)
// ==============================================================

export type CallOutcome =
  | 'geen_gehoor'
  | 'voicemail'
  | 'verkeerd_nummer'
  | 'niet_beschikbaar'
  | 'niet_geinteresseerd'
  | 'callback_gevraagd'
  | 'gesprek_gehad'
  | 'geinteresseerd'
  | 'preview_gevraagd'
  | 'preview_verstuurd'
  | 'offerte_gevraagd'
  | 'offerte_verstuurd'
  | 'gesprek_ingepland'
  | 'klant_geworden'
  | 'ander'

export type PipelineStage =
  | 'nieuw'
  | 'gebeld_geen_gehoor'
  | 'callback'
  | 'geinteresseerd'
  | 'gesprek_gehad'
  | 'gesprek_ingepland'
  | 'preview_verstuurd'
  | 'offerte_in_maak'
  | 'offerte_verstuurd'
  | 'onderhandeling'
  | 'klant'
  | 'niet_geinteresseerd'
  | 'verkeerd_nummer'
  | 'dood'

export type ActivityType =
  | 'call_logged'
  | 'note_added'
  | 'email_sent'
  | 'email_opened'
  | 'email_replied'
  | 'meeting_scheduled'
  | 'meeting_held'
  | 'stage_changed'
  | 'assigned'
  | 'imported'
  | 'contact_updated'
  | 'company_updated'

export interface LeadCall {
  id: string
  agency_id: string
  client_id: string | null
  company_id: string
  contact_id: string | null
  outreach_id: string | null
  called_by: string | null
  called_at: string
  duration_seconds: number | null
  outcome: CallOutcome
  notes: string | null
  callback_at: string | null
  created_at: string
}

export interface LeadNote {
  id: string
  agency_id: string
  client_id: string | null
  company_id: string
  outreach_id: string | null
  contact_id: string | null
  author_id: string | null
  body: string
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export interface LeadMeeting {
  id: string
  agency_id: string
  client_id: string | null
  company_id: string
  contact_id: string | null
  outreach_id: string | null
  scheduled_by: string | null
  scheduled_at: string
  duration_min: number | null
  location: string | null
  meeting_url: string | null
  meeting_type: 'call' | 'video' | 'in_person'
  status: 'planned' | 'held' | 'cancelled' | 'no_show'
  notes: string | null
  outcome_notes: string | null
  created_at: string
  updated_at: string
}

export interface LeadActivity {
  id: string
  agency_id: string
  client_id: string | null
  company_id: string
  outreach_id: string | null
  contact_id: string | null
  actor_id: string | null
  type: ActivityType
  summary: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export const PIPELINE_STAGES: Array<{ key: PipelineStage; label: string; color: string }> = [
  { key: 'nieuw',                label: 'Nieuw',               color: '#6B7280' },
  { key: 'gebeld_geen_gehoor',   label: 'Geen gehoor',         color: '#F59E0B' },
  { key: 'callback',             label: 'Terugbellen',         color: '#3F06E3' },
  { key: 'geinteresseerd',       label: 'Geïnteresseerd',      color: '#EAB308' },
  { key: 'gesprek_gehad',        label: 'Gesprek gehad',       color: '#8B5CF6' },
  { key: 'gesprek_ingepland',    label: 'Afspraak',            color: '#22C55E' },
  { key: 'preview_verstuurd',    label: 'Preview verstuurd',   color: '#EC4899' },
  { key: 'offerte_in_maak',      label: 'Offerte in maak',     color: '#F97316' },
  { key: 'offerte_verstuurd',    label: 'Offerte verstuurd',   color: '#0EA5E9' },
  { key: 'onderhandeling',       label: 'Onderhandeling',      color: '#6366F1' },
  { key: 'klant',                label: 'KLANT',               color: '#059669' },
  { key: 'niet_geinteresseerd',  label: 'Niet geïnteresseerd', color: '#EF4444' },
  { key: 'verkeerd_nummer',      label: 'Verkeerd nummer',     color: '#9CA3AF' },
  { key: 'dood',                 label: 'Dood spoor',          color: '#4B5563' },
]

export const CALL_OUTCOMES: Array<{ key: CallOutcome; label: string; emoji: string; nextAction?: 'callback' | 'schedule' | null }> = [
  { key: 'geen_gehoor',          label: 'Geen gehoor',           emoji: '📵', nextAction: 'callback' },
  { key: 'voicemail',            label: 'Voicemail',             emoji: '🎙️', nextAction: 'callback' },
  { key: 'niet_beschikbaar',     label: 'Niet beschikbaar',      emoji: '⏰', nextAction: 'callback' },
  { key: 'callback_gevraagd',    label: 'Terugbellen op tijd',   emoji: '📞', nextAction: 'callback' },
  { key: 'gesprek_gehad',        label: 'Gesprek gehad',         emoji: '💬' },
  { key: 'geinteresseerd',       label: 'Geïnteresseerd',        emoji: '👀' },
  { key: 'preview_gevraagd',     label: 'Preview gevraagd',      emoji: '🖼️' },
  { key: 'preview_verstuurd',    label: 'Preview verstuurd',     emoji: '📤' },
  { key: 'offerte_gevraagd',     label: 'Offerte gevraagd',      emoji: '📝' },
  { key: 'offerte_verstuurd',    label: 'Offerte verstuurd',     emoji: '📄' },
  { key: 'gesprek_ingepland',    label: 'Afspraak ingepland',    emoji: '📅', nextAction: 'schedule' },
  { key: 'klant_geworden',       label: 'KLANT GEWORDEN',        emoji: '🎉' },
  { key: 'niet_geinteresseerd',  label: 'Niet geïnteresseerd',   emoji: '❌' },
  { key: 'verkeerd_nummer',      label: 'Verkeerd nummer',       emoji: '⚠️' },
  { key: 'ander',                label: 'Ander',                 emoji: '❓' },
]

// Uitbreidingen op bestaande interfaces (subset velden overriden)
export interface LeadOutreachExtended extends Omit<LeadOutreach, 'status'> {
  status: 'draft' | 'queued' | 'pushed' | 'skipped' | 'replied' | 'won' | 'lost'
  assigned_to: string | null
  next_action_at: string | null
  next_action_note: string | null
  priority: number
  last_contacted_at: string | null
  pipeline_stage: PipelineStage
}

export interface LeadCompanyExtended extends LeadCompany {
  phone_secondary: string | null
  notes: string | null
  industry: string | null
  postcode: string | null
  province: string | null
  employee_count: number | null
  smartlead_source: string | null
}

export interface LeadContactExtended extends LeadContact {
  phone: string | null
  linkedin_url: string | null
  first_name: string | null
  last_name: string | null
  is_primary: boolean
}
