-- Voeg white-label kolommen toe aan brand_kits
ALTER TABLE brand_kits
  ADD COLUMN IF NOT EXISTS favicon_url TEXT,
  ADD COLUMN IF NOT EXISTS login_bg_url TEXT,
  ADD COLUMN IF NOT EXISTS email_header_url TEXT,
  ADD COLUMN IF NOT EXISTS custom_css TEXT,
  ADD COLUMN IF NOT EXISTS powered_by_visible BOOLEAN NOT NULL DEFAULT true;
