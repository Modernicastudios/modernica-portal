-- Add optional deadline to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deadline DATE;
