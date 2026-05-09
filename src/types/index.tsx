// ─── Tool & Plan Types ────────────────────────────────────────────────────────

export type AiToolId =
  | "cursor"
  | "github_copilot"
  | "claude"
  | "chatgpt"
  | "anthropic_api"
  | "openai_api"
  | "gemini"
  | "windsurf";

export type UseCase = "coding" | "writing" | "data" | "research" | "mixed";

export type TeamSize = "solo" | "2-5" | "6-15" | "16-50" | "50+";

// ─── User Input ───────────────────────────────────────────────────────────────

export interface ToolEntry {
  id: string; // nanoid per row
  toolId: AiToolId;
  plan: string;
  monthlySpend: number; // USD, what user actually pays
  seats: number;
  useCase: UseCase;
}

export interface AuditInput {
  tools: ToolEntry[];
  teamSize: TeamSize;
  companyStage: "idea" | "early" | "growth" | "scale";
}

// ─── Audit Engine Output ──────────────────────────────────────────────────────

export type RecommendationType =
  | "downgrade_plan"
  | "upgrade_plan"
  | "switch_tool"
  | "reduce_seats"
  | "switch_to_api"
  | "switch_to_subscription"
  | "already_optimal"
  | "consider_credex";

export interface ToolRecommendation {
  toolEntryId: string;
  toolId: AiToolId;
  currentPlan: string;
  currentMonthlySpend: number;
  recommendationType: RecommendationType;
  recommendedPlan: string;
  recommendedTool?: AiToolId;
  estimatedMonthlyCost: number;
  monthlySavings: number;
  annualSavings: number;
  reasoning: string; // 1 sentence, finance-literate
  confidence: "high" | "medium" | "low";
}

export interface AuditResult {
  id?: string; // set after saving to Supabase
  input: AuditInput;
  recommendations: ToolRecommendation[];
  totalMonthlySpend: number;
  totalOptimizedMonthlySpend: number;
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  savingsPercentage: number;
  isAlreadyOptimal: boolean;
  shouldPromoteCredex: boolean; // true if savings > $500/mo
  aiSummary?: string;
  createdAt?: string;
}

// ─── Lead Capture ─────────────────────────────────────────────────────────────

export interface LeadData {
  email: string;
  companyName?: string;
  role?: string;
  teamSize?: TeamSize;
  auditId: string;
}

// ─── Pricing Data Shape ───────────────────────────────────────────────────────

export interface PlanInfo {
  name: string;
  pricePerSeat: number; // USD/month
  minSeats?: number;
  maxSeats?: number; // undefined = unlimited
  annualDiscount?: number; // fraction, e.g. 0.2 = 20% off
  isApiPricing?: boolean;
  sourceUrl: string;
  verifiedDate: string; // YYYY-MM-DD
}

export interface ToolPricingData {
  toolId: AiToolId;
  displayName: string;
  plans: Record<string, PlanInfo>;
  bestForUseCases: UseCase[];
  category: "coding" | "general" | "api";
}
