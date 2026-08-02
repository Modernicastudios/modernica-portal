-- =====================================================================
-- Extra pipeline stages + call outcomes voor rijkere workflow
-- =====================================================================

-- Verwijder oude constraint en voeg nieuwe stages toe
ALTER TABLE lead_outreach DROP CONSTRAINT IF EXISTS lead_outreach_pipeline_stage_check;

ALTER TABLE lead_outreach ADD CONSTRAINT lead_outreach_pipeline_stage_check
  CHECK (pipeline_stage IN (
    'nieuw', 'gebeld_geen_gehoor', 'callback',
    'geinteresseerd', 'gesprek_gehad', 'gesprek_ingepland',
    'preview_verstuurd', 'offerte_in_maak', 'offerte_verstuurd',
    'onderhandeling', 'klant', 'niet_geinteresseerd',
    'verkeerd_nummer', 'dood'
  ));

-- Nieuwe outcomes voor calls
ALTER TABLE lead_calls DROP CONSTRAINT IF EXISTS lead_calls_outcome_check;

ALTER TABLE lead_calls ADD CONSTRAINT lead_calls_outcome_check
  CHECK (outcome IN (
    'geen_gehoor', 'voicemail', 'verkeerd_nummer', 'niet_beschikbaar',
    'niet_geinteresseerd', 'callback_gevraagd',
    'gesprek_gehad', 'geinteresseerd',
    'preview_gevraagd', 'preview_verstuurd',
    'offerte_gevraagd', 'offerte_verstuurd',
    'gesprek_ingepland', 'klant_geworden', 'ander'
  ));

-- Trigger uitbreiden voor nieuwe outcomes → stage mapping
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
          WHEN NEW.outcome = 'geinteresseerd'         THEN 'geinteresseerd'
          WHEN NEW.outcome = 'gesprek_gehad'          THEN 'gesprek_gehad'
          WHEN NEW.outcome = 'gesprek_ingepland'      THEN 'gesprek_ingepland'
          WHEN NEW.outcome = 'preview_gevraagd'       THEN 'geinteresseerd'
          WHEN NEW.outcome = 'preview_verstuurd'      THEN 'preview_verstuurd'
          WHEN NEW.outcome = 'offerte_gevraagd'       THEN 'offerte_in_maak'
          WHEN NEW.outcome = 'offerte_verstuurd'      THEN 'offerte_verstuurd'
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
