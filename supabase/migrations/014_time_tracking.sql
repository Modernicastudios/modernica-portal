CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  description TEXT NOT NULL DEFAULT '',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER, -- calculated on end
  billable BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(10,2) DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency members can view time entries" ON time_entries
  FOR SELECT USING (
    agency_id IN (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert own time entries" ON time_entries
  FOR INSERT WITH CHECK (
    agency_id IN (SELECT agency_id FROM user_profiles WHERE id = auth.uid())
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update own, admins can update all" ON time_entries
  FOR UPDATE USING (
    user_id = auth.uid() OR
    agency_id IN (SELECT agency_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "Users can delete own, admins can delete all" ON time_entries
  FOR DELETE USING (
    user_id = auth.uid() OR
    agency_id IN (SELECT agency_id FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );
