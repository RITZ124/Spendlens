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

## Day 3 — 2025-05-10

**Hours worked:** 3

**What I did:**
- Copied all page files into correct Next.js App Router folder structure:
  `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/audit/page.tsx`,
  `src/app/results/page.tsx`, `src/app/share/[id]/page.tsx`,
  `src/app/share/[id]/SharePageClient.tsx`
- Added all 4 API routes: `/api/audit`, `/api/leads`, `/api/summary`, `/api/og`
- Ran Supabase schema SQL — `audits` and `leads` tables created with RLS policies
- Filled in `.env.local` with real Supabase URL, anon key, service role key,
  Groq API key, and Resend API key
- Installed all dependencies: `@supabase/supabase-js`, `groq-sdk`, `nanoid`,
  `resend`, `recharts`, `framer-motion`, `vitest`, `@vitejs/plugin-react`
- Added shadcn/ui components: button, card, input, label, select, badge, progress
- Fixed `tsconfig.json` to include `paths: { "@/*": ["./src/*"] }` for imports
- Added `"test"` and `"typecheck"` scripts to `package.json`
- Ran `npm run test` — all 16 audit engine tests passing
- Ran `npm run dev` — app running locally at localhost:3000
- Tested full flow: landing page → audit form → results page → share link
- Verified Supabase: audit row saved, lead row saved after email submit
- Hit build error on Vercel: `og/route.ts` had JSX inside a `.ts` file
  (should be `.tsx`) — Turbopack threw `Expected '>', got 'ident'`
- Debugged: the file was renamed locally but git didn't track the rename properly
- Fixed by running `git rm src/app/api/og/route.ts` then
  `git add src/app/api/og/route.tsx` to force git to register the rename
- Redeployed to Vercel — build passed after the fix
- Added all environment variables to Vercel dashboard under
  Settings → Environment Variables

**What I learned:**
- Next.js (and Turbopack) strictly requires `.tsx` extension for any file
  containing JSX — `.ts` files cannot have angle-bracket syntax even if
  the content is valid React. This is different from how some bundlers handle it
- Git does not always detect file renames automatically, especially when the
  old and new filenames differ only in extension — `git rm` + `git add` is
  the reliable way to force it
- Vercel reads environment variables at build time — adding them to `.env.local`
  only is not enough; they must also be added in the Vercel dashboard or the
  deployed app will have undefined keys
- The `NEXT_PUBLIC_` prefix on Supabase URL and anon key is required because
  those values are accessed in client components — without the prefix, Next.js
  treats them as server-only and they come through as `undefined` in the browser

**Blockers / what I'm stuck on:**
- Need to add screenshots to README.md now that the app is live on Vercel
- User interviews not started yet — will reach out to 5 people today over
  WhatsApp and LinkedIn so I have responses by Day 5
- Need to verify Lighthouse scores on the live Vercel URL

**Plan for tomorrow:**
- Run Lighthouse audit on deployed URL (Chrome DevTools → Lighthouse tab)
- Fix any score below 85 Performance / 90 Accessibility
- Take screenshots of all 4 pages for README.md
- Start reaching out for user interviews
- Write Day 4 DEVLOG entry
- Polish results page UI — check mobile responsiveness

## Day 4 — 2025-05-11

**Hours worked:** X

**What I did:**
- Verified full end-to-end flow on live Vercel deployment
- Ran Lighthouse audit on deployed URL:
  Performance: XX, Accessibility: XX, Best Practices: XX
- [describe any fixes you made based on Lighthouse]
- Added 4 screenshots to public/screenshots/ folder
- Updated README.md with actual screenshots and live URL
- Reached out to 5 people for user interviews over WhatsApp/LinkedIn
- [add anything else you did]

**What I learned:**
- [something real you learned today]

**Blockers / what I'm stuck on:**
- Waiting for user interview responses
- [anything else]

**Plan for tomorrow:**
- Conduct user interviews as responses come in
- Fix any remaining Lighthouse issues
- Polish mobile UI on results page

## Day 5 — 2025-05-12

**Hours worked:** 4

**What I did:**
- Built PDF export feature (bonus feature from assignment spec)
- Created `src/lib/generatePdf.ts` using jsPDF — generates a fully styled
  A4 PDF with header, savings hero, per-tool breakdown, summary table,
  Credex section, and page numbers
- Used dynamic imports for jsPDF and html2canvas so the libraries only
  load when the user clicks "Download PDF" — keeps main bundle small
- Added PDF download button to results page with loading state
- Expanded share/lead/PDF grid to 3 columns on large screens
- Conducted user interview 1 — [initials], [role] — [key insight]
- Conducted user interview 2 — [initials], [role] — [key insight]
- Updated USER_INTERVIEWS.md with notes from both conversations

**What I learned:**
- jsPDF's coordinate system starts from top-left, Y increases downward —
  need to track current Y position manually and add page breaks explicitly
- Dynamic imports (`await import(...)`) in Next.js reduce initial bundle
  size significantly — jsPDF is ~300KB, no reason to load it on page mount
- `doc.splitTextToSize()` is essential for wrapping long strings in jsPDF —
  without it, text overflows off the page edge

**Blockers / what I'm stuck on:**
- Third user interview scheduled for tomorrow
- Need to update USER_INTERVIEWS.md with design changes based on feedback

**Plan for tomorrow:**
- Conduct third user interview
- Complete USER_INTERVIEWS.md
- Final Lighthouse check on all pages
- Write DEVLOG Day 6
- Review all 12 markdown files for completeness before submission

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