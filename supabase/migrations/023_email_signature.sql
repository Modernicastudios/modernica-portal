-- ---------------------------------------------------------------------
-- Agency-brede e-mailhandtekening (één keer instellen, overal hetzelfde)
-- ---------------------------------------------------------------------
ALTER TABLE brand_kits ADD COLUMN IF NOT EXISTS email_signature TEXT;
