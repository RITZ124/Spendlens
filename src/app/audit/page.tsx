"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, BarChart3, ArrowRight, Info } from "lucide-react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AuditInput, ToolEntry, AiToolId, UseCase, TeamSize } from "@/types";
import { TOOL_OPTIONS, getPlansForTool } from "@/lib/pricingData";

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "spendlens_audit_input";

const USE_CASE_OPTIONS: { value: UseCase; label: string }[] = [
  { value: "coding", label: "Coding / development" },
  { value: "writing", label: "Writing / content" },
  { value: "data", label: "Data / analytics" },
  { value: "research", label: "Research" },
  { value: "mixed", label: "Mixed use" },
];

const TEAM_SIZE_OPTIONS: { value: TeamSize; label: string }[] = [
  { value: "solo", label: "Solo (just me)" },
  { value: "2-5", label: "2–5 people" },
  { value: "6-15", label: "6–15 people" },
  { value: "16-50", label: "16–50 people" },
  { value: "50+", label: "50+ people" },
];

const COMPANY_STAGES = [
  { value: "idea", label: "Idea stage" },
  { value: "early", label: "Early / pre-revenue" },
  { value: "growth", label: "Growth / revenue" },
  { value: "scale", label: "Scaling" },
] as const;

// ─── Default empty tool entry ─────────────────────────────────────────────────

