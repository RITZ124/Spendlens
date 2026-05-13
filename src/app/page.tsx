import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase";
import SharePageClient from "./SharePageClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const { data } = await supabaseAdmin
    .from("audits")
    .select("total_monthly_savings, total_monthly_spend, savings_percentage")
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    return { title: "Audit not found — SpendLens" };
  }

  const savings = Number(data.total_monthly_savings);
  const spend = Number(data.total_monthly_spend);
  const pct = data.savings_percentage as number;

  const title =
    savings > 0
      ? `I found $${savings}/month in AI tool savings — SpendLens`
      : `My AI spend audit: $${spend}/month, already optimized — SpendLens`;

  const description =
    savings > 0
      ? `This team is spending $${spend}/month on AI tools and could save ${pct}% ($${savings * 12}/year). Audit yours free at SpendLens.`
      : `This team spends $${spend}/month on AI tools and is already well-optimized. Audit yours free at SpendLens.`;

  const ogImageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/og?id=${id}`;

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

export default async function SharePage({ params }: Props) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("audits")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    console.error("Share page error:", error, "for id:", id);
    notFound();
  }

  // Parse public_data if it came back as a string
  const auditData = {
    ...data,
    public_data:
      typeof data.public_data === "string"
        ? JSON.parse(data.public_data)
        : data.public_data,
  };

  return <SharePageClient auditData={auditData} shareId={id} />;
}
