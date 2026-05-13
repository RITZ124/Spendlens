// ─────────────────────────────────────────────────────────────────────────────
// AUDIT ENGINE
// Pure rule-based logic. Zero AI. Every recommendation must be defensible
// to a finance-literate person. See PRICING_DATA.md for price sources.
// ─────────────────────────────────────────────────────────────────────────────

import type {
    AuditInput,
    AuditResult,
    ToolEntry,
    ToolRecommendation,
    AiToolId,
    UseCase,
  } from "@/types";
  import { PRICING_DATA } from "./pricingData";
  
  // ─── Constants ────────────────────────────────────────────────────────────────
  
  const CREDEX_SAVINGS_THRESHOLD = 500; // USD/month — promote Credex above this
  
  // Team plan breakeven: when does Team pricing beat individual pricing?
  // ChatGPT: Team=$30/seat vs Plus=$20/seat — Team only worth it for admin features
  // Claude: Team=$30/seat vs Pro=$20/seat — Team worth it at 5+ seats for collaboration
  const TEAM_MIN_WORTHWHILE_SEATS: Record<string, number> = {
    chatgpt_team: 5,   // Team adds data privacy + admin — worth it at 5+
    claude_team: 5,    // Team minimum is 5 anyway
  };
  
  // ─── Main Entry Point ─────────────────────────────────────────────────────────
  
  export function runAudit(input: AuditInput): AuditResult {
    const recommendations: ToolRecommendation[] = input.tools.map((entry) =>
      auditTool(entry, input)
    );
  
    const totalMonthlySpend = input.tools.reduce(
      (sum, t) => sum + t.monthlySpend,
      0
    );
  
    const totalOptimizedMonthlySpend = recommendations.reduce(
      (sum, r) => sum + r.estimatedMonthlyCost,
      0
    );
  
    const totalMonthlySavings = Math.max(
      0,
      totalMonthlySpend - totalOptimizedMonthlySpend
    );
  
    const totalAnnualSavings = totalMonthlySavings * 12;
  
    const savingsPercentage =
      totalMonthlySpend > 0
        ? Math.round((totalMonthlySavings / totalMonthlySpend) * 100)
        : 0;
  
    const isAlreadyOptimal = recommendations.every(
      (r) => r.recommendationType === "already_optimal"
    );
  
    return {
      input,
      recommendations,
      totalMonthlySpend,
      totalOptimizedMonthlySpend,
      totalMonthlySavings,
      totalAnnualSavings,
      savingsPercentage,
      isAlreadyOptimal,
      shouldPromoteCredex: totalMonthlySavings >= CREDEX_SAVINGS_THRESHOLD,
    };
  }
  
  // ─── Per-Tool Audit Router ────────────────────────────────────────────────────
  
  function auditTool(entry: ToolEntry, input: AuditInput): ToolRecommendation {
    switch (entry.toolId) {
      case "cursor":
        return auditCursor(entry, input);
      case "github_copilot":
        return auditGithubCopilot(entry, input);
      case "claude":
        return auditClaude(entry, input);
      case "chatgpt":
        return auditChatGPT(entry, input);
      case "anthropic_api":
        return auditAnthropicApi(entry, input);
      case "openai_api":
        return auditOpenAiApi(entry, input);
      case "gemini":
        return auditGemini(entry, input);
      case "windsurf":
        return auditWindsurf(entry, input);
      default:
        return makeOptimalResult(entry);
    }
  }
  
  // ─── Cursor Rules ─────────────────────────────────────────────────────────────
  
  function auditCursor(entry: ToolEntry, input: AuditInput): ToolRecommendation {
    const { seats, plan, monthlySpend, useCase } = entry;
    const pricePerSeat = monthlySpend / Math.max(seats, 1);
  
    // Rule C1: Non-coding use case — Cursor is a code editor, waste of money
    if (useCase !== "coding" && useCase !== "mixed") {
      return makeRecommendation(entry, {
        recommendationType: "switch_tool",
        recommendedTool: "chatgpt",
        recommendedPlan: "plus",
        estimatedMonthlyCost: seats * 20,
        reasoning: `Cursor is a coding IDE — for ${useCase} workflows, ChatGPT Plus at $20/seat delivers the same AI capability without the editor overhead.`,
        confidence: "high",
      });
    }
  
    // Rule C2: Business plan for solo dev — overkill
    if (plan === "business" && seats === 1) {
      return makeRecommendation(entry, {
        recommendationType: "downgrade_plan",
        recommendedPlan: "pro",
        estimatedMonthlyCost: 20,
        reasoning: `Cursor Business ($40/seat) adds team admin features not useful for a solo developer — Pro at $20/seat provides identical AI capabilities.`,
        confidence: "high",
      });
    }
  
    // Rule C3: Business plan for very small team without clear admin need
    if (plan === "business" && seats <= 3) {
      return makeRecommendation(entry, {
        recommendationType: "downgrade_plan",
        recommendedPlan: "pro",
        estimatedMonthlyCost: seats * 20,
        reasoning: `Cursor Business ($40/seat) for ${seats} users costs $${seats * 40}/mo — Pro at $20/seat saves $${seats * 20}/mo with identical AI features for teams under 5.`,
        confidence: "high",
      });
    }
  
    // Rule C4: Paying more than Pro price per seat — probably entered wrong amount
    if (pricePerSeat > 40 && plan !== "business") {
      return makeRecommendation(entry, {
        recommendationType: "downgrade_plan",
        recommendedPlan: "business",
        estimatedMonthlyCost: seats * 40,
        reasoning: `Your reported spend ($${pricePerSeat.toFixed(0)}/seat) exceeds Cursor Business pricing — verify billing; you may be overpaying due to add-ons or billing errors.`,
        confidence: "medium",
      });
    }
  
    // Rule C5: Windsurf as cheaper alternative for small coding teams
    if (seats >= 2 && seats <= 4 && plan === "pro") {
      return makeRecommendation(entry, {
        recommendationType: "switch_tool",
        recommendedTool: "windsurf",
        recommendedPlan: "pro",
        estimatedMonthlyCost: seats * 15,
        reasoning: `Windsurf Pro at $15/seat vs Cursor Pro at $20/seat saves $${seats * 5}/mo for your ${seats}-person team with comparable AI autocomplete quality.`,
        confidence: "medium",
      });
    }
  
    return makeOptimalResult(entry);
  }
  
  // ─── GitHub Copilot Rules ─────────────────────────────────────────────────────
  
  function auditGithubCopilot(
    entry: ToolEntry,
    input: AuditInput
  ): ToolRecommendation {
    const { seats, plan, monthlySpend, useCase } = entry;
  
    // Rule GH1: Non-coding use — wrong tool entirely
    if (useCase !== "coding" && useCase !== "mixed") {
      return makeRecommendation(entry, {
        recommendationType: "switch_tool",
        recommendedTool: "chatgpt",
        recommendedPlan: "plus",
        estimatedMonthlyCost: seats * 20,
        reasoning: `GitHub Copilot is a code completion tool — ${useCase} workflows are better served by ChatGPT Plus at the same $20/seat price point.`,
        confidence: "high",
      });
    }
  
    // Rule GH2: Individual plan — correct, but Cursor might be better
    if (plan === "individual" && seats === 1) {
      // If already paying $10, Cursor Pro at $20 is better but more expensive
      // Only suggest if they'd benefit from full IDE
      return makeOptimalResult(entry, "GitHub Copilot Individual at $10/seat is the most cost-effective coding assistant for a solo developer — optimal for your setup.");
    }
  
    // Rule GH3: Business plan for tiny team — individual is cheaper
    if (plan === "business" && seats <= 2) {
      return makeRecommendation(entry, {
        recommendationType: "downgrade_plan",
        recommendedPlan: "individual",
        estimatedMonthlyCost: seats * 10,
        reasoning: `Copilot Business ($19/seat) adds policy management not needed for ${seats} users — Individual at $10/seat halves your $${monthlySpend}/mo spend.`,
        confidence: "high",
      });
    }
  
    // Rule GH4: Enterprise for under 20 people
    if (plan === "enterprise" && seats <= 20) {
      return makeRecommendation(entry, {
        recommendationType: "downgrade_plan",
        recommendedPlan: "business",
        estimatedMonthlyCost: seats * 19,
        reasoning: `Copilot Enterprise ($39/seat) adds Bing-powered search and custom models — for ${seats} seats, Business at $19/seat saves $${seats * 20}/mo without meaningful feature loss.`,
        confidence: "high",
      });
    }
  
    // Rule GH5: Cursor is generally better for serious coding teams
    if (seats >= 3 && plan === "business") {
      return makeRecommendation(entry, {
        recommendationType: "switch_tool",
        recommendedTool: "cursor",
        recommendedPlan: "pro",
        estimatedMonthlyCost: seats * 20,
        reasoning: `Cursor Pro ($20/seat) offers superior in-editor AI (multi-file edits, codebase chat) vs Copilot Business ($19/seat) — $${seats * 1}/mo more for significantly better productivity on teams of ${seats}.`,
        confidence: "medium",
      });
    }
  
    return makeOptimalResult(entry);
  }
  
  // ─── Claude Rules ─────────────────────────────────────────────────────────────
  
  function auditClaude(entry: ToolEntry, input: AuditInput): ToolRecommendation {
    const { seats, plan, monthlySpend, useCase } = entry;
  
    // Rule CL1: Max plan for light/non-power users
    if ((plan === "max_5x" || plan === "max_20x") && seats >= 1) {
      const maxCost = plan === "max_5x" ? 100 : 200;
      if (monthlySpend / seats >= maxCost) {
        return makeRecommendation(entry, {
          recommendationType: "downgrade_plan",
          recommendedPlan: "pro",
          estimatedMonthlyCost: seats * 20,
          reasoning: `Claude Max (${plan === "max_5x" ? "$100" : "$200"}/seat) is designed for users hitting Pro rate limits daily — if your team isn&apos;t maxing out Pro's generous limits, downgrading saves $${(monthlySpend - seats * 20).toFixed(0)}/mo.`,
          confidence: "medium",
        });
      }
    }
  
    // Rule CL2: Team plan with fewer than 5 seats — Pro is better
    if (plan === "team" && seats < 5) {
      return makeRecommendation(entry, {
        recommendationType: "downgrade_plan",
        recommendedPlan: "pro",
        estimatedMonthlyCost: seats * 20,
        reasoning: `Claude Team requires 5+ seats minimum and costs $30/seat — ${seats} users on Pro at $20/seat saves $${(seats * 10).toFixed(0)}/mo with identical individual AI capabilities.`,
        confidence: "high",
      });
    }
  
    // Rule CL3: Team plan where Pro is cheaper and team features unused
    if (plan === "team" && seats >= 5 && seats <= 8 && useCase === "coding") {
      return makeRecommendation(entry, {
        recommendationType: "switch_tool",
        recommendedTool: "cursor",
        recommendedPlan: "pro",
        estimatedMonthlyCost: seats * 20,
        reasoning: `For coding-focused teams of ${seats}, Cursor Pro ($20/seat) provides deeper IDE integration than Claude Team ($30/seat) — same monthly cost with superior code tooling.`,
        confidence: "medium",
      });
    }
  
    // Rule CL4: Multiple Pro seats — Team plan might be better
    if (plan === "pro" && seats >= 5) {
      const teamCost = seats * 30;
      const proCost = seats * 20;
      // Team is worth it for collaboration features at 5+ seats
      if (teamCost < monthlySpend) {
        return makeRecommendation(entry, {
          recommendationType: "upgrade_plan",
          recommendedPlan: "team",
          estimatedMonthlyCost: teamCost,
          reasoning: `With ${seats} users on individual Pro plans ($${monthlySpend}/mo), Claude Team at $30/seat ($${teamCost}/mo) adds shared Projects, admin controls, and higher usage — only $${teamCost - proCost}/mo more for meaningful team features.`,
          confidence: "medium",
        });
      }
    }
  
    return makeOptimalResult(entry);
  }
  
  // ─── ChatGPT Rules ────────────────────────────────────────────────────────────
  
  function auditChatGPT(entry: ToolEntry, input: AuditInput): ToolRecommendation {
    const { seats, plan, monthlySpend, useCase } = entry;
  
    // Rule CH1: Team plan for 2 users — Plus is cheaper
    if (plan === "team" && seats <= 2) {
      return makeRecommendation(entry, {
        recommendationType: "downgrade_plan",
        recommendedPlan: "plus",
        estimatedMonthlyCost: seats * 20,
        reasoning: `ChatGPT Team ($30/seat, min 2) adds admin dashboard and data privacy — for ${seats} users without enterprise compliance needs, Plus at $20/seat saves $${seats * 10}/mo.`,
        confidence: "high",
      });
    }
  
    // Rule CH2: Team plan for very small team without admin needs
    if (plan === "team" && seats <= 4 && useCase !== "data") {
      return makeRecommendation(entry, {
        recommendationType: "downgrade_plan",
        recommendedPlan: "plus",
        estimatedMonthlyCost: seats * 20,
        reasoning: `ChatGPT Team ($30/seat) is designed for organizations needing centralized billing and admin — ${seats} users on Plus ($20/seat) saves $${seats * 10}/mo if you don&apos;t need SSO or audit logs.`,
        confidence: "medium",
      });
    }
  
    // Rule CH3: Enterprise for under 25 people — Team is sufficient
    if (plan === "enterprise" && seats < 25) {
      return makeRecommendation(entry, {
        recommendationType: "downgrade_plan",
        recommendedPlan: "team",
        estimatedMonthlyCost: seats * 30,
        reasoning: `ChatGPT Enterprise adds custom GPTs, SAML SSO, and SOC2 compliance — for ${seats} users without these requirements, Team at $30/seat is equivalent and publicly priced.`,
        confidence: "medium",
      });
    }
  
    // Rule CH4: Plus for data/research use — Claude Pro might be better value
    if (plan === "plus" && (useCase === "research" || useCase === "writing") && seats <= 3) {
      return makeRecommendation(entry, {
        recommendationType: "switch_tool",
        recommendedTool: "claude",
        recommendedPlan: "pro",
        estimatedMonthlyCost: seats * 20,
        reasoning: `For ${useCase} workflows, Claude Pro ($20/seat) consistently outperforms ChatGPT Plus on long-form tasks at the same price — a lateral switch with potential quality upside.`,
        confidence: "medium",
      });
    }
  
    return makeOptimalResult(entry);
  }
  
  // ─── Anthropic API Rules ──────────────────────────────────────────────────────
  
  function auditAnthropicApi(
    entry: ToolEntry,
    input: AuditInput
  ): ToolRecommendation {
    const { monthlySpend, useCase } = entry;
  
    // Rule AA1: High API spend — consider subscription + API hybrid
    if (monthlySpend > 200) {
      return makeRecommendation(entry, {
        recommendationType: "consider_credex",
        recommendedPlan: "api_credits_via_credex",
        estimatedMonthlyCost: monthlySpend * 0.75, // Credex discount ~25%
        reasoning: `At $${monthlySpend}/mo on Anthropic API, purchasing discounted credits through Credex can reduce costs by 20-30% — equivalent throughput at lower unit rates.`,
        confidence: "medium",
      });
    }
  
    // Rule AA2: Low API spend — subscription might be better
    if (monthlySpend < 40 && useCase !== "coding" && useCase !== "data") {
      return makeRecommendation(entry, {
        recommendationType: "switch_to_subscription",
        recommendedTool: "claude",
        recommendedPlan: "pro",
        estimatedMonthlyCost: 20,
        reasoning: `At $${monthlySpend}/mo on Anthropic API for ${useCase} workflows, Claude Pro ($20/month flat) provides more predictable costs and higher rate limits for conversational use.`,
        confidence: "medium",
      });
    }
  
    return makeOptimalResult(entry, "Your Anthropic API spend is in an efficient range — usage-based pricing suits variable workloads better than a fixed subscription at this scale.");
  }
  
  // ─── OpenAI API Rules ─────────────────────────────────────────────────────────
  
  function auditOpenAiApi(
    entry: ToolEntry,
    input: AuditInput
  ): ToolRecommendation {
    const { monthlySpend, useCase } = entry;
  
    // Rule OA1: High spend — Credex or Anthropic API alternative
    if (monthlySpend > 300) {
      return makeRecommendation(entry, {
        recommendationType: "consider_credex",
        recommendedPlan: "api_credits_via_credex",
        estimatedMonthlyCost: monthlySpend * 0.75,
        reasoning: `At $${monthlySpend}/mo on OpenAI API, Credex discounted credits or migrating equivalent workloads to Anthropic API (often 20-40% cheaper per token for Claude 3.5 Sonnet vs GPT-4o) can reduce costs materially.`,
        confidence: "medium",
      });
    }
  
    // Rule OA2: Moderate spend for non-data use — subscription might be better
    if (monthlySpend < 50 && useCase === "writing") {
      return makeRecommendation(entry, {
        recommendationType: "switch_to_subscription",
        recommendedTool: "chatgpt",
        recommendedPlan: "plus",
        estimatedMonthlyCost: 20,
        reasoning: `For writing workflows at $${monthlySpend}/mo on the API, ChatGPT Plus ($20 flat) offers unlimited GPT-4o access and better UX for non-programmatic writing tasks.`,
        confidence: "medium",
      });
    }
  
    return makeOptimalResult(entry, "Your OpenAI API spend is reasonable for programmatic use — flat subscriptions would cost more at your current usage level.");
  }
  
  // ─── Gemini Rules ─────────────────────────────────────────────────────────────
  
  function auditGemini(entry: ToolEntry, input: AuditInput): ToolRecommendation {
    const { seats, plan, monthlySpend, useCase } = entry;
  
    // Rule G1: Advanced plan for coding — wrong tool
    if (useCase === "coding" && plan === "advanced") {
      return makeRecommendation(entry, {
        recommendationType: "switch_tool",
        recommendedTool: "cursor",
        recommendedPlan: "pro",
        estimatedMonthlyCost: seats * 20,
        reasoning: `Gemini Advanced isn&apos;t a code editor — for coding workflows, Cursor Pro ($20/seat) provides direct IDE integration and is purpose-built for the use case at the same price.`,
        confidence: "high",
      });
    }
  
    // Rule G2: Already on free — nothing to save
    if (plan === "free") {
      return makeOptimalResult(entry, "You&apos;re on the Gemini free tier — no spend to optimize here.");
    }
  
    // Rule G3: Business (Workspace) — check if actually using Workspace features
    if (plan === "business" && seats <= 3) {
      return makeRecommendation(entry, {
        recommendationType: "downgrade_plan",
        recommendedPlan: "advanced",
        estimatedMonthlyCost: seats * 20,
        reasoning: `Gemini for Workspace Business adds Google Docs/Sheets integration — if your ${seats}-person team primarily uses the chat interface, Google One AI Premium ($20/seat) is equivalent.`,
        confidence: "medium",
      });
    }
  
    return makeOptimalResult(entry);
  }
  
  // ─── Windsurf Rules ───────────────────────────────────────────────────────────
  
  function auditWindsurf(
    entry: ToolEntry,
    input: AuditInput
  ): ToolRecommendation {
    const { seats, plan, useCase } = entry;
  
    // Rule W1: Non-coding use
    if (useCase !== "coding" && useCase !== "mixed") {
      return makeRecommendation(entry, {
        recommendationType: "switch_tool",
        recommendedTool: "chatgpt",
        recommendedPlan: "plus",
        estimatedMonthlyCost: seats * 20,
        reasoning: `Windsurf is a code editor — ${useCase} work is better served by ChatGPT Plus ($20/seat) with the same or lower price and a general-purpose AI interface.`,
        confidence: "high",
      });
    }
  
    // Rule W2: Teams plan for single user
    if (plan === "teams" && seats === 1) {
      return makeRecommendation(entry, {
        recommendationType: "downgrade_plan",
        recommendedPlan: "pro",
        estimatedMonthlyCost: 15,
        reasoning: `Windsurf Teams ($35/seat) adds admin controls with no value for a solo developer — Pro at $15/seat provides identical AI completion capabilities and saves $20/mo.`,
        confidence: "high",
      });
    }
  
    return makeOptimalResult(entry);
  }
  
  // ─── Duplicate Tool Detection ─────────────────────────────────────────────────
  
  export function detectDuplicateTools(tools: ToolEntry[]): string[] {
    const warnings: string[] = [];
    const codingTools = tools.filter((t) =>
      ["cursor", "github_copilot", "windsurf"].includes(t.toolId)
    );
  
    if (codingTools.length >= 2) {
      const names = codingTools.map((t) =>
        PRICING_DATA[t.toolId]?.displayName ?? t.toolId
      );
      const totalSpend = codingTools.reduce((s, t) => s + t.monthlySpend, 0);
      warnings.push(
        `You&apos;re paying for ${names.join(" + ")} simultaneously ($${totalSpend}/mo) — developers rarely get meaningful value from two AI code editors. Pick one.`
      );
    }
  
    const generalAi = tools.filter((t) =>
      ["claude", "chatgpt", "gemini"].includes(t.toolId)
    );
    if (generalAi.length >= 2) {
      const names = generalAi.map((t) =>
        PRICING_DATA[t.toolId]?.displayName ?? t.toolId
      );
      warnings.push(
        `You have ${names.join(" + ")} active — most teams consolidate on one general AI assistant. Evaluate which gets 80% of your usage and cancel the others.`
      );
    }
  
    return warnings;
  }
  
  // ─── Helpers ──────────────────────────────────────────────────────────────────
  
  function makeRecommendation(
    entry: ToolEntry,
    override: Partial<ToolRecommendation>
  ): ToolRecommendation {
    const estimatedMonthlyCost = override.estimatedMonthlyCost ?? entry.monthlySpend;
    const monthlySavings = Math.max(0, entry.monthlySpend - estimatedMonthlyCost);
  
    return {
      toolEntryId: entry.id,
      toolId: entry.toolId,
      currentPlan: entry.plan,
      currentMonthlySpend: entry.monthlySpend,
      recommendationType: override.recommendationType ?? "already_optimal",
      recommendedPlan: override.recommendedPlan ?? entry.plan,
      recommendedTool: override.recommendedTool,
      estimatedMonthlyCost,
      monthlySavings,
      annualSavings: monthlySavings * 12,
      reasoning: override.reasoning ?? "No changes recommended.",
      confidence: override.confidence ?? "medium",
    };
  }
  
  function makeOptimalResult(
    entry: ToolEntry,
    reasoning?: string
  ): ToolRecommendation {
    return makeRecommendation(entry, {
      recommendationType: "already_optimal",
      recommendedPlan: entry.plan,
      estimatedMonthlyCost: entry.monthlySpend,
      reasoning:
        reasoning ??
        `Your ${PRICING_DATA[entry.toolId]?.displayName ?? entry.toolId} plan is well-matched to your team size and use case — no changes recommended.`,
      confidence: "high",
    });
  }