function emptyTool(): ToolEntry {
  return {
    id: nanoid(8),
    toolId: "cursor",
    plan: "pro",
    monthlySpend: 0,
    seats: 1,
    useCase: "coding",
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AuditPage() {
  const router = useRouter();

  const [tools, setTools] = useState<ToolEntry[]>([emptyTool()]);
  const [teamSize, setTeamSize] = useState<TeamSize>("2-5");
  const [companyStage, setCompanyStage] = useState<AuditInput["companyStage"]>("early");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Load from localStorage on mount ───────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: AuditInput = JSON.parse(saved);
        if (parsed.tools?.length) {
          setTools(parsed.tools);
          setTeamSize(parsed.teamSize ?? "2-5");
          setCompanyStage(parsed.companyStage ?? "early");
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, []);

  // ─── Save to localStorage on every change ──────────────────────────────────
  const save = useCallback(
    (t: ToolEntry[], ts: TeamSize, cs: AuditInput["companyStage"]) => {
      try {
        const input: AuditInput = { tools: t, teamSize: ts, companyStage: cs };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
      } catch {}
    },
    []
  );

  useEffect(() => {
    save(tools, teamSize, companyStage);
  }, [tools, teamSize, companyStage, save]);

  // ─── Tool entry handlers ────────────────────────────────────────────────────

  function addTool() {
    setTools((prev) => [...prev, emptyTool()]);
  }

  function removeTool(id: string) {
    setTools((prev) => prev.filter((t) => t.id !== id));
  }

  function updateTool(id: string, field: keyof ToolEntry, value: unknown) {
    setTools((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, [field]: value };
        // When tool changes, reset plan to first available
        if (field === "toolId") {
          const plans = getPlansForTool(value as AiToolId);
          updated.plan = plans[0]?.key ?? "pro";
        }
        return updated;
      })
    );
    // Clear error for this field
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`${id}-${field}`];
      return next;
    });
  }

  // ─── Validation ─────────────────────────────────────────────────────────────

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    tools.forEach((t) => {
      if (t.monthlySpend < 0) {
        newErrors[`${t.id}-monthlySpend`] = "Must be 0 or more";
      }
      if (t.seats < 1) {
        newErrors[`${t.id}-seats`] = "At least 1 seat";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ─── Submit ─────────────────────────────────────────────────────────────────

  function handleSubmit() {
    if (!validate()) return;
    setIsSubmitting(true);
    const input: AuditInput = { tools, teamSize, companyStage };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
    router.push("/results");
  }

  const totalMonthlySpend = tools.reduce((s, t) => s + (t.monthlySpend || 0), 0);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            <span className="font-semibold text-gray-900">SpendLens</span>
          </div>
          <div className="text-sm text-gray-500">
            Total entered:{" "}
            <span className="font-semibold text-gray-900">
              ${totalMonthlySpend.toFixed(0)}/mo
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Tell us about your AI subscriptions
          </h1>
          <p className="text-gray-500">
            Add every AI tool your team pays for. We&apos;ll analyze each one.
            Your data stays in your browser until you run the audit.
          </p>
        </div>

        {/* Team context */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">About your team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Team size
              </Label>
              <Select
                value={teamSize}
                onValueChange={(v) => setTeamSize(v as TeamSize)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_SIZE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Company stage
              </Label>
              <Select
                value={companyStage}
                onValueChange={(v) =>
                  setCompanyStage(v as AuditInput["companyStage"])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_STAGES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tool entries */}
        <AnimatePresence initial={false}>
          {tools.map((tool, index) => (
            <ToolRow
              key={tool.id}
              tool={tool}
              index={index}
              errors={errors}
              canRemove={tools.length > 1}
              onUpdate={updateTool}
              onRemove={removeTool}
            />
          ))}
        </AnimatePresence>

        {/* Add tool button */}
        <button
          onClick={addTool}
          className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors flex items-center justify-center gap-2 mb-8"
        >
          <Plus className="w-4 h-4" />
          Add another AI tool
        </button>

        {/* Info notice */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            Not sure about your exact spend? Enter your best estimate — the audit will still surface meaningful savings.
            Your form data saves automatically as you type.
          </p>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || tools.length === 0}
          size="lg"
          className="w-full bg-black text-white hover:bg-gray-800 h-14 text-base font-medium rounded-xl gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            "Analyzing your spend..."
          ) : (
            <>
              Run my free audit
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
        <p className="text-center text-sm text-gray-400 mt-3">
          Free · No account needed · Results in seconds
        </p>
      </div>
    </main>
  );
}

// ─── Tool Row Component ───────────────────────────────────────────────────────

function ToolRow({
  tool,
  index,
  errors,
  canRemove,
  onUpdate,
  onRemove,
}: {
  tool: ToolEntry;
  index: number;
  errors: Record<string, string>;
  canRemove: boolean;
  onUpdate: (id: string, field: keyof ToolEntry, value: unknown) => void;
  onRemove: (id: string) => void;
}) {
  const plans = getPlansForTool(tool.toolId);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl border border-gray-200 p-6 mb-4"
    >
      {/* Row header */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Tool {index + 1}
        </span>
        {canRemove && (
          <button
            onClick={() => onRemove(tool.id)}
            className="text-gray-300 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tool selector */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
            AI Tool
          </Label>
          <Select
            value={tool.toolId}
            onValueChange={(v) => onUpdate(tool.id, "toolId", v as AiToolId)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TOOL_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Plan selector */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
            Plan
          </Label>
          <Select
            value={tool.plan}
            onValueChange={(v) => onUpdate(tool.id, "plan", v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {plans.map((p) => (
                <SelectItem key={p.key} value={p.key}>
                  {p.name}
                  {p.pricePerSeat > 0 && ` — $${p.pricePerSeat}/seat`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Monthly spend */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
            Monthly spend (USD)
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <Input
              type="number"
              min={0}
              className={`pl-7 ${errors[`${tool.id}-monthlySpend`] ? "border-red-300" : ""}`}
              value={tool.monthlySpend || ""}
              placeholder="0"
              onChange={(e) =>
                onUpdate(tool.id, "monthlySpend", parseFloat(e.target.value) || 0)
              }
            />
          </div>
          {errors[`${tool.id}-monthlySpend`] && (
            <p className="text-xs text-red-500 mt-1">{errors[`${tool.id}-monthlySpend`]}</p>
          )}
        </div>

        {/* Seats */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
            Number of seats / users
          </Label>
          <Input
            type="number"
            min={1}
            value={tool.seats || ""}
            className={errors[`${tool.id}-seats`] ? "border-red-300" : ""}
            placeholder="1"
            onChange={(e) =>
              onUpdate(tool.id, "seats", parseInt(e.target.value) || 1)
            }
          />
          {errors[`${tool.id}-seats`] && (
            <p className="text-xs text-red-500 mt-1">{errors[`${tool.id}-seats`]}</p>
          )}
        </div>

        {/* Use case — full width */}
        <div className="sm:col-span-2">
          <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
            Primary use case
          </Label>
          <Select
            value={tool.useCase}
            onValueChange={(v) => onUpdate(tool.id, "useCase", v as UseCase)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {USE_CASE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Per-seat cost hint */}
      {tool.monthlySpend > 0 && tool.seats > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
          <span className="text-xs text-gray-400">
            That&apos;s{" "}
            <span className="font-semibold text-gray-600">
              ${(tool.monthlySpend / tool.seats).toFixed(2)}/seat/month
            </span>
          </span>
        </div>
      )}
    </motion.div>
  );
}
