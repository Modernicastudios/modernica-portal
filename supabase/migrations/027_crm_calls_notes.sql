-- =====================================================================
-- CRM uitbreiding — calls, notes, activities, meetings + outreach velden
-- Bouwt voort op 020_leadmachine.sql. Volgt agency_access RLS-patroon.
-- =====================================================================

-- ---------------------------------------------------------------------
-- lead_outreach uitbreidingen: assignment + follow-up
-- ---------------------------------------------------------------------
ALTER TABLE lead_outreach
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES user_profiles(id),
  ADD COLUMN IF NOT EXISTS next_action_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_action_note TEXT,
  ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pipeline_stage TEXT DEFAULT 'nieuw' CHECK (pipeline_stage IN (
    'nieuw', 'gebeld_geen_gehoor', 'callback', 'gesprek_gehad',
    'gesprek_ingepland', 'offerte_verstuurd', 'klant', 'niet_geinteresseerd',
    'verkeerd_nummer', 'dood'
  ));

-- lead_companies: extra CRM velden
ALTER TABLE lead_companies
  ADD COLUMN IF NOT EXISTS phone_secondary TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS postcode TEXT,
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS employee_count INTEGER,
  ADD COLUMN IF NOT EXISTS smartlead_source TEXT;

-- lead_contacts: extra velden
ALTER TABLE lead_contacts
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- ---------------------------------------------------------------------
-- lead_calls — elke belpoging + resultaat
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES lead_companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES lead_contacts(id) ON DELETE SET NULL,
  outreach_id UUID REFERENCES lead_outreach(id) ON DELETE SET NULL,
  called_by UUID REFERENCES user_profiles(id),
  called_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_seconds INTEGER,
  outcome TEXT NOT NULL CHECK (outcome IN (
    'geen_gehoor', 'voicemail', 'verkeerd_nummer', 'niet_beschikbaar',
    'niet_geinteresseerd', 'callback_gevraagd', 'gesprek_gehad',
    'gesprek_ingepland', 'offerte_gevraagd', 'klant_geworden', 'ander'
  )),
  notes TEXT,
  callback_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- lead_notes — algemene notities per lead
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES lead_companies(id) ON DELETE CASCADE,
  outreach_id UUID REFERENCES lead_outreach(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES lead_contacts(id) ON DELETE SET NULL,
  author_id UUID REFERENCES user_profiles(id),
  body TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- lead_meetings — geplande gesprekken/afspraken
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES lead_companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES lead_contacts(id) ON DELETE SET NULL,
  outreach_id UUID REFERENCES lead_outreach(id) ON DELETE SET NULL,
  scheduled_by UUID REFERENCES user_profiles(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_min INTEGER DEFAULT 30,
  location TEXT,
  meeting_url TEXT,
  meeting_type TEXT DEFAULT 'call' CHECK (meeting_type IN ('call', 'video', 'in_person')),
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'held', 'cancelled', 'no_show')),
  notes TEXT,
  outcome_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- lead_activities — unified timeline feed
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES lead_companies(id) ON DELETE CASCADE,
  outreach_id UUID REFERENCES lead_outreach(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES lead_contacts(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES user_profiles(id),
  type TEXT NOT NULL CHECK (type IN (
    'call_logged', 'note_added', 'email_sent', 'email_opened', 'email_replied',
    'meeting_scheduled', 'meeting_held', 'stage_changed', 'assigned',
    'imported', 'contact_updated', 'company_updated'
  )),
  summary TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Indexes voor performance
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_lead_outreach_assigned_to ON lead_outreach(assigned_to);
CREATE INDEX IF NOT EXISTS idx_lead_outreach_next_action ON lead_outreach(next_action_at);
CREATE INDEX IF NOT EXISTS idx_lead_outreach_pipeline_stage ON lead_outreach(pipeline_stage);

CREATE INDEX IF NOT EXISTS idx_lead_calls_agency ON lead_calls(agency_id);
CREATE INDEX IF NOT EXISTS idx_lead_calls_company ON lead_calls(company_id);
CREATE INDEX IF NOT EXISTS idx_lead_calls_called_by ON lead_calls(called_by);
CREATE INDEX IF NOT EXISTS idx_lead_calls_called_at ON lead_calls(called_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_calls_callback ON lead_calls(callback_at) WHERE callback_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lead_notes_agency ON lead_notes(agency_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_company ON lead_notes(company_id);

CREATE INDEX IF NOT EXISTS idx_lead_meetings_agency ON lead_meetings(agency_id);
CREATE INDEX IF NOT EXISTS idx_lead_meetings_company ON lead_meetings(company_id);
CREATE INDEX IF NOT EXISTS idx_lead_meetings_scheduled ON lead_meetings(scheduled_at) WHERE status = 'planned';

CREATE INDEX IF NOT EXISTS idx_lead_activities_agency ON lead_activities(agency_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_company ON lead_activities(company_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created ON lead_activities(created_at DESC);

-- ---------------------------------------------------------------------
-- RLS — zelfde patroon als 020_leadmachine.sql
-- ---------------------------------------------------------------------
ALTER TABLE lead_calls      ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_meetings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_calls_agency_access" ON lead_calls
  USING (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()))
  WITH CHECK (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "lead_notes_agency_access" ON lead_notes
  USING (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()))
  WITH CHECK (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "lead_meetings_agency_access" ON lead_meetings
  USING (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()))
  WITH CHECK (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "lead_activities_agency_access" ON lead_activities
  USING (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()))
  WITH CHECK (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));

-- ---------------------------------------------------------------------
-- Trigger: auto-log call → activity
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_call_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO lead_activities (agency_id, client_id, company_id, outreach_id, contact_id, actor_id, type, summary, metadata)
  VALUES (
    NEW.agency_id, NEW.client_id, NEW.company_id, NEW.outreach_id, NEW.contact_id, NEW.called_by,
    'call_logged',
    'Gebeld: ' || NEW.outcome,
    jsonb_build_object('outcome', NEW.outcome, 'duration', NEW.duration_seconds, 'callback_at', NEW.callback_at)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lead_calls_activity ON lead_calls;
CREATE TRIGGER trg_lead_calls_activity
  AFTER INSERT ON lead_calls
  FOR EACH ROW EXECUTE FUNCTION log_call_activity();

-- Trigger: auto-log note → activity
CREATE OR REPLACE FUNCTION log_note_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO lead_activities (agency_id, client_id, company_id, outreach_id, contact_id, actor_id, type, summary, metadata)
  VALUES (
    NEW.agency_id, NEW.client_id, NEW.company_id, NEW.outreach_id, NEW.contact_id, NEW.author_id,
    'note_added',
    LEFT(NEW.body, 100),
    jsonb_build_object('note_id', NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lead_notes_activity ON lead_notes;
CREATE TRIGGER trg_lead_notes_activity
  AFTER INSERT ON lead_notes
  FOR EACH ROW EXECUTE FUNCTION log_note_activity();

-- Trigger: auto-log meeting → activity
CREATE OR REPLACE FUNCTION log_meeting_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO lead_activities (agency_id, client_id, company_id, outreach_id, contact_id, actor_id, type, summary, metadata)
  VALUES (
    NEW.agency_id, NEW.client_id, NEW.company_id, NEW.outreach_id, NEW.contact_id, NEW.scheduled_by,
    'meeting_scheduled',
    'Meeting ingepland: ' || TO_CHAR(NEW.scheduled_at, 'DD-MM-YYYY HH24:MI'),
    jsonb_build_object('meeting_id', NEW.id, 'type', NEW.meeting_type)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lead_meetings_activity ON lead_meetings;
CREATE TRIGGER trg_lead_meetings_activity
  AFTER INSERT ON lead_meetings
  FOR EACH ROW EXECUTE FUNCTION log_meeting_activity();

-- Trigger: on call insert, update outreach last_contacted_at + callback_at
CREATE OR REPLACE FUNCTION update_outreach_from_call()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.outreach_id IS NOT NULL THEN
    UPDATE lead_outreach
    SET last_contacted_at = NEW.called_at,
        next_action_at = COALESCE(NEW.callback_at, next_action_at),
        updated_at = now(),
        pipeline_stage = CASE
          WHEN NEW.outcome = 'geen_gehoor'           THEN 'gebeld_geen_gehoor'
          WHEN NEW.outcome = 'callback_gevraagd'      THEN 'callback'
          WHEN NEW.outcome = 'gesprek_gehad'          THEN 'gesprek_gehad'
          WHEN NEW.outcome = 'gesprek_ingepland'      THEN 'gesprek_ingepland'
          WHEN NEW.outcome = 'offerte_gevraagd'       THEN 'offerte_verstuurd'
          WHEN NEW.outcome = 'klant_geworden'         THEN 'klant'
          WHEN NEW.outcome = 'niet_geinteresseerd'    THEN 'niet_geinteresseerd'
          WHEN NEW.outcome = 'verkeerd_nummer'        THEN 'verkeerd_nummer'
          ELSE pipeline_stage
        END
    WHERE id = NEW.outreach_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_call_updates_outreach ON lead_calls;
CREATE TRIGGER trg_call_updates_outreach
  AFTER INSERT ON lead_calls
  FOR EACH ROW EXECUTE FUNCTION update_outreach_from_call();
