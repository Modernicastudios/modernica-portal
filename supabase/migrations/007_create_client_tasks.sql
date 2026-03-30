-- Per-client takenlijsten (zowel agency als client kunnen aanvullen)
CREATE TABLE IF NOT EXISTS client_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  assigned_to UUID REFERENCES user_profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'waiting', 'done')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_tasks_agency_id ON client_tasks(agency_id);
CREATE INDEX IF NOT EXISTS idx_client_tasks_client_id ON client_tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_client_tasks_status ON client_tasks(status);

-- RLS
ALTER TABLE client_tasks ENABLE ROW LEVEL SECURITY;

-- Agency members kunnen alles zien en bewerken
CREATE POLICY "client_tasks_agency_access" ON client_tasks
  USING (agency_id = (SELECT agency_id FROM user_profiles WHERE id = auth.uid()));

-- Clients kunnen hun eigen taken zien en aanmaken
CREATE POLICY "client_tasks_client_access" ON client_tasks
  USING (
    client_id IN (
      SELECT client_id FROM user_profiles WHERE id = auth.uid() AND client_id IS NOT NULL
    )
  );
