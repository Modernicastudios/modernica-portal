-- Client invitation links
CREATE TABLE IF NOT EXISTS client_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID NOT NULL REFERENCES user_profiles(id),
  accepted BOOLEAN NOT NULL DEFAULT false,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE client_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can manage invitations"
  ON client_invitations FOR ALL
  USING (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_client_invitations_token ON client_invitations(token);
CREATE INDEX IF NOT EXISTS idx_client_invitations_agency ON client_invitations(agency_id);
