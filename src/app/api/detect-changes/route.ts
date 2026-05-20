import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  capturePricingSnapshot,
  diffPricingSnapshots,
  isAuditAffectedByChanges,
} from "@/lib/pricingSnapshot";
import { runAudit } from "@/lib/auditEngine";
import { Resend } from "resend";
import type { AuditInput, AuditResult } from "@/types";
import type { PricingChange, PricingSnapshot } from "@/lib/pricingSnapshot";

const resend = new Resend(process.env.RESEND_API_KEY);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/detect-changes
//
// Manual trigger endpoint. Credex (or a scheduled job) calls this to:
// 1. Compare current pricing vs each stored audit's pricing snapshot
// 2. Flag audits whose recommendations would change
// 3. Send one consolidated email per affected user
// 4. Log pricing changes to the pricing_changes table
//
// Body (optional): { dryRun: true } — detect and report, don't send emails
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun === true;

    // Step 1: Get current pricing snapshot
    const currentSnapshot = capturePricingSnapshot();

    // Step 2: Fetch all stored audits that haven't been notified yet
    const { data: audits, error: fetchError } = await supabaseAdmin
      .from("audits_v2")
      .select("id, user_email, input_stack, audit_result, pricing_snapshot, pricing_version, is_stale")
      .eq("is_stale", false) // only check non-stale audits (already notified ones skip)
      .not("user_email", "is", null);

    if (fetchError) {
      console.error("Error fetching audits:", fetchError);
      return NextResponse.json({ error: "Failed to fetch audits" }, { status: 500 });
    }

    if (!audits || audits.length === 0) {
      return NextResponse.json({
        message: "No audits to check",
        auditsChecked: 0,
        affectedAudits: 0,
        emailsSent: 0,
      });
    }

    // Step 3: For each audit, diff its stored snapshot vs current
    const affectedByUser: Map<string, {
      auditIds: string[];
      changes: PricingChange[];
      oldResult: AuditResult;
      newResult: AuditResult;
      inputStack: AuditInput;
    }> = new Map();

    const allDetectedChanges: PricingChange[] = [];
    const staleAuditIds: string[] = [];

    for (const audit of audits) {
      const storedSnapshot = audit.pricing_snapshot as PricingSnapshot;
      const diff = diffPricingSnapshots(storedSnapshot, currentSnapshot);

      if (!diff.hasChanges) continue;

      // Check if this specific audit's tools are affected
      const inputStack = audit.input_stack as AuditInput;
      const affected = isAuditAffectedByChanges(inputStack, diff.changes);

      if (!affected) continue;

      // Re-run audit with new pricing to get new recommendations
      const oldResult = audit.audit_result as AuditResult;
      const newResult = runAudit(inputStack);

      // Only flag if recommendations actually changed
      const recommendationsChanged = didRecommendationsChange(oldResult, newResult);
      if (!recommendationsChanged) continue;

      staleAuditIds.push(audit.id);
      allDetectedChanges.push(...diff.changes);

      // Group by user email — one email per user
      const email = audit.user_email as string;
      const existing = affectedByUser.get(email);

      if (existing) {
        existing.auditIds.push(audit.id);
        existing.changes.push(...diff.changes);
      } else {
        affectedByUser.set(email, {
          auditIds: [audit.id],
          changes: diff.changes,
          oldResult,
          newResult,
          inputStack,
        });
      }
    }

    // Step 4: Log detected changes to pricing_changes table
    if (allDetectedChanges.length > 0) {
      const uniqueChanges = dedupeChanges(allDetectedChanges);
      await supabaseAdmin.from("pricing_changes").insert(
        uniqueChanges.map((c) => ({
          tool_id: c.toolId,
          plan_key: c.planKey,
          field: c.field,
          old_value: String(c.oldValue),
          new_value: String(c.newValue),
          detected_at: new Date().toISOString(),
        }))
      );
    }

    // Step 5: Mark affected audits as stale
    if (staleAuditIds.length > 0 && !dryRun) {
      await supabaseAdmin
        .from("audits_v2")
        .update({
          is_stale: true,
          stale_reason: "Pricing changed for one or more tools in your audit",
          updated_at: new Date().toISOString(),
        })
        .in("id", staleAuditIds);
    }

    // Step 6: Send one email per affected user
    let emailsSent = 0;
    const emailResults: { email: string; auditIds: string[]; sent: boolean }[] = [];

    for (const [email, userData] of affectedByUser.entries()) {
      if (dryRun) {
        emailResults.push({ email, auditIds: userData.auditIds, sent: false });
        continue;
      }

      try {
        // Check if we already sent today (dedup)
        const today = new Date().toISOString().split("T")[0];
        const { data: existingEmail } = await supabaseAdmin
          .from("reaudit_emails")
          .select("id")
          .eq("user_email", email)
          .gte("sent_at", `${today}T00:00:00Z`)
          .maybeSingle();

        if (existingEmail) {
          emailResults.push({ email, auditIds: userData.auditIds, sent: false });
          continue; // Already emailed today
        }

        // Send the email
        const rerunUrl = `${process.env.NEXT_PUBLIC_APP_URL}/diff/${userData.auditIds[0]}`;
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? "audit@spendlens.app",
          to: email,
          subject: "Your SpendLens audit may be outdated — pricing changed",
          html: buildReauditEmail({
            email,
            changes: userData.changes,
            oldResult: userData.oldResult,
            newResult: userData.newResult,
            rerunUrl,
          }),
        });

        // Log the email send
        await supabaseAdmin.from("reaudit_emails").insert({
          user_email: email,
          audit_ids: userData.auditIds,
          changes: userData.changes,
          sent_at: new Date().toISOString(),
        });

        emailsSent++;
        emailResults.push({ email, auditIds: userData.auditIds, sent: true });
      } catch (emailErr) {
        console.error(`Failed to send email to ${email}:`, emailErr);
        emailResults.push({ email, auditIds: userData.auditIds, sent: false });
      }
    }

    return NextResponse.json({
      message: dryRun ? "Dry run complete" : "Detection complete",
      auditsChecked: audits.length,
      affectedAudits: staleAuditIds.length,
      uniqueUsersAffected: affectedByUser.size,
      emailsSent,
      dryRun,
      results: emailResults,
      changesDetected: dedupeChanges(allDetectedChanges),
    });
  } catch (err) {
    console.error("detect-changes error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// ─── GET — quick status check ─────────────────────────────────────────────────

export async function GET() {
  const { data: staleCount } = await supabaseAdmin
    .from("audits_v2")
    .select("id", { count: "exact" })
    .eq("is_stale", true);

  const { data: totalCount } = await supabaseAdmin
    .from("audits_v2")
    .select("id", { count: "exact" });

  const { data: recentChanges } = await supabaseAdmin
    .from("pricing_changes")
    .select("*")
    .order("detected_at", { ascending: false })
    .limit(10);

  const currentSnapshot = capturePricingSnapshot();

  return NextResponse.json({
    currentPricingVersion: currentSnapshot.version,
    totalStoredAudits: totalCount?.length ?? 0,
    staleAudits: staleCount?.length ?? 0,
    recentPricingChanges: recentChanges ?? [],
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function didRecommendationsChange(old: AuditResult, next: AuditResult): boolean {
  if (old.recommendations.length !== next.recommendations.length) return true;

  for (let i = 0; i < old.recommendations.length; i++) {
    const o = old.recommendations[i];
    const n = next.recommendations[i];
    if (
      o.recommendationType !== n.recommendationType ||
      o.recommendedPlan !== n.recommendedPlan ||
      o.estimatedMonthlyCost !== n.estimatedMonthlyCost
    ) {
      return true;
    }
  }
  return false;
}

function dedupeChanges(changes: PricingChange[]): PricingChange[] {
  const seen = new Set<string>();
  return changes.filter((c) => {
    const key = `${c.toolId}:${c.planKey}:${c.field}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildReauditEmail({
  email,
  changes,
  oldResult,
  newResult,
  rerunUrl,
}: {
  email: string;
  changes: PricingChange[];
  oldResult: AuditResult;
  newResult: AuditResult;
  rerunUrl: string;
}): string {
  const uniqueChanges = dedupeChanges(changes);
  const savingsDelta = newResult.totalMonthlySavings - oldResult.totalMonthlySavings;
  const savingsDirection = savingsDelta > 0 ? "more" : "less";

  const changesList = uniqueChanges
    .map(
      (c) =>
        `<li style="margin-bottom:8px"><strong>${c.toolName} — ${c.planName}:</strong> 
         $${c.oldValue}/seat → $${c.newValue}/seat</li>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:40px 20px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="background:#111827;padding:32px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700">SpendLens</h1>
      <p style="color:#fbbf24;margin:8px 0 0;font-size:14px">⚠️ Pricing changed — your audit may be outdated</p>
    </div>
    <div style="padding:32px">
      <p style="color:#374151;margin:0 0 16px;line-height:1.6">
        AI tool pricing has changed since your last audit. Here's what moved:
      </p>
      
      <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;padding:16px;margin-bottom:24px">
        <h3 style="color:#92400e;margin:0 0 12px;font-size:14px;font-weight:600">PRICING CHANGES</h3>
        <ul style="margin:0;padding-left:20px;color:#78350f;font-size:14px">
          ${changesList}
        </ul>
      </div>

      <div style="display:flex;gap:12px;margin-bottom:24px">
        <div style="flex:1;background:#f9fafb;border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Previous savings</div>
          <div style="font-size:24px;font-weight:700;color:#111827">$${oldResult.totalMonthlySavings}/mo</div>
        </div>
        <div style="flex:1;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:11px;color:#065f46;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Updated savings</div>
          <div style="font-size:24px;font-weight:700;color:#059669">$${newResult.totalMonthlySavings}/mo</div>
        </div>
      </div>

      ${Math.abs(savingsDelta) > 0 ? `
      <p style="color:#374151;margin:0 0 24px;line-height:1.6;font-size:14px">
        Based on the new pricing, you could save <strong>$${Math.abs(savingsDelta)}/month ${savingsDirection}</strong> 
        than your previous audit showed. Click below to see the full comparison.
      </p>
      ` : ""}

      <a href="${rerunUrl}"
         style="display:block;background:#111827;color:#fff;text-decoration:none;border-radius:12px;padding:16px 24px;text-align:center;font-weight:600;font-size:15px;margin-bottom:16px">
        See what changed in my audit →
      </a>
      
      <p style="color:#6b7280;font-size:12px;margin:0;text-align:center">
        Or <a href="${process.env.NEXT_PUBLIC_APP_URL}/audit" style="color:#6b7280">run a completely new audit</a> with your current stack.
      </p>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center">
        SpendLens by <a href="https://credex.rocks" style="color:#6b7280">Credex</a> · 
        We sent this because pricing changed for tools in your audit.
      </p>
    </div>
  </div>
</body>
</html>`.trim();
}