import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { supabaseAdmin } from "@/lib/supabase";
import type { AuditResult } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: AuditResult = await req.json();
    const shareId = nanoid(8);

    const { error } = await supabaseAdmin.from("audits").insert({
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
      // Store sanitized public data (no email/company)
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

    if (error) {
      console.error("Supabase insert error:", error);
      // Return a temp ID even if save fails — don't break UX
      return NextResponse.json({ id: shareId, saved: false });
    }

    return NextResponse.json({ id: shareId, saved: true });
  } catch (err) {
    console.error("Audit save error:", err);
    return NextResponse.json({ id: nanoid(8), saved: false });
  }
}