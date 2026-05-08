import type { ToolPricingData, AiToolId } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// PRICING DATA — every number sourced from official vendor pages
// See PRICING_DATA.md for full citations
// Last verified: 2025-05-08
// ─────────────────────────────────────────────────────────────────────────────

export const PRICING_DATA: Record<AiToolId, ToolPricingData> = {
  cursor: {
    toolId: "cursor",
    displayName: "Cursor",
    bestForUseCases: ["coding"],
    category: "coding",
    plans: {
      hobby: {
        name: "Hobby",
        pricePerSeat: 0,
        sourceUrl: "https://www.cursor.com/pricing",
        verifiedDate: "2025-05-08",
      },
      pro: {
        name: "Pro",
        pricePerSeat: 20,
        sourceUrl: "https://www.cursor.com/pricing",
        verifiedDate: "2025-05-08",
      },
      business: {
        name: "Business",
        pricePerSeat: 40,
        sourceUrl: "https://www.cursor.com/pricing",
        verifiedDate: "2025-05-08",
      },
    },
  },

  github_copilot: {
    toolId: "github_copilot",
    displayName: "GitHub Copilot",
    bestForUseCases: ["coding"],
    category: "coding",
    plans: {
      individual: {
        name: "Individual",
        pricePerSeat: 10,
        sourceUrl: "https://github.com/features/copilot#pricing",
        verifiedDate: "2025-05-08",
      },
      business: {
        name: "Business",
        pricePerSeat: 19,
        sourceUrl: "https://github.com/features/copilot#pricing",
        verifiedDate: "2025-05-08",
      },
      enterprise: {
        name: "Enterprise",
        pricePerSeat: 39,
        sourceUrl: "https://github.com/features/copilot#pricing",
        verifiedDate: "2025-05-08",
      },
    },
  },

  claude: {
    toolId: "claude",
    displayName: "Claude",
    bestForUseCases: ["writing", "research", "coding", "mixed"],
    category: "general",
    plans: {
      free: {
        name: "Free",
        pricePerSeat: 0,
        sourceUrl: "https://www.anthropic.com/pricing",
        verifiedDate: "2025-05-08",
      },
      pro: {
        name: "Pro",
        pricePerSeat: 20,
        sourceUrl: "https://www.anthropic.com/pricing",
        verifiedDate: "2025-05-08",
      },
      max_5x: {
        name: "Max (5x)",
        pricePerSeat: 100,
        sourceUrl: "https://www.anthropic.com/pricing",
        verifiedDate: "2025-05-08",
      },
      max_20x: {
        name: "Max (20x)",
        pricePerSeat: 200,
        sourceUrl: "https://www.anthropic.com/pricing",
        verifiedDate: "2025-05-08",
      },
      team: {
        name: "Team",
        pricePerSeat: 30,
        minSeats: 5,
        sourceUrl: "https://www.anthropic.com/pricing",
        verifiedDate: "2025-05-08",
      },
    },
  },

  chatgpt: {
    toolId: "chatgpt",
    displayName: "ChatGPT",
    bestForUseCases: ["writing", "research", "coding", "mixed"],
    category: "general",
    plans: {
      free: {
        name: "Free",
        pricePerSeat: 0,
        sourceUrl: "https://openai.com/chatgpt/pricing",
        verifiedDate: "2025-05-08",
      },
      plus: {
        name: "Plus",
        pricePerSeat: 20,
        sourceUrl: "https://openai.com/chatgpt/pricing",
        verifiedDate: "2025-05-08",
      },
      team: {
        name: "Team",
        pricePerSeat: 30,
        minSeats: 2,
        sourceUrl: "https://openai.com/chatgpt/pricing",
        verifiedDate: "2025-05-08",
      },
      enterprise: {
        name: "Enterprise",
        pricePerSeat: 60, // estimated — actual requires quote
        sourceUrl: "https://openai.com/chatgpt/pricing",
        verifiedDate: "2025-05-08",
      },
    },
  },

  anthropic_api: {
    toolId: "anthropic_api",
    displayName: "Anthropic API",
    bestForUseCases: ["coding", "data", "mixed"],
    category: "api",
    plans: {
      // Claude 3.5 Sonnet — most common production model
      sonnet_per_mtok: {
        name: "Claude 3.5 Sonnet (per MTok)",
        pricePerSeat: 0, // usage-based, not per-seat
        isApiPricing: true,
        sourceUrl: "https://www.anthropic.com/pricing#anthropic-api",
        verifiedDate: "2025-05-08",
      },
    },
  },

  openai_api: {
    toolId: "openai_api",
    displayName: "OpenAI API",
    bestForUseCases: ["coding", "data", "mixed"],
    category: "api",
    plans: {
      usage_based: {
        name: "Pay-as-you-go",
        pricePerSeat: 0,
        isApiPricing: true,
        sourceUrl: "https://openai.com/api/pricing",
        verifiedDate: "2025-05-08",
      },
    },
  },

  gemini: {
    toolId: "gemini",
    displayName: "Google Gemini",
    bestForUseCases: ["writing", "research", "data", "mixed"],
    category: "general",
    plans: {
      free: {
        name: "Free",
        pricePerSeat: 0,
        sourceUrl: "https://one.google.com/about/plans",
        verifiedDate: "2025-05-08",
      },
      advanced: {
        name: "Gemini Advanced (Google One AI Premium)",
        pricePerSeat: 20,
        sourceUrl: "https://one.google.com/about/plans",
        verifiedDate: "2025-05-08",
      },
      business: {
        name: "Gemini for Google Workspace Business",
        pricePerSeat: 20,
        sourceUrl: "https://workspace.google.com/intl/en/pricing",
        verifiedDate: "2025-05-08",
      },
    },
  },

  windsurf: {
    toolId: "windsurf",
    displayName: "Windsurf (Codeium)",
    bestForUseCases: ["coding"],
    category: "coding",
    plans: {
      free: {
        name: "Free",
        pricePerSeat: 0,
        sourceUrl: "https://windsurf.com/pricing",
        verifiedDate: "2025-05-08",
      },
      pro: {
        name: "Pro",
        pricePerSeat: 15,
        sourceUrl: "https://windsurf.com/pricing",
        verifiedDate: "2025-05-08",
      },
      teams: {
        name: "Teams",
        pricePerSeat: 35,
        minSeats: 2,
        sourceUrl: "https://windsurf.com/pricing",
        verifiedDate: "2025-05-08",
      },
    },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getPlan(toolId: AiToolId, planKey: string) {
  return PRICING_DATA[toolId]?.plans[planKey] ?? null;
}

export function getToolDisplayName(toolId: AiToolId): string {
  return PRICING_DATA[toolId]?.displayName ?? toolId;
}

export const TOOL_OPTIONS: { value: AiToolId; label: string }[] = Object.values(
  PRICING_DATA
).map((t) => ({ value: t.toolId, label: t.displayName }));

export function getPlansForTool(toolId: AiToolId) {
  const tool = PRICING_DATA[toolId];
  if (!tool) return [];
  return Object.entries(tool.plans).map(([key, plan]) => ({
    key,
    ...plan,
  }));
}