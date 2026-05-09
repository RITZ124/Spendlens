# DEVLOG — SpendLens

> Daily build log for the Credex Web Development Intern assignment.
> One entry per day for 7 days. Git history confirms authenticity.

---

## Day 1 — 2026-05-08

**Hours worked:** 3

**What I did:**
- Initialized Next.js 14 project with TypeScript, Tailwind CSS, and shadcn/ui
- Set up the complete folder structure: `src/types`, `src/lib`, `src/components`, `src/app`
- Installed all core dependencies: Supabase, Groq SDK, nanoid, Resend, Recharts, Framer Motion
- Created the complete TypeScript type system in `src/types/index.ts` — covers all tool entries, audit inputs, recommendation types, and lead capture shapes
- Built the full pricing data module (`src/lib/pricingData.ts`) with official prices for all 8 required tools, sourced from vendor pages
- Wrote the core audit engine (`src/lib/auditEngine.ts`) with 40+ rule-based recommendations covering plan fit, seat optimization, use-case matching, and cross-tool comparisons
- Wrote 15 unit tests in `__tests__/auditEngine.test.ts` covering all major rule paths and edge cases
- Set up Vitest config with path aliases
- Set up GitHub Actions CI workflow (`.github/workflows/ci.yml`)
- Created `.env.local.example` with all required environment variables documented
- Connected the GitHub repo to Vercel — blank deployment is live
- Named the product: **SpendLens**

**What I learned:**
- Next.js 14 App Router has a different project structure from Pages Router — layouts, server components, and API routes all work differently
- The audit engine logic is essentially a big decision tree — writing it as pure TypeScript functions (no AI) makes it testable and defensible
- Discovered that ChatGPT Team requires a minimum of 2 seats, but Claude Team requires 5 — this asymmetry matters for the audit logic

**Blockers / what I'm stuck on:**
- Need to decide between Upstash Redis vs a simpler in-memory rate limiter for the MVP — leaning toward Upstash since it's free and production-grade
- Need to research exact Anthropic API pricing per MTok to handle the API audit rules accurately

**Plan for tomorrow:**
- Build the spend input form UI (`src/app/audit/page.tsx`) with all 8 tools, plan selectors, and localStorage persistence
- Add the Supabase database schema (audits + leads tables)
- Start the landing page hero section

---

## Day 2 — 2025-05-09

**Hours worked:** 6

**What I did:**
- Built the complete landing page (`src/app/page.tsx`) with hero section, animated stats bar, how-it-works steps, feature grid, social proof cards, and footer — all responsive
- Built the full spend input form (`src/app/audit/page.tsx`) supporting all 8 required AI tools with per-tool plan selectors, monthly spend input, seat count, and use case — form state persists to localStorage on every keystroke so nothing is lost on refresh
- Built the results page (`src/app/results/page.tsx`) with animated savings counter (counts up from 0), per-tool breakdown cards with recommendation badges, a Recharts bar chart comparing current vs optimized spend, AI summary card with loading skeleton, Credex CTA (only shown when savings exceed $500/month), share link copy button, and inline lead capture form
- Built the public share page (`src/app/share/[id]/page.tsx` + `SharePageClient.tsx`) — shows sanitized audit data with no PII, full OG/Twitter meta tags per audit
- Built all 4 API routes:
  - `/api/audit` — saves audit to Supabase, returns nanoid share ID
  - `/api/leads` — captures email leads with honeypot spam protection and in-memory rate limiting, sends confirmation email via Resend
  - `/api/summary` — calls Groq llama-3.1-70b-versatile, returns ~100 word personalized summary, falls back to template on failure
  - `/api/og` — generates dynamic Open Graph images per audit using Next.js ImageResponse
- Wrote the complete Supabase schema (`supabase-schema.sql`) with audits and leads tables, Row Level Security policies, and indexes
- Wrote `PROMPTS.md` documenting the full Groq prompt, system message, what I tried that failed, and why AI is NOT used for the audit math
- Wrote `TESTS.md` listing all 16 unit tests with descriptions and run instructions
- Updated `src/app/layout.tsx` with full SEO metadata, Open Graph, and Twitter card tags

**What I learned:**
- Next.js App Router requires `"use client"` at the top of any component that uses `useState`, `useEffect`, or browser APIs like `localStorage` — server components cannot use these
- The `share/[id]` folder needs literal square brackets in the folder name — Next.js uses this for dynamic route params
- Groq's llama-3.1-70b returns responses in under 2 seconds which is fast enough to feel instant — no need for streaming for a 100-word summary
- Honeypot fields for spam protection must be visually hidden with CSS but NOT `display:none` — bots that render CSS will skip hidden fields, but dumb bots fill everything
- `nanoid(8)` generates 8-character URL-safe IDs with ~281 trillion combinations — more than enough for share URLs

**Blockers / what I'm stuck on:**
- Resend requires a verified domain for the `from` address in production — using `onboarding@resend.dev` for development which works fine on free tier
- The `@vercel/og` ImageResponse uses edge runtime which has limitations — cannot use Node.js APIs like `Buffer` directly in the OG route
- Need to add Vercel environment variables before the deployed URL will work end-to-end

**Plan for tomorrow:**
- Add remaining markdown docs: ARCHITECTURE.md, GTM.md, ECONOMICS.md, LANDING_COPY.md, METRICS.md, README.md
- Start user interviews — will DM 5 people today so I have responses by Day 4
- Run Lighthouse audit on deployed URL and fix any score below 85
- Add the `globals.css` base styles if Tailwind isn't applying correctly

## Day 3 — YYYY-MM-DD

**Hours worked:** X

**What I did:** ...

**What I learned:** ...

**Blockers / what I'm stuck on:** ...

**Plan for tomorrow:** ...

---

## Day 4 — YYYY-MM-DD

**Hours worked:** X

**What I did:** ...

**What I learned:** ...

**Blockers / what I'm stuck on:** ...

**Plan for tomorrow:** ...

---

## Day 5 — YYYY-MM-DD

**Hours worked:** X

**What I did:** ...

**What I learned:** ...

**Blockers / what I'm stuck on:** ...

**Plan for tomorrow:** ...

---

## Day 6 — YYYY-MM-DD

**Hours worked:** X

**What I did:** ...

**What I learned:** ...

**Blockers / what I'm stuck on:** ...

**Plan for tomorrow:** ...

---

## Day 7 — YYYY-MM-DD

**Hours worked:** X

**What I did:** ...

**What I learned:** ...

**Blockers / what I'm stuck on:** ...

**Plan for tomorrow:** Submitted. Done.