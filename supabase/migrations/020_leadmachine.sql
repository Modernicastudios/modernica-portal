-- =====================================================================
-- Leadmachine — lead-generatie / verrijking / outreach (multi-tenant)
-- Alle tabellen geprefixt met lead_ en gescoped per agency_id (+ client_id).
-- Volgt het bestaande RLS-patroon: agency_access + client_access policies.
-- Raakt geen bestaande tabellen aan; voegt alleen nieuw toe.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Campagnes: de activerings-eenheid. Een agency zet lead-gen op,
-- optioneel voor een specifieke klant (client_id). client_id NULL =
-- de agency doet lead-gen voor zichzelf.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  created_by UUID REFERENCES user_profiles(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'done')),
  region TEXT,
  sbi_code TEXT,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Bedrijven (uit ingestion)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES lead_campaigns(id) ON DELETE SET NULL,
  kvk_number TEXT,
  name TEXT NOT NULL,
  domain TEXT,
  website_url TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  sbi_code TEXT,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agency_id, kvk_number)
);

-- ---------------------------------------------------------------------
-- Contactpersonen (uit enrichment-waterval)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES lead_companies(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT,
  email TEXT,
  found_via TEXT CHECK (found_via IN ('apollo', 'site_scrape', 'pattern')),
  confidence INTEGER CHECK (confidence BETWEEN 0 AND 100),
  email_verified TEXT CHECK (email_verified IN ('valid', 'risky', 'invalid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Gedetecteerde signalen per bedrijf (multi-service)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES lead_companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('website', 'social', 'ads', 'video', 'recruitment', 'local')),
  score INTEGER CHECK (score BETWEEN 0 AND 100),
  detail JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Pitchbare diensten per bedrijf (gerangschikt, met sub-modules)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_service_fits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES lead_companies(id) ON DELETE CASCADE,
  service TEXT NOT NULL CHECK (service IN ('website', 'social', 'ads', 'video', 'recruitment', 'local')),
  score INTEGER CHECK (score BETWEEN 0 AND 100),
  rank INTEGER,
  pitchable BOOLEAN NOT NULL DEFAULT false,
  modules JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Outreach: 1 rij per dienst die je daadwerkelijk pitcht
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_outreach (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES lead_companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES lead_contacts(id) ON DELETE SET NULL,
  service_fit_id UUID REFERENCES lead_service_fits(id) ON DELETE SET NULL,
  service TEXT CHECK (service IN ('website', 'social', 'ads', 'video', 'recruitment', 'local')),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  opening_line TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'queued', 'pushed', 'skipped', 'replied', 'won', 'lost')),
  smartlead_campaign_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Eenvoudige job-queue voor orchestratie
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  company_id UUID REFERENCES lead_companies(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('enrich', 'signals', 'route', 'personalize', 'verify', 'push')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'error')),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_lead_campaigns_agency_id ON lead_campaigns(agency_id);
CREATE INDEX IF NOT EXISTS idx_lead_campaigns_client_id ON lead_campaigns(client_id);
CREATE INDEX IF NOT EXISTS idx_lead_campaigns_status ON lead_campaigns(status);

CREATE INDEX IF NOT EXISTS idx_lead_companies_agency_id ON lead_companies(agency_id);
CREATE INDEX IF NOT EXISTS idx_lead_companies_client_id ON lead_companies(client_id);
CREATE INDEX IF NOT EXISTS idx_lead_companies_campaign_id ON lead_companies(campaign_id);

CREATE INDEX IF NOT EXISTS idx_lead_contacts_agency_id ON lead_contacts(agency_id);
CREATE INDEX IF NOT EXISTS idx_lead_contacts_company_id ON lead_contacts(company_id);

CREATE INDEX IF NOT EXISTS idx_lead_signals_agency_id ON lead_signals(agency_id);
CREATE INDEX IF NOT EXISTS idx_lead_signals_company_id ON lead_signals(company_id);

CREATE INDEX IF NOT EXISTS idx_lead_service_fits_agency_id ON lead_service_fits(agency_id);
CREATE INDEX IF NOT EXISTS idx_lead_service_fits_company_id ON lead_service_fits(company_id);

CREATE INDEX IF NOT EXISTS idx_lead_outreach_agency_id ON lead_outreach(agency_id);
CREATE INDEX IF NOT EXISTS idx_lead_outreach_company_id ON lead_outreach(company_id);
CREATE INDEX IF NOT EXISTS idx_lead_outreach_status ON lead_outreach(status);

CREATE INDEX IF NOT EXISTS idx_lead_jobs_agency_id ON lead_jobs(agency_id);
CREATE INDEX IF NOT EXISTS idx_lead_jobs_status ON lead_jobs(status);

-- ---------------------------------------------------------------------
-- RLS — zelfde patroon als bestaande tabellen (zie 007_create_client_tasks)
-- agency_access: leden van de agency zien/bewerken alles van hun agency.
-- client_access: een klant ziet alleen rijen die aan zijn client_id hangen.
-- ---------------------------------------------------------------------
ALTER TABLE lead_campaigns     ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_companies     ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_contacts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_signals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_service_fits  ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_outreach      ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_jobs          ENABLE ROW LEVEL SECURITY;

-- Agency-leden: volledige toegang (lezen + schrijven) tot hun eigen agency-rijen.
-- Klanten: alléén lezen van rijen die aan hun client_id hangen (leads zijn een
-- agency-tool; klanten mogen niet schrijven).
CREATE POLICY "lead_campaigns_agency_access" ON lead_campaigns
  USING (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()))
  WITH CHECK (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "lead_campaigns_client_read" ON lead_campaigns FOR SELECT
  USING (client_id IN (SELECT client_id FROM user_profiles WHERE id = auth.uid() AND client_id IS NOT NULL));

CREATE POLICY "lead_companies_agency_access" ON lead_companies
  USING (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()))
  WITH CHECK (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "lead_companies_client_read" ON lead_companies FOR SELECT
  USING (client_id IN (SELECT client_id FROM user_profiles WHERE id = auth.uid() AND client_id IS NOT NULL));

CREATE POLICY "lead_contacts_agency_access" ON lead_contacts
  USING (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()))
  WITH CHECK (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "lead_contacts_client_read" ON lead_contacts FOR SELECT
  USING (client_id IN (SELECT client_id FROM user_profiles WHERE id = auth.uid() AND client_id IS NOT NULL));

CREATE POLICY "lead_signals_agency_access" ON lead_signals
  USING (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()))
  WITH CHECK (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "lead_signals_client_read" ON lead_signals FOR SELECT
  USING (client_id IN (SELECT client_id FROM user_profiles WHERE id = auth.uid() AND client_id IS NOT NULL));

CREATE POLICY "lead_service_fits_agency_access" ON lead_service_fits
  USING (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()))
  WITH CHECK (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "lead_service_fits_client_read" ON lead_service_fits FOR SELECT
  USING (client_id IN (SELECT client_id FROM user_profiles WHERE id = auth.uid() AND client_id IS NOT NULL));

CREATE POLICY "lead_outreach_agency_access" ON lead_outreach
  USING (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()))
  WITH CHECK (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));
CREATE POLICY "lead_outreach_client_read" ON lead_outreach FOR SELECT
  USING (client_id IN (SELECT client_id FROM user_profiles WHERE id = auth.uid() AND client_id IS NOT NULL));

CREATE POLICY "lead_jobs_agency_access" ON lead_jobs
  USING (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()))
  WITH CHECK (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));
