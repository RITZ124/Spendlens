import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

// Simple in-memory rate limit (upgradeable to Upstash Redis)
const rateMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateMap.set(ip, { count: 1, resetAt: now + 60_000 }); // 1 min window
    return true;
  }
  if (entry.count >= 5) return false; // 5 submissions per minute per IP
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";

    // Rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, companyName, role, teamSize, auditId, honeypot } = body;

    // Honeypot check — bots fill hidden fields
    if (honeypot) {
      return NextResponse.json({ ok: true }); // silently reject
    }

    // Basic email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Save lead to Supabase
    const { error: dbError } = await supabaseAdmin.from("leads").insert({
      email: email.toLowerCase().trim(),
      company_name: companyName ?? null,
      role: role ?? null,
      team_size: teamSize ?? null,
      audit_id: auditId ?? null,
      ip_hash: Buffer.from(ip).toString("base64").slice(0, 16), // hashed for privacy
      created_at: new Date().toISOString(),
    });

    if (dbError) {
      // Duplicate email is fine — just skip
      if (!dbError.message.includes("duplicate")) {
        console.error("Lead save error:", dbError);
      }
    }

    // Send confirmation email via Resend
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "audit@spendlens.app",
        to: email,
        subject: "Your SpendLens AI Spend Audit",
        html: buildEmailHtml({ email, companyName, auditId }),
      });
    } catch (emailErr) {
      console.error("Email send error:", emailErr);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Lead capture error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

function buildEmailHtml({
  email,
  companyName,
  auditId,
}: {
  email: string;
  companyName?: string;
  auditId?: string;
}) {
  const shareUrl = auditId
    ? `${process.env.NEXT_PUBLIC_APP_URL}/share/${auditId}`
    : process.env.NEXT_PUBLIC_APP_URL;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:40px 20px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="background:#111827;padding:32px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700">SpendLens</h1>
      <p style="color:#9ca3af;margin:8px 0 0;font-size:14px">Your AI Spend Audit</p>
    </div>
    <div style="padding:32px">
      <p style="color:#374151;margin:0 0 16px;line-height:1.6">
        ${companyName ? `Hi ${companyName} team,` : "Hi there,"}
      </p>
      <p style="color:#374151;margin:0 0 24px;line-height:1.6">
        Thanks for using SpendLens. Your audit has been saved and you can share it with your team at the link below.
      </p>
      <a href="${shareUrl}"
         style="display:block;background:#111827;color:#fff;text-decoration:none;border-radius:12px;padding:16px 24px;text-align:center;font-weight:600;font-size:15px;margin-bottom:24px">
        View your audit report →
      </a>
      <p style="color:#6b7280;font-size:13px;margin:0 0 16px;line-height:1.6">
        The Credex team may reach out if your audit shows significant savings opportunities where discounted AI credits could help.
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center">
        SpendLens is a free tool by <a href="https://credex.rocks" style="color:#6b7280">Credex</a>.
        You received this because you requested your audit report.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}