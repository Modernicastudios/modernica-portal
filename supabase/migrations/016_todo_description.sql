-- Add optional description to project_todos
ALTER TABLE project_todos ADD COLUMN IF NOT EXISTS description TEXT;
