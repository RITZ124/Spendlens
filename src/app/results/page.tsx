"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  TrendingDown, TrendingUp, CheckCircle2, AlertTriangle,
  Share2, ArrowRight, BarChart3, Sparkles, Copy, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { runAudit, detectDuplicateTools } from "@/lib/auditEngine";
import { getToolDisplayName } from "@/lib/pricingData";
import type { AuditInput, AuditResult, ToolRecommendation } from "@/types";

const STORAGE_KEY = "spendlens_audit_input";

// ─── Animated number counter ─────────────────────────────────────────────────
function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const step = 16;
    const increment = value / (duration / step);
    ref.current = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplay(value);
        if (ref.current) clearInterval(ref.current);
      } else {
        setDisplay(Math.floor(start));
      }
    }, step);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [value]);

  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
}

// ─── Recommendation badge ─────────────────────────────────────────────────────
function RecTypeBadge({ type }: { type: ToolRecommendation["recommendationType"] }) {
  const map: Record<string, { label: string; color: string }> = {
    downgrade_plan:         { label: "Downgrade plan", color: "bg-amber-100 text-amber-800" },
    upgrade_plan:           { label: "Upgrade plan",   color: "bg-blue-100 text-blue-800" },
    switch_tool:            { label: "Switch tool",    color: "bg-purple-100 text-purple-800" },
    reduce_seats:           { label: "Reduce seats",   color: "bg-orange-100 text-orange-800" },
    switch_to_api:          { label: "Use API",        color: "bg-teal-100 text-teal-800" },
    switch_to_subscription: { label: "Use subscription", color: "bg-green-100 text-green-800" },
    already_optimal:        { label: "Optimal ✓",     color: "bg-gray-100 text-gray-600" },
    consider_credex:        { label: "Credex credits", color: "bg-emerald-100 text-emerald-800" },
  };
  const { label, color } = map[type] ?? { label: type, color: "bg-gray-100 text-gray-600" };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>{label}</span>;
}

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<AuditResult | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { router.push("/audit"); return; }
      const input: AuditInput = JSON.parse(raw);
      const auditResult = runAudit(input);
      setResult(auditResult);
      setWarnings(detectDuplicateTools(input.tools));
      fetchAiSummary(auditResult);
      saveAudit(auditResult);
    } catch {
      router.push("/audit");
    }
  }, []);

  async function fetchAiSummary(auditResult: AuditResult) {
    setSummaryLoading(true);
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalSpend: auditResult.totalMonthlySpend,
          totalSavings: auditResult.totalMonthlySavings,
          savingsPercentage: auditResult.savingsPercentage,
          toolCount: auditResult.input.tools.length,
          recommendations: auditResult.recommendations
            .filter(r => r.recommendationType !== "already_optimal")
            .map(r => r.reasoning)
            .slice(0, 3),
          isAlreadyOptimal: auditResult.isAlreadyOptimal,
        }),
      });
      const data = await res.json();
      setAiSummary(data.summary ?? "");
    } catch {
      setAiSummary(
        result?.isAlreadyOptimal
          ? `Your team is spending $${auditResult.totalMonthlySpend}/month on AI tools and your configuration looks well-optimized. No major changes needed right now.`
          : `Your audit found $${auditResult.totalMonthlySavings}/month in potential savings across ${auditResult.input.tools.length} AI tools. The biggest opportunity is adjusting your current plans to better match your team size and use cases.`
      );
    } finally {
      setSummaryLoading(false);
    }
  }

  async function saveAudit(auditResult: AuditResult) {
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(auditResult),
      });
      const data = await res.json();
      if (data.id) setShareId(data.id);
    } catch {}
  }

  async function handleCopyLink() {
    if (!shareId) return;
    const url = `${window.location.origin}/share/${shareId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Analyzing your spend...</p>
        </div>
      </div>
    );
  }

  const chartData = result.recommendations.map((r) => ({
    name: getToolDisplayName(r.toolId),
    current: r.currentMonthlySpend,
    optimized: r.estimatedMonthlyCost,
    savings: r.monthlySavings,
  }));

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            <span className="font-semibold text-gray-900">SpendLens</span>
          </div>
          <button
            onClick={() => router.push("/audit")}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            ← Edit inputs
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* ── Hero savings card ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl p-8 mb-8 text-white ${
            result.isAlreadyOptimal
              ? "bg-gray-900"
              : "bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800"
          }`}
        >
          {result.isAlreadyOptimal ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-medium text-sm">Spending optimized</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">You're spending well.</h1>
              <p className="text-gray-400 text-lg">
                Your ${result.totalMonthlySpend}/month in AI tools is well-matched to your team. No major changes needed.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-5 h-5 text-amber-400" />
                <span className="text-amber-400 font-medium text-sm">Savings found</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-1">
                <AnimatedNumber value={result.totalMonthlySavings} prefix="$" suffix="/mo" />
              </h1>
              <p className="text-gray-400 text-lg mb-6">
                <AnimatedNumber value={result.totalAnnualSavings} prefix="$" suffix="/year potential savings" />
                {" "}({result.savingsPercentage}% of current spend)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-2xl p-4">
                  <div className="text-2xl font-bold">${result.totalMonthlySpend}</div>
                  <div className="text-gray-400 text-sm mt-0.5">Current monthly</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-4">
                  <div className="text-2xl font-bold">${result.totalOptimizedMonthlySpend}</div>
                  <div className="text-gray-400 text-sm mt-0.5">After optimizing</div>
                </div>
                <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-4">
                  <div className="text-2xl font-bold text-emerald-400">${result.totalMonthlySavings}</div>
                  <div className="text-gray-400 text-sm mt-0.5">Monthly savings</div>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* ── Duplicate warnings ────────────────────────────────────────────── */}
        {warnings.length > 0 && (
          <div className="mb-6 space-y-3">
            {warnings.map((w, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4"
              >
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800">{w}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Per-tool breakdown ────────────────────────────────────────────── */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Per-tool breakdown</h2>
          <div className="space-y-3">
            {result.recommendations.map((rec, i) => (
              <motion.div
                key={rec.toolEntryId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="bg-white rounded-2xl border border-gray-200 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-semibold text-gray-900">
                        {getToolDisplayName(rec.toolId)}
                      </span>
                      <RecTypeBadge type={rec.recommendationType} />
                      {rec.confidence === "medium" && (
                        <span className="text-xs text-gray-400">estimated</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">{rec.reasoning}</p>
                    {rec.recommendedTool && rec.recommendedTool !== rec.toolId && (
                      <div className="mt-2 flex items-center gap-1.5 text-sm">
                        <span className="text-gray-400">Switch to:</span>
                        <span className="font-medium text-gray-700">{getToolDisplayName(rec.recommendedTool)}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-600">{rec.recommendedPlan}</span>
                      </div>
                    )}
                    {rec.recommendedTool === undefined && rec.recommendationType !== "already_optimal" && (
                      <div className="mt-2 flex items-center gap-1.5 text-sm">
                        <span className="text-gray-400">Recommended:</span>
                        <span className="font-medium text-gray-700">{rec.recommendedPlan}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm text-gray-400 line-through">${rec.currentMonthlySpend}/mo</div>
                    <div className="text-lg font-bold text-gray-900">${rec.estimatedMonthlyCost}/mo</div>
                    {rec.monthlySavings > 0 && (
                      <div className="text-sm font-medium text-green-600">
                        save ${rec.monthlySavings}/mo
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Chart ────────────────────────────────────────────────────────── */}
        {!result.isAlreadyOptimal && chartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 mb-8"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Current vs optimized spend</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barGap={4}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value: number, name: string) => [`$${value}/mo`, name === "current" ? "Current" : "Optimized"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}
                />
                <Bar dataKey="current" name="current" radius={[6, 6, 0, 0]} fill="#e5e7eb" />
                <Bar dataKey="optimized" name="optimized" radius={[6, 6, 0, 0]} fill="#111827" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* ── AI Summary ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 p-6 mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-gray-900">AI audit summary</span>
          </div>
          {summaryLoading ? (
            <div className="space-y-2">
              {[100, 80, 60].map((w, i) => (
                <div key={i} className={`h-4 bg-gray-200 rounded animate-pulse`} style={{ width: `${w}%` }} />
              ))}
            </div>
          ) : (
            <p className="text-gray-700 leading-relaxed text-sm">{aiSummary}</p>
          )}
        </motion.div>

        {/* ── Credex CTA ───────────────────────────────────────────────────── */}
        {result.shouldPromoteCredex && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-black text-white rounded-3xl p-8 mb-8"
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-400 font-medium text-sm">You could save even more</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">
              ${result.totalMonthlySavings}+/month is a lot to leave on the table.
            </h2>
            <p className="text-gray-400 mb-6">
              Credex sells discounted AI credits — Cursor, Claude, ChatGPT Enterprise, and more —
              from companies that overforecast. Real credits at 20–40% below retail.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://credex.rocks"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white text-black font-semibold rounded-xl px-6 py-3 hover:bg-gray-100 transition-colors"
              >
                Book a Credex consultation
                <ArrowRight className="w-4 h-4" />
              </a>
              <button
                onClick={() => document.getElementById("lead-capture")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center justify-center gap-2 border border-gray-700 text-white rounded-xl px-6 py-3 hover:border-gray-500 transition-colors text-sm"
              >
                Get report via email
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Share + Lead capture ─────────────────────────────────────────── */}
        <div id="lead-capture" className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {/* Share link */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-1">Share this audit</h3>
            <p className="text-sm text-gray-500 mb-4">Get a public link to share with your team or CFO. Your email stays private.</p>
            {shareId ? (
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 bg-gray-950 text-white rounded-xl py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                {copied ? <><Check className="w-4 h-4 text-green-400" /> Copied!</> : <><Share2 className="w-4 h-4" /> Copy share link</>}
              </button>
            ) : (
              <div className="w-full h-11 bg-gray-100 rounded-xl animate-pulse" />
            )}
          </div>

          {/* Email report */}
          <LeadCaptureCard
            auditId={shareId ?? ""}
            monthlySavings={result.totalMonthlySavings}
            shouldPromoteCredex={result.shouldPromoteCredex}
          />
        </div>

        {/* ── Audit again ──────────────────────────────────────────────────── */}
        <div className="text-center">
          <button
            onClick={() => router.push("/audit")}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Edit my inputs and re-run
          </button>
        </div>
      </div>
    </main>
  );
}

// ─── Lead Capture Sub-Component ───────────────────────────────────────────────

function LeadCaptureCard({
  auditId,
  monthlySavings,
  shouldPromoteCredex,
}: {
  auditId: string;
  monthlySavings: number;
  shouldPromoteCredex: boolean;
}) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState(""); // spam protection

  async function handleSubmit() {
    if (!email || honeypot) return;
    setLoading(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, companyName: company, auditId, honeypot }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true); // fail silently, don't block UX
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="font-medium text-gray-900 text-sm">Report sent!</p>
          <p className="text-xs text-gray-400 mt-1">Check your inbox.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-1">
        {shouldPromoteCredex ? "Get your full report + Credex intro" : "Email me this report"}
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        {shouldPromoteCredex
          ? "We'll send your audit and connect you with Credex for discounted credits."
          : "Get notified when new savings opportunities apply to your stack."}
      </p>
      {/* Honeypot — hidden from real users */}
      <input
        tabIndex={-1}
        aria-hidden="true"
        className="absolute opacity-0 h-0 w-0"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        autoComplete="off"
      />
      <div className="space-y-2 mb-3">
        <input
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
        <input
          type="text"
          placeholder="Company name (optional)"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
      </div>
      <Button
        onClick={handleSubmit}
        disabled={!email || loading}
        className="w-full bg-black text-white hover:bg-gray-800 rounded-xl py-2.5 text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send my report"}
      </Button>
    </div>
  );
}
