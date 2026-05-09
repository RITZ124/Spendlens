# TESTS.md

All automated tests for SpendLens. Run with `npm run test`.

---

## How to run

```bash
# Run all tests once
npm run test

# Watch mode (re-runs on file change)
npm run test:watch

# Type check (no tests, just TypeScript)
npm run typecheck
```

---

## Test file: `__tests__/auditEngine.test.ts`

**What it covers:** The core audit engine — the most critical business logic in the app. Every recommendation rule is tested with real pricing math.

### Test list

| Test | What it checks |
|------|---------------|
| `C2: Cursor Business solo dev` | Flags Cursor Business ($40) for 1 user → downgrade to Pro ($20) → $20/mo savings |
| `C3: Cursor Business 3-person team` | Flags Business plan for ≤3 users → Pro → $60/mo savings |
| `C1: Non-coding Cursor user` | Recommends ChatGPT for writing use case on Cursor |
| `Cursor Pro solo optimal` | Confirms Cursor Pro + 1 seat + coding = no recommendation |
| `CH1: ChatGPT Team 2 users` | Flags Team ($30/seat, 2 users = $60) → Plus ($20/seat = $40) → $20/mo savings |
| `CH2: ChatGPT Team 4-person non-data` | Team → Plus for 4 users saves $40/mo |
| `CL2: Claude Team under 5 seats` | Flags Team plan (min 5) for 3 users → Pro → $30/mo savings |
| `CL1: Claude Max overkill` | Flags Max (5x) for users not hitting Pro limits |
| `GH2: Copilot Business 2 users` | Business ($19/seat × 2 = $38) → Individual ($10/seat = $20) → $18/mo savings |
| `GH4: Copilot Enterprise under 20` | Enterprise ($39 × 10 = $390) → Business ($19 × 10 = $190) → $200/mo savings |
| `Aggregation: multi-tool savings` | Cursor Business solo + ChatGPT Team 2 = $40 total savings, $480/year |
| `Credex threshold: >$500/mo savings` | `shouldPromoteCredex = true` when savings exceed $500 |
| `Already optimal` | Single Cursor Pro solo → `isAlreadyOptimal = true`, zero savings |
| `Duplicate: Cursor + Copilot` | detectDuplicateTools warns about redundant coding tools |
| `Duplicate: Claude + ChatGPT` | detectDuplicateTools warns about two general AI tools |
| `No duplicates: single tool` | No warning for a single tool |

### Running specific tests

```bash
# Run only Cursor tests
npx vitest run --reporter verbose -t "Cursor"

# Run only aggregation tests
npx vitest run --reporter verbose -t "Audit result aggregation"
```

---

## CI

Tests run automatically on every push to `main` via GitHub Actions (`.github/workflows/ci.yml`).

The workflow runs:
1. `npm run lint` — ESLint
2. `npx tsc --noEmit` — TypeScript type check
3. `npm run test` — Vitest

A green checkmark on the latest commit confirms all three pass.