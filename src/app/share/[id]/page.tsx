import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase";
import SharePageClient from "./SharePageClient";

interface Props {
  params: { id: string };
}

// ─── Metadata for OG / Twitter card ──────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data } = await supabaseAdmin
    .from("audits")
    .select("total_monthly_savings, total_monthly_spend, savings_percentage")
    .eq("share_id", params.id)
    .single();

  if (!data) {
    return { title: "Audit not found — SpendLens" };
  }

  const savings = data.total_monthly_savings as number;
  const spend = data.total_monthly_spend as number;
  const pct = data.savings_percentage as number;

  const title =
    savings > 0
      ? `I found $${savings}/month in AI tool savings — SpendLens`
      : `My AI spend audit: $${spend}/month, already optimized — SpendLens`;

  const description =
    savings > 0
      ? `This team is spending $${spend}/month on AI tools and could save ${pct}% ($${savings * 12}/year). Audit yours free at SpendLens.`
      : `This team spends $${spend}/month on AI tools and is already well-optimized. Audit yours free at SpendLens.`;

  const ogImageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/og?id=${params.id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SharePage({ params }: Props) {
  const { data, error } = await supabaseAdmin
    .from("audits")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) notFound();

  return <SharePageClient auditData={data} shareId={params.id} />;
}
