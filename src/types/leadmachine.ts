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
