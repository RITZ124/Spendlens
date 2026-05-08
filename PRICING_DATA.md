# PRICING DATA

All pricing used in the SpendLens audit engine. Every number traces to an official vendor pricing page.
Last verified: **2025-05-08**

---

## Cursor

| Plan | Price/seat/month | Source | Verified |
|------|-----------------|--------|---------|
| Hobby | $0 | https://www.cursor.com/pricing | 2025-05-08 |
| Pro | $20 | https://www.cursor.com/pricing | 2025-05-08 |
| Business | $40 | https://www.cursor.com/pricing | 2025-05-08 |

**Notes:** Business adds team admin, SSO, and centralized billing. No meaningful AI capability difference vs Pro for individual developers.

---

## GitHub Copilot

| Plan | Price/seat/month | Source | Verified |
|------|-----------------|--------|---------|
| Individual | $10 | https://github.com/features/copilot#pricing | 2025-05-08 |
| Business | $19 | https://github.com/features/copilot#pricing | 2025-05-08 |
| Enterprise | $39 | https://github.com/features/copilot#pricing | 2025-05-08 |

**Notes:** Enterprise adds Bing-powered search, custom models, and pull request summaries. Business adds policy management and audit logs. Individual is sufficient for most solo/small team use.

---

## Claude (Anthropic)

| Plan | Price/seat/month | Notes | Source | Verified |
|------|-----------------|-------|--------|---------|
| Free | $0 | Limited usage | https://www.anthropic.com/pricing | 2025-05-08 |
| Pro | $20 | 5x usage vs Free | https://www.anthropic.com/pricing | 2025-05-08 |
| Max (5x) | $100 | 5x Pro usage | https://www.anthropic.com/pricing | 2025-05-08 |
| Max (20x) | $200 | 20x Pro usage | https://www.anthropic.com/pricing | 2025-05-08 |
| Team | $30/seat | Min 5 seats, shared Projects | https://www.anthropic.com/pricing | 2025-05-08 |

**Notes:** Team plan minimum is 5 seats. Max plans are designed for users hitting Pro rate limits daily — not appropriate for average usage.

---

## ChatGPT (OpenAI)

| Plan | Price/seat/month | Notes | Source | Verified |
|------|-----------------|-------|--------|---------|
| Free | $0 | Limited GPT-4o | https://openai.com/chatgpt/pricing | 2025-05-08 |
| Plus | $20 | Full GPT-4o, DALL-E | https://openai.com/chatgpt/pricing | 2025-05-08 |
| Team | $30/seat | Min 2 seats, data privacy | https://openai.com/chatgpt/pricing | 2025-05-08 |
| Enterprise | ~$60/seat* | Custom quote required | https://openai.com/chatgpt/pricing | 2025-05-08 |

*Enterprise pricing not publicly listed — $60/seat is a widely reported estimate. Actual pricing requires contacting sales.

---

## Anthropic API (Direct)

| Model | Input (per MTok) | Output (per MTok) | Source | Verified |
|-------|-----------------|-------------------|--------|---------|
| Claude 3.5 Sonnet | $3.00 | $15.00 | https://www.anthropic.com/pricing#anthropic-api | 2025-05-08 |
| Claude 3.5 Haiku | $0.80 | $4.00 | https://www.anthropic.com/pricing#anthropic-api | 2025-05-08 |
| Claude 3 Opus | $15.00 | $75.00 | https://www.anthropic.com/pricing#anthropic-api | 2025-05-08 |

**Notes:** API pricing is usage-based. Audit engine flags high spends (>$200/mo) for Credex credits consideration. Low spends (<$40/mo) for conversational use are better served by Claude Pro subscription.

---

## OpenAI API (Direct)

| Model | Input (per MTok) | Output (per MTok) | Source | Verified |
|-------|-----------------|-------------------|--------|---------|
| GPT-4o | $2.50 | $10.00 | https://openai.com/api/pricing | 2025-05-08 |
| GPT-4o mini | $0.15 | $0.60 | https://openai.com/api/pricing | 2025-05-08 |
| GPT-4 Turbo | $10.00 | $30.00 | https://openai.com/api/pricing | 2025-05-08 |

---

## Google Gemini

| Plan | Price/seat/month | Notes | Source | Verified |
|------|-----------------|-------|--------|---------|
| Free | $0 | | https://one.google.com/about/plans | 2025-05-08 |
| AI Premium (Advanced) | $20 | Google One AI Premium | https://one.google.com/about/plans | 2025-05-08 |
| Workspace Business | $20/seat | Includes Workspace + Gemini | https://workspace.google.com/intl/en/pricing | 2025-05-08 |

---

## Windsurf (Codeium)

| Plan | Price/seat/month | Source | Verified |
|------|-----------------|--------|---------|
| Free | $0 | https://windsurf.com/pricing | 2025-05-08 |
| Pro | $15 | https://windsurf.com/pricing | 2025-05-08 |
| Teams | $35/seat | Min 2 seats | https://windsurf.com/pricing | 2025-05-08 |

---

## Methodology

1. All prices are **monthly, per-seat** unless noted
2. Annual billing discounts exist for some plans but are not used in audit calculations (users may already be on annual — conservative approach)
3. Enterprise plans requiring sales contact are excluded from direct recommendations — the audit notes this
4. API pricing is per million tokens (MTok) and represents list pricing as of verification date
5. All sources are primary vendor pages — no aggregators or third-party sites