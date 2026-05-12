import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const {
      totalSpend,
      totalSavings,
      savingsPercentage,
      toolCount,
      recommendations,
      isAlreadyOptimal,
    } = await req.json();

    const prompt = buildPrompt({
      totalSpend,
      totalSavings,
      savingsPercentage,
      toolCount,
      recommendations,
      isAlreadyOptimal,
    });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 180,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "You are a concise, financially sharp AI spend analyst. You write audit summaries for startup founders and engineering managers. No bullet points. Write in 2-3 flowing sentences. Be direct and specific — cite actual numbers. Never be vague.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const summary = completion.choices[0]?.message?.content?.trim() ?? "";

    return NextResponse.json({ summary });
  } catch (err) {
    console.error("Groq API error:", err);
    // Graceful fallback — never surface an error to the user
    return NextResponse.json({ summary: "" });
  }
}

function buildPrompt({
  totalSpend,
  totalSavings,
  savingsPercentage,
  toolCount,
  recommendations,
  isAlreadyOptimal,
}: {
  totalSpend: number;
  totalSavings: number;
  savingsPercentage: number;
  toolCount: number;
  recommendations: string[];
  isAlreadyOptimal: boolean;
}) {
  if (isAlreadyOptimal) {
    return `Write a 2-sentence audit summary for a startup spending $${totalSpend}/month across ${toolCount} AI tools. Their setup is well-optimized — no major changes needed. Acknowledge this positively but suggest they revisit in 3 months as pricing changes.`;
  }

  const recText =
    recommendations.length > 0
      ? `Key recommendations: ${recommendations.join(". ")}`
      : "";

  return `Write a 2-3 sentence audit summary for a startup spending $${totalSpend}/month across ${toolCount} AI tools. They can save $${totalSavings}/month (${savingsPercentage}% reduction). ${recText}. Be specific about the dollar amounts and what they should do first. End with one sentence about how acting on this within 30 days compounds to $${totalSavings * 12}/year.`;
}