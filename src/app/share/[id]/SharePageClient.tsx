"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart3, ArrowRight, TrendingDown, CheckCircle2 } from "lucide-react";
import { getToolDisplayName } from "@/lib/pricingData";
import type { AiToolId } from "@/types";

interface PublicRec {
  toolId: AiToolId;
  currentPlan: string;
  recommendationType: string;
  recommendedPlan: string;
  recommendedTool?: AiToolId;
  currentMonthlySpend: number;
  estimatedMonthlyCost: number;
  monthlySavings: number;
  reasoning: string;
}

interface PublicData {
  recommendations: PublicRec[];
  totalMonthlySpend: number;
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  savingsPercentage: number;
  isAlreadyOptimal: boolean;
  teamSize: string;
}

export default function SharePageClient({
  auditData,
  shareId,
}: {
  auditData: Record<string, unknown>;
  shareId: string;
}) {
  const pub = auditData.public_data as PublicData;
  const isOptimal = pub.isAlreadyOptimal;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            <span className="font-semibold text-gray-900">SpendLens</span>
          </div>
          <Link href="/audit">
            <span className="text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
              Audit my spend →
            </span>
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Shared audit badge */}
        <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-500 mb-6">
          Shared audit report
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-950 text-white rounded-3xl p-8 mb-8"
        >
          {isOptimal ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span className="text-green-400 text-sm font-medium">Already optimized</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">Spending well on AI tools</h1>
              <p className="text-gray-400">
                This team spends <strong className="text-white">${pub.totalMonthlySpend}/month</strong> across{" "}
                {pub.recommendations.length} AI tools — their setup is already well-optimized.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-5 h-5 text-amber-400" />
                <span className="text-amber-400 text-sm font-medium">Savings found</span>
              </div>
              <h1 className="text-4xl font-bold mb-2">
                ${pub.totalMonthlySavings}/month savings found
              </h1>
              <p className="text-gray-400 text-lg">
                ${pub.totalAnnualSavings.toLocaleString()}/year · {pub.savingsPercentage}% of current spend
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-2xl p-4">
                  <div className="text-2xl font-bold">${pub.totalMonthlySpend}</div>
                  <div className="text-gray-400 text-sm">Current monthly</div>
                </div>
                <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-4">
                  <div className="text-2xl font-bold text-emerald-400">${pub.totalMonthlySavings}</div>
                  <div className="text-gray-400 text-sm">Monthly savings</div>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Per-tool recommendations */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h2>
        <div className="space-y-3 mb-10">
          {pub.recommendations.map((rec, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl border border-gray-200 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">
                    {getToolDisplayName(rec.toolId)}
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{rec.reasoning}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm text-gray-400 line-through">${rec.currentMonthlySpend}/mo</div>
                  <div className="text-base font-bold text-gray-900">${rec.estimatedMonthlyCost}/mo</div>
                  {rec.monthlySavings > 0 && (
                    <div className="text-sm text-green-600 font-medium">−${rec.monthlySavings}/mo</div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-black text-white rounded-3xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Audit your own AI spend</h2>
          <p className="text-gray-400 mb-6">Free. No login. Takes 2 minutes.</p>
          <Link href="/audit">
            <span className="inline-flex items-center gap-2 bg-white text-black font-semibold rounded-xl px-6 py-3 hover:bg-gray-100 transition-colors">
              Start my free audit
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}
