import { describe, it, expect } from "vitest";
import { runAudit, detectDuplicateTools } from "@/lib/auditEngine";
import type { AuditInput, ToolEntry } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEntry(
  overrides: Partial<ToolEntry> & { toolId: ToolEntry["toolId"] }
): ToolEntry {
  return {
    id: "test-" + Math.random().toString(36).slice(2),
    plan: "pro",
    monthlySpend: 20,
    seats: 1,
    useCase: "coding",
    ...overrides,
  };
}

function makeInput(tools: ToolEntry[]): AuditInput {
  return {
    tools,
    teamSize: "2-5",
    companyStage: "early",
  };
}

// ─── Cursor Tests ─────────────────────────────────────────────────────────────

describe("Cursor audit rules", () => {
  it("C2: flags Cursor Business for solo dev as overkill", () => {
    const entry = makeEntry({
      toolId: "cursor",
      plan: "business",
      seats: 1,
      monthlySpend: 40,
      useCase: "coding",
    });
    const result = runAudit(makeInput([entry]));
    const rec = result.recommendations[0];
    expect(rec.recommendationType).toBe("downgrade_plan");
    expect(rec.recommendedPlan).toBe("pro");
    expect(rec.monthlySavings).toBe(20);
    expect(rec.annualSavings).toBe(240);
  });

  it("C3: flags Cursor Business for 3-person team — Pro is sufficient", () => {
    const entry = makeEntry({
      toolId: "cursor",
      plan: "business",
      seats: 3,
      monthlySpend: 120,
      useCase: "coding",
    });
    const result = runAudit(makeInput([entry]));
    const rec = result.recommendations[0];
    expect(rec.recommendationType).toBe("downgrade_plan");
    expect(rec.monthlySavings).toBe(60);
  });

  it("C1: recommends ChatGPT for non-coding Cursor user", () => {
    const entry = makeEntry({
      toolId: "cursor",
      plan: "pro",
      seats: 2,
      monthlySpend: 40,
      useCase: "writing",
    });
    const result = runAudit(makeInput([entry]));
    const rec = result.recommendations[0];
    expect(rec.recommendationType).toBe("switch_tool");
    expect(rec.recommendedTool).toBe("chatgpt");
  });

  it("Cursor Pro for solo coder is optimal", () => {
    const entry = makeEntry({
      toolId: "cursor",
      plan: "pro",
      seats: 1,
      monthlySpend: 20,
      useCase: "coding",
    });
    const result = runAudit(makeInput([entry]));
    expect(result.recommendations[0].recommendationType).toBe("already_optimal");
    expect(result.totalMonthlySavings).toBe(0);
  });
});

// ─── ChatGPT Tests ────────────────────────────────────────────────────────────

describe("ChatGPT audit rules", () => {
  it("CH1: flags ChatGPT Team for 2 users — Plus is cheaper", () => {
    const entry = makeEntry({
      toolId: "chatgpt",
      plan: "team",
      seats: 2,
      monthlySpend: 60,
      useCase: "writing",
    });
    const result = runAudit(makeInput([entry]));
    const rec = result.recommendations[0];
    expect(rec.recommendationType).toBe("downgrade_plan");
    expect(rec.recommendedPlan).toBe("plus");
    expect(rec.monthlySavings).toBe(20);
  });

  it("CH2: flags ChatGPT Team for 4-person non-data team", () => {
    const entry = makeEntry({
      toolId: "chatgpt",
      plan: "team",
      seats: 4,
      monthlySpend: 120,
      useCase: "research",
    });
    const result = runAudit(makeInput([entry]));
    expect(result.recommendations[0].monthlySavings).toBe(40);
  });
});

// ─── Claude Tests ─────────────────────────────────────────────────────────────

describe("Claude audit rules", () => {
  it("CL2: Claude Team for 3 users — Pro is better (below 5 seat minimum)", () => {
    const entry = makeEntry({
      toolId: "claude",
      plan: "team",
      seats: 3,
      monthlySpend: 90,
      useCase: "writing",
    });
    const result = runAudit(makeInput([entry]));
    const rec = result.recommendations[0];
    expect(rec.recommendationType).toBe("downgrade_plan");
    expect(rec.recommendedPlan).toBe("pro");
    expect(rec.monthlySavings).toBe(30);
  });

  it("CL1: Claude Max flagged when fewer than max users needed", () => {
    const entry = makeEntry({
      toolId: "claude",
      plan: "max_5x",
      seats: 2,
      monthlySpend: 200,
      useCase: "writing",
    });
    const result = runAudit(makeInput([entry]));
    expect(result.recommendations[0].recommendationType).toBe("downgrade_plan");
  });
});

