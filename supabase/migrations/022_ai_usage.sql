-- ---------------------------------------------------------------------
-- AI-verbruik meten + maandlimiet per agency (multi-tenant kostenbewaking)
-- ---------------------------------------------------------------------

-- Elke AI-call legt hier een regel neer (tokens + geschatte kosten).
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,                       -- bv. 'opening_line', 'assist', 'preview'
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_agency_created ON ai_usage(agency_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_client ON ai_usage(client_id);

-- Maandlimiet per agency in dollars. NULL = gebruik de globale standaard (env).
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS ai_monthly_limit_usd NUMERIC(10,2);

-- RLS: leden van een agency mogen hun eigen verbruik lezen. Inserts gaan via de
-- service-role (server), super admin leest cross-tenant ook via service-role.
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_usage_agency_read ON ai_usage;
CREATE POLICY ai_usage_agency_read ON ai_usage
  FOR SELECT
  USING (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));
