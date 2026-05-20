"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight, BarChart3, TrendingDown, TrendingUp,
  CheckCircle2, AlertTriangle, RefreshCw
} from "lucide-react";
import { runAudit } from "@/lib/auditEngine";
import { getToolDisplayName } from "@/lib/pricingData";
import type { AuditResult, ToolRecommendation } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoredAudit {
  id: string;
  input_stack: AuditResult["input"];
  audit_result: AuditResult;
  pricing_snapshot: Record<string, unknown>;
  total_monthly_savings: number;
  total_monthly_spend: number;
  created_at: string;
}

interface RecDiff {
  toolId: string;
  toolName: string;
  old: ToolRecommendation;
  new: ToolRecommendation;
  changed: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DiffPage() {
  const params = useParams();
  const router = useRouter();
  const auditId = params.id as string;

  const [storedAudit, setStoredAudit] = useState<StoredAudit | null>(null);
  const [newResult, setNewResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUnchanged, setShowUnchanged] = useState(false);

  useEffect(() => {
    async function loadAudit() {
      try {
        const res = await fetch(`/api/audit-data/${auditId}`);
        if (!res.ok) {
          setError("Audit not found. It may not have an email linked yet.");
          return;
        }
        const data: StoredAudit = await res.json();
        setStoredAudit(data);

        // Re-run audit with current pricing
        const freshResult = runAudit(data.input_stack);
        setNewResult(freshResult);
      } catch {
        setError("Failed to load audit data.");
      } finally {
        setLoading(false);
      }
    }
    loadAudit();
  }, [auditId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading your audit comparison...</p>
        </div>
      </div>
    );
  }

  if (error || !storedAudit || !newResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Audit not found</h1>
          <p className="text-gray-500 mb-6">{error ?? "This audit doesn't exist or has no linked email."}</p>
          <button
            onClick={() => router.push("/audit")}
            className="bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            Run a new audit
          </button>
        </div>
      </div>
    );
  }

