## 2026-05-20 [current time] — Start

Read Round 2 assignment in full before touching any code.
Top 0.8% — want to be deliberate, not reactive.

Plan:
- New branch: round-2-reaudit ✓
- New Supabase table: audits_v2 with email + input_stack + pricing_snapshot
- /api/detect-changes endpoint (manual trigger, not cron — 36h is too tight
  to debug Vercel Cron for the first time)
- Resend for notification emails (already set up from Round 1)
- /diff/[id] page showing old vs new recommendations side by side

Biggest risk: the diff view UI. Will timebox to 4 hours max and ship
something clean but simple rather than something fancy that doesn't work.

Starting with Supabase schema — lowest risk, establishes the foundation.