-- ─────────────────────────────────────────────────────────────────────────────
-- SpendLens — Supabase Schema
-- Run this entire file in your Supabase project:
--   Dashboard → SQL Editor → New query → paste → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- Audits table (public share data, no PII)
CREATE TABLE IF NOT EXISTS audits (
  id                    TEXT PRIMARY KEY,           -- nanoid(8), used as share URL
  total_monthly_spend   NUMERIC(10, 2) NOT NULL,
  total_monthly_savings NUMERIC(10, 2) NOT NULL,
  total_annual_savings  NUMERIC(10, 2) NOT NULL,
  savings_percentage    INTEGER NOT NULL,
  is_already_optimal    BOOLEAN NOT NULL DEFAULT false,
  should_promote_credex BOOLEAN NOT NULL DEFAULT false,
  tool_count            INTEGER NOT NULL DEFAULT 1,
  team_size             TEXT,
  company_stage         TEXT,
  public_data           JSONB NOT NULL,             -- sanitized, no PII
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leads table (PII — email, company)
CREATE TABLE IF NOT EXISTS leads (
  id           BIGSERIAL PRIMARY KEY,
  email        TEXT NOT NULL,
  company_name TEXT,
  role         TEXT,
  team_size    TEXT,
  audit_id     TEXT REFERENCES audits(id),
  ip_hash      TEXT,                               -- hashed, not raw IP
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(email)                                    -- prevent duplicate leads
);

-- ─── Row Level Security ───────────────────────────────────────────────────────

-- Audits: anyone can read (public share pages), only service role can write
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read audits"
  ON audits FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert audits"
  ON audits FOR INSERT
  WITH CHECK (true);   -- enforced by using service role key in API routes

-- Leads: no public access at all — service role only
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- No public policies on leads table = no public access
-- API routes use service role key (bypasses RLS) to insert

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS audits_created_at_idx ON audits(created_at DESC);
CREATE INDEX IF NOT EXISTS leads_email_idx ON leads(email);
CREATE INDEX IF NOT EXISTS leads_audit_id_idx ON leads(audit_id);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at DESC);

-- ─── Verify ───────────────────────────────────────────────────────────────────
-- After running, confirm with:
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public';
-- You should see: audits, leads