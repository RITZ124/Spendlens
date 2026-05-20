// ─────────────────────────────────────────────────────────────────────────────
// Pricing Snapshot
// Captures a point-in-time copy of pricing data for comparison later.
// Used to detect when stored audits have been invalidated by pricing changes.
// ─────────────────────────────────────────────────────────────────────────────

import { PRICING_DATA } from "./pricingData";
import type { AiToolId } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PricingSnapshot {
  version: string;       // hash of the snapshot for quick comparison
  capturedAt: string;    // ISO timestamp
  data: Record<string, SnapshotToolData>;
}

export interface SnapshotToolData {
  toolId: string;
  displayName: string;
  plans: Record<string, SnapshotPlanData>;
}

export interface SnapshotPlanData {
  name: string;
  pricePerSeat: number;
  minSeats?: number;
  maxSeats?: number;
}

export interface PricingDiff {
  hasChanges: boolean;
  changes: PricingChange[];
}

export interface PricingChange {
  toolId: string;
  toolName: string;
  planKey: string;
  planName: string;
  field: string;
  oldValue: string | number;
  newValue: string | number;
}

// ─── Capture snapshot ─────────────────────────────────────────────────────────

export function capturePricingSnapshot(): PricingSnapshot {
  const data: Record<string, SnapshotToolData> = {};

  for (const [toolId, tool] of Object.entries(PRICING_DATA)) {
    const plans: Record<string, SnapshotPlanData> = {};

    for (const [planKey, plan] of Object.entries(tool.plans)) {
      plans[planKey] = {
        name: plan.name,
        pricePerSeat: plan.pricePerSeat,
        ...(plan.minSeats !== undefined && { minSeats: plan.minSeats }),
        ...(plan.maxSeats !== undefined && { maxSeats: plan.maxSeats }),
      };
    }

    data[toolId] = {
      toolId,
      displayName: tool.displayName,
      plans,
    };
  }

  const version = generateVersion(data);

  return {
    version,
    capturedAt: new Date().toISOString(),
    data,
  };
}

// ─── Compare snapshots ────────────────────────────────────────────────────────

export function diffPricingSnapshots(
  oldSnapshot: PricingSnapshot,
  newSnapshot: PricingSnapshot
): PricingDiff {
  const changes: PricingChange[] = [];

  // Quick check — if versions match, nothing changed
  if (oldSnapshot.version === newSnapshot.version) {
    return { hasChanges: false, changes: [] };
  }

  for (const [toolId, newTool] of Object.entries(newSnapshot.data)) {
    const oldTool = oldSnapshot.data[toolId];

    // New tool added
    if (!oldTool) {
      for (const [planKey, plan] of Object.entries(newTool.plans)) {
        changes.push({
          toolId,
          toolName: newTool.displayName,
          planKey,
          planName: plan.name,
          field: "pricePerSeat",
          oldValue: "N/A (new tool)",
          newValue: plan.pricePerSeat,
        });
      }
      continue;
    }

    // Check each plan
    for (const [planKey, newPlan] of Object.entries(newTool.plans)) {
      const oldPlan = oldTool.plans[planKey];

      // New plan added
      if (!oldPlan) {
        changes.push({
          toolId,
          toolName: newTool.displayName,
          planKey,
          planName: newPlan.name,
          field: "pricePerSeat",
          oldValue: "N/A (new plan)",
          newValue: newPlan.pricePerSeat,
        });
        continue;
      }

      // Price changed
      if (oldPlan.pricePerSeat !== newPlan.pricePerSeat) {
        changes.push({
          toolId,
          toolName: newTool.displayName,
          planKey,
          planName: newPlan.name,
          field: "pricePerSeat",
          oldValue: oldPlan.pricePerSeat,
          newValue: newPlan.pricePerSeat,
        });
      }

      // Min seats changed
      if (oldPlan.minSeats !== newPlan.minSeats) {
        changes.push({
          toolId,
          toolName: newTool.displayName,
          planKey,
          planName: newPlan.name,
          field: "minSeats",
          oldValue: oldPlan.minSeats ?? 1,
          newValue: newPlan.minSeats ?? 1,
        });
      }
    }

    // Check for removed plans
    for (const [planKey, oldPlan] of Object.entries(oldTool.plans)) {
      if (!newTool.plans[planKey]) {
        changes.push({
          toolId,
          toolName: newTool.displayName,
          planKey,
          planName: oldPlan.name,
          field: "pricePerSeat",
          oldValue: oldPlan.pricePerSeat,
          newValue: "N/A (plan removed)",
        });
      }
    }
  }

  return {
    hasChanges: changes.length > 0,
    changes,
  };
}

// ─── Check if an audit is affected by specific changes ────────────────────────

export function isAuditAffectedByChanges(
  auditInputStack: { tools: Array<{ toolId: string; plan: string }> },
  changes: PricingChange[]
): boolean {
  const changedToolPlans = new Set(
    changes.map((c) => `${c.toolId}:${c.planKey}`)
  );

  return auditInputStack.tools.some((tool) => {
    const key = `${tool.toolId}:${tool.plan}`;
    return changedToolPlans.has(key);
  });
}

// ─── Version hash ─────────────────────────────────────────────────────────────

function generateVersion(data: Record<string, SnapshotToolData>): string {
  // Simple deterministic hash — serialize sorted keys and prices
  const str = JSON.stringify(data, Object.keys(data).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit int
  }
  return Math.abs(hash).toString(36);
}

// ─── Current snapshot (singleton for request lifetime) ───────────────────────

let _currentSnapshot: PricingSnapshot | null = null;

export function getCurrentSnapshot(): PricingSnapshot {
  if (!_currentSnapshot) {
    _currentSnapshot = capturePricingSnapshot();
  }
  return _currentSnapshot;
}