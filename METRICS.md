# METRICS.md

## North Star Metric

**Audits completed per week**

Definition: A user who reaches the results page with at least one tool entered and a valid audit result rendered.

### Why this metric, not others

| Rejected metric | Why it's wrong for this stage |
|----------------|------------------------------|
| Daily Active Users (DAU) | SpendLens is a tool people use once a quarter when they review costs, not daily. DAU would chronically look bad even if the tool is working. |
| Page views | A visitor who bounces from the landing page without starting the form is worthless. Page views measure reach, not value. |
| Leads captured | Leads are downstream of audits. Optimizing for leads before optimizing for audit completion would push us to add a pre-audit email gate — which kills conversion. Value must come first. |
| Revenue | Too early. The tool is free and monetization is indirect (Credex consultations). Revenue is a lagging indicator — by the time it's low, you've already failed upstream. |

**Audits completed** is the metric where the user has received real value. Everything else — leads, shares, Credex consultations — flows from this. If audits completed is growing, the business is working.

**Target:** 100 audits/week by end of month 1, 500/week by end of month 3.

---

## 3 Input Metrics That Drive the North Star

### 1. Landing page → form start rate
**What it measures:** Of everyone who lands on the homepage, what percentage clicks "Start audit" and reaches the form.

**Why it matters:** If this rate is low (<30%), the landing page is failing to communicate value. Fix the hero copy, the social proof, or the CTA.

**Target:** >40% (industry benchmark for a free no-login tool is 25–35%; we should beat this because there's zero friction)

**How to instrument:** PostHog event on "Audit started" button click divided by unique homepage sessions.

---

### 2. Form completion rate
**What it measures:** Of users who start the form, what percentage submit it and reach the results page.

**Why it matters:** Drop-off here means the form is too long, confusing, or scary. A user who abandons mid-form got no value.

**Target:** >75% (the form is short — 1 tool entry takes 30 seconds)

**How to instrument:** PostHog event on "Run my free audit" click divided by "Audit started" events. Track which step users abandon (tool entry vs spend input vs submit).

---

### 3. Lead capture rate (post-audit)
**What it measures:** Of users who complete an audit, what percentage submit their email.

**Why it matters:** This is the monetization signal. Low lead rate means users got value but don't trust us with their email, OR the prompt to submit came too early or too aggressively.

**Current design decision:** Email is requested *after* results are shown, never before. This is non-negotiable — the assignment spec requires it and it's correct UX.

**Target:** >30% overall, >50% for audits showing >$500/month in savings (these users have strong motivation to follow up)

**How to instrument:** PostHog event on lead form submission divided by results page renders, segmented by `shouldPromoteCredex` boolean.

---

## What to instrument first

Priority order for analytics setup:

1. **Audit completed** — the North Star. Fire PostHog event with `{ toolCount, totalSpend, totalSavings, savingsPercentage, shouldPromoteCredex }`
2. **Audit started** — to compute form completion rate
3. **Lead submitted** — to compute lead capture rate
4. **Share link copied** — viral coefficient measurement
5. **Credex CTA clicked** — bottom-of-funnel signal

```typescript
// Example PostHog event (add to results page useEffect)
posthog.capture('audit_completed', {
  tool_count: result.input.tools.length,
  total_monthly_spend: result.totalMonthlySpend,
  total_monthly_savings: result.totalMonthlySavings,
  savings_percentage: result.savingsPercentage,
  is_already_optimal: result.isAlreadyOptimal,
  should_promote_credex: result.shouldPromoteCredex,
  team_size: result.input.teamSize,
});
```

---

## What number triggers a pivot decision

| Metric | Threshold | Action |
|--------|-----------|--------|
| Form completion rate | < 50% for 2 consecutive weeks | Shorten form — reduce to 3 fields per tool instead of 5 |
| Lead capture rate | < 15% | The audit isn't generating enough perceived value — add savings visualization before the email ask |
| Audits with $0 savings | > 60% of total | Audit engine is too conservative — review pricing rules and lower the "already optimal" threshold |
| Credex CTA click rate | < 10% of high-savings audits | CTA copy or positioning isn't working — test different headline and offer |
| Share link copied but no new audits | Share-to-new-audit rate < 5% | The share page isn't convincing — redesign the public share page CTA |

**The main pivot signal:**
If after 4 weeks and 200+ audits, the lead-to-Credex-consultation rate is below 5%, the tool is generating value for users but not for Credex. At that point, reconsider whether the audit should include a more direct Credex offer earlier in the flow (e.g., showing Credex savings estimates on the form page, before the full audit runs).

---

## Reporting cadence

| Frequency | What to review |
|-----------|---------------|
| Daily | Audits completed (absolute), any errors in Supabase logs |
| Weekly | All three input metrics, lead capture rate, share rate |
| Monthly | LTV trajectory, Credex consultation conversion rate, top tools entered |