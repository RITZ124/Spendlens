# PROMPTS.md

Documentation of all LLM prompts used in SpendLens, as required by the Credex assignment.

---

## AI Summary Prompt

**Location:** `src/app/api/summary/route.ts`
**Model:** `llama-3.1-70b-versatile` via Groq Cloud
**Why Groq over Anthropic API:** Groq provides 14,400 free requests/day with ~500 token/s inference speed — the summary appears in under 2 seconds, vs a noticeable spinner with other providers. For a summary that appears live on the results page, latency is UX.

### System Prompt

```
You are a concise, financially sharp AI spend analyst. You write audit summaries for startup founders and engineering managers. No bullet points. Write in 2-3 flowing sentences. Be direct and specific — cite actual numbers. Never be vague.
```

**Why this system prompt:**
- "Financially sharp" steers away from generic motivational language
- "No bullet points" — the UI renders prose, not lists
- "Cite actual numbers" — prevents vague summaries like "you could save some money"
- "Never be vague" — the biggest failure mode for LLM summaries is hedging

### User Prompt (savings case)

```
Write a 2-3 sentence audit summary for a startup spending $[SPEND]/month across [N] AI tools.
They can save $[SAVINGS]/month ([PCT]% reduction).
Key recommendations: [REC_1]. [REC_2]. [REC_3].
Be specific about the dollar amounts and what they should do first.
End with one sentence about how acting on this within 30 days compounds to $[ANNUAL]/year.
```

### User Prompt (already optimal case)

```
Write a 2-sentence audit summary for a startup spending $[SPEND]/month across [N] AI tools.
Their setup is well-optimized — no major changes needed.
Acknowledge this positively but suggest they revisit in 3 months as pricing changes.
```

---

## What I tried that didn't work

### Attempt 1 — Single prompt, no system message
The model returned summaries that were too generic. Without a system prompt establishing the persona, it defaulted to motivational language ("Great news! You could save money!") instead of financial analysis. Adding the system prompt fixed this immediately.

### Attempt 2 — Asking for bullet points
Early version asked for a bulleted list. The results page is designed for a prose paragraph — bullets looked wrong in the UI card. Switched to prose with "2-3 flowing sentences" instruction.

### Attempt 3 — Too many recommendations in context
Passing all recommendations into the prompt caused the model to try to address each one, making summaries too long. Capped at 3 recommendations (`slice(0, 3)`) and the output became more focused.

### Attempt 4 — Using Anthropic API directly
Tried `claude-3-haiku-20240307` first. The quality was great but the free tier token limits made it impractical for a public tool. Groq's llama-3.1-70b is comparable quality at much higher free throughput.

---

## Fallback behavior

If the Groq API fails (rate limit, timeout, error), the UI falls back to a templated string:

- **Savings case:** "Your audit found $X/month in potential savings across N AI tools. The biggest opportunity is adjusting your current plans to better match your team size and use cases."
- **Optimal case:** "Your team is spending $X/month on AI tools and your configuration looks well-optimized. No major changes needed right now."

The fallback is shown without any visual difference — users don't see an error state.

---

## What the AI is NOT used for

The audit engine (`src/lib/auditEngine.ts`) uses zero AI. Every pricing recommendation is a deterministic TypeScript function with hardcoded pricing data sourced from vendor pages (see `PRICING_DATA.md`).

This is intentional. LLMs are unreliable for financial calculations:
- They can hallucinate prices
- They can change outputs for identical inputs
- They can't be unit tested

Rule-based logic is correct for the math. AI is correct for the human-readable summary.