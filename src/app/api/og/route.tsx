import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  let savings = 0;
  let spend = 0;
  let pct = 0;
  let isOptimal = false;

  if (id) {
    try {
      const { data } = await supabaseAdmin
        .from("audits")
        .select("total_monthly_savings, total_monthly_spend, savings_percentage, is_already_optimal")
        .eq("id", id)
        .single();

      if (data) {
        savings = data.total_monthly_savings as number;
        spend = data.total_monthly_spend as number;
        pct = data.savings_percentage as number;
        isOptimal = data.is_already_optimal as boolean;
      }
    } catch {}
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#0f172a",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
          <div style={{
            width: 48, height: 48, background: "#fff", borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24
          }}>📊</div>
          <span style={{ color: "#fff", fontSize: 28, fontWeight: 700 }}>SpendLens</span>
        </div>

        {/* Main headline */}
        {isOptimal ? (
          <>
            <div style={{ color: "#4ade80", fontSize: 22, fontWeight: 600, marginBottom: 16 }}>
              ✓ AI spend optimized
            </div>
            <div style={{ color: "#fff", fontSize: 64, fontWeight: 800, lineHeight: 1.1, marginBottom: 24 }}>
              Spending ${spend}/mo well
            </div>
            <div style={{ color: "#94a3b8", fontSize: 28 }}>
              Already on the right plans
            </div>
          </>
        ) : (
          <>
            <div style={{ color: "#fbbf24", fontSize: 22, fontWeight: 600, marginBottom: 16 }}>
              💸 Savings found
            </div>
            <div style={{ color: "#fff", fontSize: 72, fontWeight: 800, lineHeight: 1.1, marginBottom: 24 }}>
              ${savings}/month<br />in AI savings
            </div>
            <div style={{ color: "#94a3b8", fontSize: 28 }}>
              ${spend}/mo spend · {pct}% reduction possible · ${savings * 12}/year
            </div>
          </>
        )}

        {/* Bottom tag */}
        <div style={{
          position: "absolute", bottom: 60, right: 80,
          color: "#475569", fontSize: 20, display: "flex", alignItems: "center", gap: 8
        }}>
          Free AI spend audit at spendlens.app
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
