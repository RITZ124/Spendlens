# REFLECTION.md

Five questions answered honestly about building SpendLens in 7 days.

---

## 1. The hardest bug you hit this week, and how you debugged it

The hardest bug was the audit engine producing negative savings values in certain edge cases — specifically when a user entered a monthly spend lower than what the recommended plan would cost.

**The scenario:** A user entered "Cursor Business, 1 seat, $10/month." The actual Cursor Business price is $40/seat. The user was clearly either on an old grandfathered plan or had entered a wrong number. The audit engine recommended downgrading to Cursor Pro at $20/month — which would cost *more* than what they claimed to be paying. `monthlySavings = $10 - $20 = -$10`.

**What I tried first:** I assumed the issue was in the savings calculation and added a `Math.abs()` call. This was wrong — it made a negative saving look like a positive one, which would show misleading recommendations.

**What I tried next:** I added a `Math.max(0, ...)` clamp on the savings value. This was closer but still wrong — it would show a recommendation with $0 savings, which looks broken in the UI.

**What actually worked:** I added a pre-audit validation step that checks whether the user's entered spend is significantly lower than the official plan price. If `monthlySpend / seats < officialPlanPrice * 0.6`, it means either the user is on an old rate or misremembered — and the engine now handles this with a `"medium"` confidence flag and a note in the reasoning: *"Your reported spend is below current pricing — you may be on a grandfathered plan. Verify your current rate before switching."*

The fix required two changes: (1) the `Math.max(0, ...)` clamp on `monthlySavings` in `makeRecommendation()` so savings never go negative in the output, and (2) a confidence downgrade to "medium" whenever the entered spend is meaningfully below official pricing.

**What I learned:** Hardcoded pricing rules break when user inputs are outside expected ranges. The audit engine needed to be defensive about both upward and downward outliers, not just the happy path.

---

## 2. A decision you reversed mid-week, and what made you reverse it

I originally built the lead capture form as the *first* step — before showing any results. The thinking was: collect the email upfront, then show the audit. This is how a lot of SaaS landing pages work.

I reversed this on Day 3 after re-reading the assignment spec, which explicitly states: *"Email is captured after value is shown, never before."*

But more importantly, when I tested the form on a friend (who became one of my user interviews), they said immediately: "I'm not giving you my email before I know if this is even useful." That one sentence was more persuasive than any conversion rate data.

The reversal required restructuring the results page flow: the full audit renders immediately from localStorage, the email form is below the fold, and it's positioned as "get this report sent to you" rather than "sign up." The lead capture rate I estimated would go down with this change — but the audit completion rate would go up because there's no friction gate. More people completing the audit at a lower lead rate is better than fewer people starting.

The lesson: when the spec and the user say the same thing, you don't need to test it. Just do it.

---

## 3. What you would build in week 2 if you had it

**Priority 1: Three-email drip sequence for leads**
Right now, the confirmation email is transactional — "here's your audit." A proper sequence would be:
- Email 1 (immediate): Your audit results + share link
- Email 2 (day 3): "Here's what other startups with a similar stack did" — a case study
- Email 3 (day 7): "Ready to capture your savings? Book a Credex consultation"

This sequence would materially improve the consultation booking rate. It's the highest-leverage thing missing from the current build.

**Priority 2: Benchmark mode**
Show the user how their AI spend per developer compares to similar-stage companies. "Your team of 8 spends $187/developer/month on AI tools. The median for Series A companies is $95." This data would come from aggregate audit data — no PII, just spend-per-seat distributions. This feature makes the results shareable even for users who are already well-optimized.

**Priority 3: PDF export**
A downloadable PDF of the audit report. CTOs present this to their finance team or CEO. The PDF adds credibility and keeps SpendLens in the conversation weeks after the audit. Would use `@react-pdf/renderer` or a server-side Puppeteer screenshot.

**Priority 4: Re-audit reminders**
After 90 days, send users who gave their email a reminder: "AI tool pricing has changed since your last audit — run a new one." This drives repeat usage and catches new overspending patterns as tools update pricing.

---

## 4. How you used AI tools

**Which tools:** Claude (claude.ai), GitHub Copilot in VS Code

**What I used them for:**
- Claude: Generating boilerplate TypeScript types, reviewing my audit engine logic for edge cases I might have missed, writing first drafts of email HTML templates, checking my Mermaid diagram syntax
- Copilot: Autocompleting repetitive audit rule patterns once the structure was established, filling in shadcn/ui component props

**What I didn't trust them with:**
- The pricing data. I manually verified every price on every vendor's official pricing page. An LLM's training data is months old and pricing changes frequently. I found two discrepancies where Claude's suggested prices were outdated.
- The audit logic decisions. When deciding whether "ChatGPT Team for 4 users" should be flagged, I worked through the reasoning myself: Team = $30/seat, Plus = $20/seat, Team adds data privacy and admin features — at 4 users without compliance needs, Plus is cheaper and sufficient. This reasoning had to be mine because I'm the one defending it in code review.
- The documentation. GTM.md, ECONOMICS.md, and REFLECTION.md are written entirely by me. AI can produce plausible-sounding GTM strategies but they're generic. The specifics — the exact subreddits, the DM strategy, the Credex unfair channel — came from thinking about the actual product and user.

**One specific time the AI was wrong and I caught it:**
I asked Claude to suggest the monthly price for Claude Team plan. It said "$25/seat." The actual price is $30/seat (minimum 5 seats). I caught this when I cross-referenced against anthropic.com/pricing. If I hadn't verified, the audit engine would have been underpricing Claude Team recommendations by $5/seat — making some "downgrade" recommendations show incorrect savings.

---

## 5. Self-rating 1–10

**Discipline: 7/10**
I started on Day 1, committed every day, and wrote DEVLOG entries honestly. I lost about half a day to debugging the negative savings bug that I should have designed around from the start. I could have been more systematic about edge cases before writing code rather than discovering them during testing.

**Code quality: 6/10**
The audit engine is clean — pure functions, good TypeScript types, tested. The UI components are functional but some have more state complexity than necessary. The results page component is too long and should be split into sub-components. Given the 7-day constraint, I prioritized shipping over refactoring, which was the right call but leaves quality lower than I'd accept in a production codebase.

**Design sense: 7/10**
The landing page and results page look professional — dark hero, clean cards, good typography hierarchy. The animated savings counter adds genuine delight. Where I fell short: mobile polish on the form page needs more testing, and the results page has some spacing inconsistencies on small screens. Lighthouse accessibility score needs verification before submission.

**Problem solving: 8/10**
The audit engine architecture decision (pure functions, no AI, fully testable) was correct and I made it early. The negative savings edge case fix was found through systematic hypothesis testing rather than random changes. The Groq-over-Anthropic API decision was reasoned correctly given the free tier constraints.

**Entrepreneurial thinking: 7/10**
I understood the business model (free tool → leads → Credex consultations) from the start and built toward it: Credex CTA only shown for >$500 savings, honest "spending well" message for optimized stacks, email captured after value shown. What I would improve: I should have done the user interviews on Day 2 instead of Day 5, which would have informed the form design earlier.