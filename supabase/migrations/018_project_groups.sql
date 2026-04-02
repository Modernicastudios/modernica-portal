-- Project Campagnes / Groepen
-- Groepeert meerdere projecten van dezelfde klant onder één campagne

CREATE TABLE IF NOT EXISTS project_groups (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id   UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#1a3fe4',
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Voeg group_id kolom toe aan projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES project_groups(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE project_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_groups_select" ON project_groups FOR SELECT
  USING (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "project_groups_insert" ON project_groups FOR INSERT
  WITH CHECK (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "project_groups_update" ON project_groups FOR UPDATE
  USING (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "project_groups_delete" ON project_groups FOR DELETE
  USING (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));

-- Index voor snelle queries
CREATE INDEX IF NOT EXISTS project_groups_agency_idx ON project_groups(agency_id);
CREATE INDEX IF NOT EXISTS projects_group_idx ON projects(group_id);