  const oldResult = storedAudit.audit_result;
  const savingsDelta = newResult.totalMonthlySavings - oldResult.totalMonthlySavings;
  const auditDate = new Date(storedAudit.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric"
  });

  // Build diff per tool
  const diffs: RecDiff[] = oldResult.recommendations.map((oldRec) => {
    const newRec = newResult.recommendations.find(
      (r) => r.toolId === oldRec.toolId
    );
    if (!newRec) return null;
    const changed =
      oldRec.recommendationType !== newRec.recommendationType ||
      oldRec.recommendedPlan !== newRec.recommendedPlan ||
      oldRec.estimatedMonthlyCost !== newRec.estimatedMonthlyCost;

    return {
      toolId: oldRec.toolId,
      toolName: getToolDisplayName(oldRec.toolId),
      old: oldRec,
      new: newRec,
      changed,
    };
  }).filter(Boolean) as RecDiff[];

  const changedCount = diffs.filter((d) => d.changed).length;
  const visibleDiffs = showUnchanged ? diffs : diffs.filter((d) => d.changed);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            <span className="font-semibold text-gray-900">SpendLens</span>
            <span className="text-gray-300 mx-2">·</span>
            <span className="text-sm text-gray-500">Audit comparison</span>
          </div>
          <button
            onClick={() => router.push("/audit")}
            className="text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            New audit
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-950 text-white rounded-3xl p-8 mb-8"
        >
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm font-medium">Pricing changed since your audit</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">What changed in your audit</h1>
          <p className="text-gray-400 mb-6">
            Original audit from {auditDate} · {changedCount} recommendation{changedCount !== 1 ? "s" : ""} affected
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-2xl p-4">
              <div className="text-lg font-bold">${oldResult.totalMonthlySavings}/mo</div>
              <div className="text-gray-400 text-xs mt-0.5">Previous savings</div>
            </div>
            <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-4">
              <div className="text-lg font-bold text-emerald-400">${newResult.totalMonthlySavings}/mo</div>
              <div className="text-gray-400 text-xs mt-0.5">Updated savings</div>
            </div>
            <div className={`rounded-2xl p-4 ${savingsDelta > 0 ? "bg-emerald-500/20 border border-emerald-500/30" : savingsDelta < 0 ? "bg-red-500/20 border border-red-500/30" : "bg-white/10"}`}>
              <div className={`text-lg font-bold flex items-center gap-1 ${savingsDelta > 0 ? "text-emerald-400" : savingsDelta < 0 ? "text-red-400" : "text-white"}`}>
                {savingsDelta > 0 ? <TrendingUp className="w-4 h-4" /> : savingsDelta < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                {savingsDelta > 0 ? "+" : ""}{savingsDelta}/mo
              </div>
              <div className="text-gray-400 text-xs mt-0.5">Savings change</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-4">
              <div className="text-lg font-bold">{changedCount}</div>
              <div className="text-gray-400 text-xs mt-0.5">Tools affected</div>
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {showUnchanged ? "All tools" : `${changedCount} changed tool${changedCount !== 1 ? "s" : ""}`}
          </h2>
          {diffs.some((d) => !d.changed) && (
            <button
              onClick={() => setShowUnchanged(!showUnchanged)}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              {showUnchanged ? "Hide unchanged" : `Show all ${diffs.length} tools`}
            </button>
          )}
        </div>

        {/* Diff cards */}
        <div className="space-y-4 mb-8">
          {visibleDiffs.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">No changes to your recommendations</h3>
              <p className="text-gray-500 text-sm">Pricing changed but your specific tools and plans weren&apos;t affected.</p>
            </div>
          )}

          {visibleDiffs.map((diff, i) => (
            <motion.div
              key={diff.toolId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`bg-white rounded-2xl border p-5 ${diff.changed ? "border-amber-200" : "border-gray-100 opacity-60"}`}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="font-semibold text-gray-900">{diff.toolName}</span>
                {diff.changed ? (
                  <span className="text-xs font-medium bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">Changed</span>
                ) : (
                  <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full">Unchanged</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Old recommendation */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Before</div>
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    {diff.old.recommendationType.replace(/_/g, " ")}
                    {diff.old.recommendedPlan && ` → ${diff.old.recommendedPlan}`}
                  </div>
                  <div className="text-xl font-bold text-gray-900">${diff.old.estimatedMonthlyCost}/mo</div>
                  {diff.old.monthlySavings > 0 && (
                    <div className="text-sm text-gray-500 mt-1">saves ${diff.old.monthlySavings}/mo</div>
                  )}
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">{diff.old.reasoning}</p>
                </div>

                {/* New recommendation */}
                <div className={`rounded-xl p-4 ${diff.changed ? "bg-emerald-50 border border-emerald-200" : "bg-gray-50"}`}>
                  <div className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-2">
                    {diff.changed ? "Now" : "Same"}
                  </div>
                  <div className={`text-sm font-medium mb-1 ${diff.changed ? "text-emerald-700" : "text-gray-700"}`}>
                    {diff.new.recommendationType.replace(/_/g, " ")}
                    {diff.new.recommendedPlan && ` → ${diff.new.recommendedPlan}`}
                  </div>
                  <div className={`text-xl font-bold ${diff.changed ? "text-emerald-700" : "text-gray-900"}`}>
                    ${diff.new.estimatedMonthlyCost}/mo
                  </div>
                  {diff.new.monthlySavings > 0 && (
                    <div className={`text-sm mt-1 ${diff.changed ? "text-emerald-600" : "text-gray-500"}`}>
                      saves ${diff.new.monthlySavings}/mo
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">{diff.new.reasoning}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-black text-white rounded-3xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Run a fresh audit with your current stack</h2>
          <p className="text-gray-400 mb-6">Your tools or plans may have changed too — start fresh for the most accurate results.</p>
          <button
            onClick={() => router.push("/audit")}
            className="inline-flex items-center gap-2 bg-white text-black font-semibold rounded-xl px-6 py-3 hover:bg-gray-100 transition-colors"
          >
            Start new audit
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </main>
  );
}