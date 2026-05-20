import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { supabaseAdmin } from "@/lib/supabase";
import { capturePricingSnapshot } from "@/lib/pricingSnapshot";
import type { AuditResult } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: AuditResult & { userEmail?: string } = await req.json();
    const shareId = nanoid(8);
    const pricingSnapshot = capturePricingSnapshot();

    // Save to original audits table (Round 1 — keeps share URLs working)
    const { error: v1Error } = await supabaseAdmin.from("audits").insert({
      id: shareId,
      total_monthly_spend: body.totalMonthlySpend,
      total_monthly_savings: body.totalMonthlySavings,
      total_annual_savings: body.totalAnnualSavings,
      savings_percentage: body.savingsPercentage,
      is_already_optimal: body.isAlreadyOptimal,
      should_promote_credex: body.shouldPromoteCredex,
      tool_count: body.input.tools.length,
      team_size: body.input.teamSize,
      company_stage: body.input.companyStage,
      public_data: {
        recommendations: body.recommendations.map((r) => ({
          toolId: r.toolId,
          currentPlan: r.currentPlan,
          recommendationType: r.recommendationType,
          recommendedPlan: r.recommendedPlan,
          recommendedTool: r.recommendedTool,
          currentMonthlySpend: r.currentMonthlySpend,
          estimatedMonthlyCost: r.estimatedMonthlyCost,
          monthlySavings: r.monthlySavings,
          annualSavings: r.annualSavings,
          reasoning: r.reasoning,
        })),
        totalMonthlySpend: body.totalMonthlySpend,
        totalMonthlySavings: body.totalMonthlySavings,
        totalAnnualSavings: body.totalAnnualSavings,
        savingsPercentage: body.savingsPercentage,
        isAlreadyOptimal: body.isAlreadyOptimal,
        teamSize: body.input.teamSize,
      },
      created_at: new Date().toISOString(),
    });

    if (v1Error) console.error("Supabase v1 insert error:", v1Error);

    // Save to audits_v2 if email provided
    if (body.userEmail) {
      const { error: v2Error } = await supabaseAdmin.from("audits_v2").insert({
        id: shareId,
        user_email: body.userEmail.toLowerCase().trim(),
        input_stack: body.input,
        audit_result: body,
        pricing_snapshot: pricingSnapshot,
        pricing_version: pricingSnapshot.version,
        total_monthly_spend: body.totalMonthlySpend,
        total_monthly_savings: body.totalMonthlySavings,
        is_stale: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (v2Error) console.error("Supabase v2 insert error:", v2Error);
    }

    return NextResponse.json({ id: shareId, saved: true });
  } catch (err) {
    console.error("Audit save error:", err);
    return NextResponse.json({ id: nanoid(8), saved: false });
  }
}

// Called from lead form to link email to existing audit
export async function PATCH(req: NextRequest) {
  try {
    const { auditId, email, inputStack, auditResult } = await req.json();
    if (!auditId || !email) {
      return NextResponse.json({ error: "Missing auditId or email" }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from("audits_v2")
      .select("id")
      .eq("id", auditId)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from("audits_v2")
        .update({ user_email: email.toLowerCase().trim(), updated_at: new Date().toISOString() })
        .eq("id", auditId);
    } else {
      const pricingSnapshot = capturePricingSnapshot();
      await supabaseAdmin.from("audits_v2").insert({
        id: auditId,
        user_email: email.toLowerCase().trim(),
        input_stack: inputStack ?? {},
        audit_result: auditResult ?? {},
        pricing_snapshot: pricingSnapshot,
        pricing_version: pricingSnapshot.version,
        total_monthly_spend: auditResult?.totalMonthlySpend ?? 0,
        total_monthly_savings: auditResult?.totalMonthlySavings ?? 0,
        is_stale: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Audit PATCH error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}