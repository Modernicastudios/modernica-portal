-- =====================================================================
-- Multi-caller lock — voorkom dat 2 callers dezelfde lead pakken
-- Voegt claim fields toe + atomic function om te grabben
-- =====================================================================

ALTER TABLE lead_outreach
  ADD COLUMN IF NOT EXISTS in_call_by UUID REFERENCES user_profiles(id),
  ADD COLUMN IF NOT EXISTS in_call_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_lead_outreach_in_call ON lead_outreach(in_call_by, in_call_at) WHERE in_call_by IS NOT NULL;

-- Atomic claim function — zoekt volgende lead voor caller + zet lock
-- Gebruikt FOR UPDATE SKIP LOCKED zodat 2 callers nooit dezelfde row pakken
CREATE OR REPLACE FUNCTION claim_next_lead(
  p_agency_id UUID,
  p_caller_id UUID,
  p_lock_minutes INTEGER DEFAULT 30
) RETURNS lead_outreach AS $$
DECLARE
  v_lead lead_outreach;
  v_cutoff TIMESTAMPTZ;
BEGIN
  v_cutoff := now() - (p_lock_minutes || ' minutes')::interval;

  -- 1. Priority: callback aan tijd + niet nu geclaimd
  SELECT * INTO v_lead FROM lead_outreach
  WHERE agency_id = p_agency_id
    AND pipeline_stage = 'callback'
    AND next_action_at <= now()
    AND (in_call_by IS NULL OR in_call_at < v_cutoff OR in_call_by = p_caller_id)
  ORDER BY next_action_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- 2. Assigned aan huidige caller
  IF v_lead IS NULL THEN
    SELECT * INTO v_lead FROM lead_outreach
    WHERE agency_id = p_agency_id
      AND assigned_to = p_caller_id
      AND pipeline_stage IN ('nieuw', 'gebeld_geen_gehoor')
      AND (in_call_by IS NULL OR in_call_at < v_cutoff OR in_call_by = p_caller_id)
    ORDER BY priority DESC NULLS LAST, created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
  END IF;

  -- 3. Fresh onassigned lead met telefoon
  IF v_lead IS NULL THEN
    SELECT lo.* INTO v_lead FROM lead_outreach lo
    JOIN lead_companies lc ON lc.id = lo.company_id
    WHERE lo.agency_id = p_agency_id
      AND lo.assigned_to IS NULL
      AND lo.pipeline_stage IN ('nieuw', 'gebeld_geen_gehoor')
      AND lc.phone IS NOT NULL
      AND (lo.in_call_by IS NULL OR lo.in_call_at < v_cutoff OR lo.in_call_by = p_caller_id)
    ORDER BY lo.priority DESC NULLS LAST, lo.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
  END IF;

  -- Als niks gevonden: return NULL
  IF v_lead IS NULL THEN
    RETURN NULL;
  END IF;

  -- Claim: zet in_call_by + in_call_at
  UPDATE lead_outreach
  SET in_call_by = p_caller_id, in_call_at = now()
  WHERE id = v_lead.id;

  v_lead.in_call_by := p_caller_id;
  v_lead.in_call_at := now();

  RETURN v_lead;
END;
$$ LANGUAGE plpgsql;

-- Release function — wordt aangeroepen na log_call of skip
CREATE OR REPLACE FUNCTION release_lead_claim(p_outreach_id UUID, p_caller_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE lead_outreach
  SET in_call_by = NULL, in_call_at = NULL
  WHERE id = p_outreach_id AND in_call_by = p_caller_id;
END;
$$ LANGUAGE plpgsql;

-- Automatische release trigger — als lead_call wordt gelogd, release de claim
CREATE OR REPLACE FUNCTION release_on_call_log()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.outreach_id IS NOT NULL AND NEW.called_by IS NOT NULL THEN
    PERFORM release_lead_claim(NEW.outreach_id, NEW.called_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_release_on_call ON lead_calls;
CREATE TRIGGER trg_release_on_call
  AFTER INSERT ON lead_calls
  FOR EACH ROW EXECUTE FUNCTION release_on_call_log();
