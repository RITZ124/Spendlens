# ECONOMICS.md — Unit Economics

## What Credex does (context for the math)

Credex buys surplus AI credits from companies that overforecast — Cursor, Claude, ChatGPT Enterprise — at a discount, then resells them to startups at below-retail prices. The margin is the spread between acquisition cost and sale price.

SpendLens is a free lead-generation tool. It identifies startups that are overspending on AI tools and surfaces Credex as the solution for high-savings cases (>$500/month).

---

## What a converted lead is worth to Credex

### Assumptions (conservative)

| Variable | Estimate | Source |
|----------|----------|--------|
| Avg monthly AI spend per startup (audits showing >$500 savings) | $2,000/mo | Implied by the $500+ savings threshold — these are teams spending meaningfully |
| Credex discount offered vs retail | 25% | Publicly described range is 20–40%; using 25% as conservative |
| Startup captures 15% of that discount via Credex | $300/mo savings for customer | Customer gets real value, Credex keeps the margin |
| Credex gross margin on the deal | 10% of retail price | Conservative — actual spread likely higher on some inventory |
| Customer monthly spend through Credex | $1,700/mo | $2,000 × 85% (they buy at discount) |
| Credex revenue per customer per month | $170/mo | 10% margin × $1,700 |
| Average customer retention | 18 months | Subscription-style repeat purchases |
| **LTV per converted customer** | **$3,060** | $170/mo × 18 months |

This is conservative. A startup that buys $2,000/month in AI credits through Credex for 18 months = **$3,060 LTV**.

A mid-tier customer ($5,000/month spend) = **$7,650 LTV**.

---

## Customer Acquisition Cost (CAC) by channel

### Channel 1: SpendLens organic (free tool)

| Step | Rate | Number |
|------|------|--------|
| Monthly visitors to SpendLens | — | 1,000 |
| Audit completion rate | 40% | 400 audits |
| Audits showing >$500/mo savings | 25% | 100 high-value audits |
| Lead capture rate (email) | 35% | 35 leads |
| Credex consultation booked | 20% of leads | 7 consultations |
| Consultation → credit purchase | 50% | 3–4 customers/month |

**CAC via SpendLens: ~$0 cash** (tool is already built; marginal cost = Groq API calls at ~$0.002/audit + Supabase storage)

Real CAC accounting for the tool's build cost (7 days of engineering time):
- Intern engineer: ~$0 (assignment)
- Ongoing: ~$5/month infra (Supabase Pro + Vercel + Resend)
- **Effective CAC per customer: $5/month ÷ 3.5 customers/month ≈ $1.40**

### Channel 2: Twitter/X organic content

| Input | Estimate |
|-------|----------|
| 4 hours/week of content creation | — |
| Cost (intern time) | ~$30/week at intern rate |
| Audits driven per month from content | 200 |
| Customers acquired per month | 1.75 (same funnel above at 50% volume) |
| **CAC** | **~$68/customer** |

### Channel 3: Product Hunt / HN launch

| Input | Estimate |
|-------|----------|
| One-time launch effort | 8 hours |
| Visitors from a successful launch | 2,000–5,000 (one-time) |
| Audits completed | 800–2,000 |
| Customers acquired | 14–35 (one-time) |
| Cost | $0 cash, ~$80 of engineering time |
| **CAC** | **~$2.50–5.70/customer** |

---

## Conversion funnel math

```
Visitors → Audit Started → Audit Completed → Lead Captured → Consultation → Purchase

1,000    →    500 (50%)   →    400 (80%)   →    140 (35%)  →   28 (20%)  →  14 (50%)
```

**Monthly customers acquired per 1,000 visitors: ~14**
**Monthly revenue generated: 14 × $170 = $2,380/month recurring**

The funnel is deliberately front-heavy (free tool, no friction) with monetization at the back (consultation booking). This is correct for a B2B lead-gen tool — you capture intent first, convert later.

---

## What has to be true for $1M ARR in 18 months

### Target: $1,000,000 ARR = $83,333/month revenue

At $170/month per customer, that requires **490 active customers** paying monthly through Credex.

### Path to 490 customers

| Month | New Customers/Month | Cumulative | Monthly Revenue |
|-------|-------------------|------------|-----------------|
| 1–2   | 10                | 20         | $3,400          |
| 3–4   | 20                | 60         | $10,200         |
| 5–6   | 35                | 130        | $22,100         |
| 7–9   | 50                | 280        | $47,600         |
| 10–12 | 60                | 460        | $78,200         |
| 13–15 | 70                | 670        | $113,900        |
| 16–18 | 80                | 890        | $151,300        |

**$1M ARR is crossed around month 15–16.**

### What has to be true

1. **SpendLens drives 2,000+ monthly audits by month 6.** This requires either a successful Product Hunt launch (one-time 2,000–5,000 visitors) or consistent content distribution. Not guaranteed but achievable.

2. **Lead-to-consultation rate stays above 15%.** This depends on the quality of the follow-up email sequence and whether the Credex sales team responds within 24 hours. Currently, the email just confirms the audit — a proper 3-email drip would 2x this rate.

3. **Credex's credit inventory scales with demand.** If Credex can't source enough discounted Cursor or Claude credits to serve 490 customers at $2,000/month each ($980,000/month in GMV), the bottleneck is supply, not demand. This is the most uncertain assumption.

4. **Customer retention is 18 months.** Startups die, pivot, or change stacks. If retention is 12 months instead of 18, LTV drops from $3,060 to $2,040 and the model still works but requires more new customers each month.

5. **Avg spend per customer is $2,000/month.** The audit tool is biased toward high-spend users (we only show Credex prominently for >$500 savings). Users with <$500 in savings are lower value and we tell them honestly. This filters toward higher-spend customers, which supports the $2,000 assumption.

---

## Break-even analysis

Monthly costs at scale (month 12):

| Cost | Amount |
|------|--------|
| Supabase Pro | $25/mo |
| Vercel Pro | $20/mo |
| Resend (10k emails/mo) | $20/mo |
| Groq API (paid tier) | ~$50/mo at 5k audits/month |
| **Total infra** | **~$115/mo** |

At $2,380/month revenue (per 1,000 visitors, per month), the tool is profitable from month 1. The infra costs are negligible relative to LTV.

**The real cost is distribution — content, partnerships, and sales follow-up time.** The tool itself has near-zero marginal cost.

---

## Summary

| Metric | Value |
|--------|-------|
| LTV per converted customer | $3,060 (conservative) |
| CAC via SpendLens organic | ~$1.40 |
| LTV:CAC ratio | **2,186:1** |
| Monthly customers at 1,000 visitors | ~14 |
| Visitors needed for $1M ARR | ~35,000/month by month 15 |
| Most important assumption | Credex credit inventory scales |

The unit economics are exceptional. The constraint is not margin — it's distribution volume and Credex's ability to fulfill demand.