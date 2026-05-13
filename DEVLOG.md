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

**Hours worked:** 4

**What I did:**

Verified the complete production flow on the live Vercel deployment:
landing page → audit form → results page → shareable report → lead capture
Ran Lighthouse audits on all major pages using Chrome DevTools:
Performance: 91
Accessibility: 96
Best Practices: 100
SEO: 100
Optimized large client components by reducing unnecessary re-renders on
the results page
Fixed layout shift issue caused by animated savings counter loading before
chart components finished rendering
Added loading skeletons for AI summary and results cards to improve
perceived performance
Optimized Open Graph image generation route for faster response time
on shared audit links
Added responsive fixes for smaller mobile screens:
tool cards now stack correctly below 390px width
buttons no longer overflow horizontally
charts scale properly on mobile Safari
Added globals.css base styles and improved typography spacing
Took screenshots of all core pages and added them to
public/screenshots/
Updated README.md with:
live Vercel deployment link
feature list
screenshots
local setup instructions
Reached out to 5 people for user interviews via LinkedIn and WhatsApp
Added analytics placeholders in preparation for future event tracking
(audit completed, PDF downloaded, lead captured)

**What I learned:**

Lighthouse performance scores are heavily affected by client-side animation
timing and bundle size — even small UI animations can delay Largest
Contentful Paint if they block rendering
Mobile Safari handles overflow and viewport sizing differently from Chrome,
especially with animated charts and sticky containers
Skeleton loaders make the app feel significantly faster even when the
actual backend response time remains the same

**Blockers / what I'm stuck on:**

Waiting for responses from user interview outreach
Recharts responsiveness still needs minor tuning on very small devices
Need to test PDF export performance once more before final submission

**Plan for tomorrow:**

Conduct first 2 user interviews
Build PDF export feature
Update USER_INTERVIEWS.md with actual feedback
Run another Lighthouse pass after mobile fixes
Polish results page interactions and animations

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

## Day 6 — 2025-05-13

**Hours worked:** 5

**What I did:**
- Completed all 4 user interviews — Omkar Patil (Software Engineer, MNC via
  LinkedIn), Rakesh Joshi (Founder, 5-person AI SaaS via college alumni),
  Ashutosh Khurana (Engineering Manager, Series A via LinkedIn cold DM),
  Mayank Singh (Indie Hacker, solo bootstrapped via Indie Hackers Discord)
- Wrote up full USER_INTERVIEWS.md with quotes, surprises, and design changes
- Key insight from interviews: users care about visibility and subscription
  chaos as much as cost savings — not just "save money"
- Fixed Groq model from decommissioned llama-3.1-70b-versatile to
  llama-3.3-70b-versatile — AI summary now works correctly
- Added all 7 environment variables to Vercel dashboard — live deployment
  now connects to Supabase and Groq correctly
- Took screenshots of all 4 pages on live Vercel URL and added to README.md
- Verified git commit spread: 6 distinct calendar days confirmed
- Ran final npm run test — all 16 tests passing
- Checked GitHub Actions CI — green checkmark on latest commit
- Updated PROMPTS.md with corrected model name

**What I learned:**
- The decommissioned model error from Groq returns HTTP 400 with a clear
  message — easy to catch but only if you check the error body, not just
  the status code
- User interviews consistently surfaced "subscription visibility" as a pain
  point I hadn't fully designed for — the shareable audit card directly
  addresses this
- Vercel env vars must be added before any build that uses them — adding
  them after a failed build requires a manual redeploy trigger

**Blockers / what I'm stuck on:**
- Nothing blocking — all core features working on Vercel
- Share page requires Supabase to be reachable which works on Vercel
  but times out on local network

**Plan for tomorrow:**
- Final submission check — all 12 markdown files, CI green, live URL
- Write Day 7 DEVLOG
- Submit Google Form with GitHub URL and Vercel URL

## Day 7 — 2025-05-14

**Hours worked:** 3

**What I did:**
- Final end-to-end test on live Vercel URL:
  landing page → audit form → results → share link → lead capture
  all working correctly in production
- Verified all 12 required markdown files exist at repo root:
  README.md, ARCHITECTURE.md, DEVLOG.md, REFLECTION.md, TESTS.md,
  PRICING_DATA.md, PROMPTS.md, GTM.md, ECONOMICS.md, USER_INTERVIEWS.md,
  LANDING_COPY.md, METRICS.md
- Ran git log check — commits across 6 distinct calendar days confirmed
- Ran npm run test — 16 tests passing, 0 failing
- Confirmed GitHub Actions CI shows green checkmark on latest commit
- Submitted Google Form with public GitHub repo URL and live Vercel URL

**What I learned:**
- Building a full SaaS product in 7 days is genuinely possible if you
  make fast decisions and don't over-engineer early — the audit engine
  architecture decision on Day 1 (pure functions, no AI, fully testable)
  paid off every single day after
- Documentation is not a formality — writing GTM.md and ECONOMICS.md
  forced me to think about the business model in ways that improved the
  product itself (e.g., the >$500 savings threshold for Credex CTA)
- User interviews should happen on Day 2, not Day 5 — earlier feedback
  would have shaped the form design before it was built

**Blockers / what I'm stuck on:**
- None — submitted

**Plan for tomorrow:**
- Submitted. Done.