// ─── GitHub Copilot Tests ─────────────────────────────────────────────────────

describe("GitHub Copilot audit rules", () => {
  it("GH2: Copilot Business for 2 users — Individual is cheaper", () => {
    const entry = makeEntry({
      toolId: "github_copilot",
      plan: "business",
      seats: 2,
      monthlySpend: 38,
      useCase: "coding",
    });
    const result = runAudit(makeInput([entry]));
    const rec = result.recommendations[0];
    expect(rec.recommendationType).toBe("downgrade_plan");
    expect(rec.recommendedPlan).toBe("individual");
    expect(rec.monthlySavings).toBe(18);
  });

  it("GH4: Copilot Enterprise for 10 people — Business is sufficient", () => {
    const entry = makeEntry({
      toolId: "github_copilot",
      plan: "enterprise",
      seats: 10,
      monthlySpend: 390,
      useCase: "coding",
    });
    const result = runAudit(makeInput([entry]));
    const rec = result.recommendations[0];
    expect(rec.recommendationType).toBe("downgrade_plan");
    expect(rec.recommendedPlan).toBe("business");
    expect(rec.monthlySavings).toBe(200);
  });
});

// ─── Totals & Aggregation Tests ───────────────────────────────────────────────

describe("Audit result aggregation", () => {
  it("correctly sums savings across multiple tools", () => {
    const tools = [
      makeEntry({ toolId: "cursor", plan: "business", seats: 1, monthlySpend: 40 }),
      makeEntry({ toolId: "chatgpt", plan: "team", seats: 2, monthlySpend: 60 }),
    ];
    const result = runAudit(makeInput(tools));
    // Cursor: saves $20, ChatGPT: saves $20 = $40 total
    expect(result.totalMonthlySavings).toBe(40);
    expect(result.totalAnnualSavings).toBe(480);
  });

  it("sets shouldPromoteCredex when savings exceed $500/mo", () => {
    const tools = [
      makeEntry({ toolId: "github_copilot", plan: "enterprise", seats: 20, monthlySpend: 780 }),
      makeEntry({ toolId: "chatgpt", plan: "enterprise", seats: 10, monthlySpend: 600 }),
    ];
    const result = runAudit(makeInput(tools));
    expect(result.shouldPromoteCredex).toBe(true);
  });

  it("marks audit as already optimal when all tools are well-configured", () => {
    const tools = [
      makeEntry({ toolId: "cursor", plan: "pro", seats: 1, monthlySpend: 20 }),
    ];
    const result = runAudit(makeInput(tools));
    expect(result.isAlreadyOptimal).toBe(true);
    expect(result.totalMonthlySavings).toBe(0);
  });
});

// ─── Duplicate Tool Detection ─────────────────────────────────────────────────

describe("detectDuplicateTools", () => {
  it("warns when team has both Cursor and Copilot", () => {
    const tools = [
      makeEntry({ toolId: "cursor", plan: "pro", monthlySpend: 20 }),
      makeEntry({ toolId: "github_copilot", plan: "business", monthlySpend: 19 }),
    ];
    const warnings = detectDuplicateTools(tools);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain("simultaneously");
  });

  it("warns when team has both Claude and ChatGPT", () => {
    const tools = [
      makeEntry({ toolId: "claude", plan: "pro", monthlySpend: 20 }),
      makeEntry({ toolId: "chatgpt", plan: "plus", monthlySpend: 20 }),
    ];
    const warnings = detectDuplicateTools(tools);
    expect(warnings.length).toBeGreaterThan(0);
  });

  it("no warnings for a single tool", () => {
    const tools = [makeEntry({ toolId: "cursor", plan: "pro", monthlySpend: 20 })];
    const warnings = detectDuplicateTools(tools);
    expect(warnings.length).toBe(0);
  });
});