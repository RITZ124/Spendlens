# DEVLOG — SpendLens

> Daily build log for the Credex Web Development Intern assignment.
> One entry per day for 7 days. Git history confirms authenticity.

---

## Day 1 — 2025-05-08

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

## Day 2 — YYYY-MM-DD

**Hours worked:** X

**What I did:** ...

**What I learned:** ...

**Blockers / what I'm stuck on:** ...

**Plan for tomorrow:** ...

---

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