import type { AuditResult } from "@/types";
import { getToolDisplayName } from "./pricingData";

// ─────────────────────────────────────────────────────────────────────────────
// PDF Export — generates a downloadable audit report
// Uses jsPDF + html2canvas to capture the styled report
// ─────────────────────────────────────────────────────────────────────────────

export async function generateAuditPdf(
  result: AuditResult,
  aiSummary: string,
  shareId?: string
): Promise<void> {
  // Dynamic imports — keeps bundle size small (only loads when user clicks export)
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ── Helpers ────────────────────────────────────────────────────────────────

  function addText(
    text: string,
    x: number,
    yPos: number,
    options: {
      fontSize?: number;
      fontStyle?: "normal" | "bold" | "italic";
      color?: [number, number, number];
      maxWidth?: number;
    } = {}
  ): number {
    const {
      fontSize = 11,
      fontStyle = "normal",
      color = [30, 30, 30],
      maxWidth = contentWidth,
    } = options;

    doc.setFontSize(fontSize);
    doc.setFont("helvetica", fontStyle);
    doc.setTextColor(...color);

    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, yPos);
    return yPos + lines.length * (fontSize * 0.4) + 2;
  }

  function addDivider(yPos: number): number {
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    return yPos + 6;
  }

  function checkPageBreak(yPos: number, neededSpace = 30): number {
    if (yPos + neededSpace > pageHeight - margin) {
      doc.addPage();
      return margin;
    }
    return yPos;
  }

  function addRect(
    x: number,
    yPos: number,
    w: number,
    h: number,
    fillColor: [number, number, number]
  ) {
    doc.setFillColor(...fillColor);
    doc.roundedRect(x, yPos, w, h, 3, 3, "F");
  }

  // ── Header ─────────────────────────────────────────────────────────────────

  // Dark header bar
  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("SpendLens", margin, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(156, 163, 175);
  doc.text("AI Spend Audit Report", margin, 27);

  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(dateStr, pageWidth - margin, 27, { align: "right" });

  y = 52;

  // ── Summary hero ───────────────────────────────────────────────────────────

  if (result.isAlreadyOptimal) {
    addRect(margin, y, contentWidth, 28, [240, 253, 244]);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 101, 52);
    doc.text("✓ Spending Optimized", margin + 6, y + 10);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(21, 128, 61);
    doc.text(
      `Current spend: $${result.totalMonthlySpend}/month — already well-configured`,
      margin + 6,
      y + 20
    );
    y += 36;
  } else {
    addRect(margin, y, contentWidth, 42, [17, 24, 39]);

    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(251, 191, 36);
    doc.text(`$${result.totalMonthlySavings}/month`, margin + 6, y + 18);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(209, 213, 219);
    doc.text("in potential savings found", margin + 6, y + 27);

    // Stats row
    const statY = y + 34;
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.text(`Current: $${result.totalMonthlySpend}/mo`, margin + 6, statY);
    doc.text(
      `Optimized: $${result.totalOptimizedMonthlySpend}/mo`,
      margin + 60,
      statY
    );
    doc.text(`Annual savings: $${result.totalAnnualSavings}`, margin + 120, statY);

    y += 52;
  }

  // ── AI Summary ─────────────────────────────────────────────────────────────

  y = checkPageBreak(y, 40);
  y = addText("AI Audit Summary", margin, y, {
    fontSize: 13,
    fontStyle: "bold",
    color: [17, 24, 39],
  });
  y += 2;

  if (aiSummary) {
    y = addText(aiSummary, margin, y, {
      fontSize: 10,
      color: [75, 85, 99],
      maxWidth: contentWidth,
    });
  }

  y += 4;
  y = addDivider(y);

  // ── Per-tool breakdown ─────────────────────────────────────────────────────

  y = checkPageBreak(y, 20);
  y = addText("Per-Tool Breakdown", margin, y, {
    fontSize: 13,
    fontStyle: "bold",
    color: [17, 24, 39],
  });
  y += 4;

  for (const rec of result.recommendations) {
    y = checkPageBreak(y, 36);

    const cardColor: [number, number, number] =
      rec.recommendationType === "already_optimal"
        ? [249, 250, 251]
        : [255, 251, 235];

    addRect(margin, y, contentWidth, 34, cardColor);

    // Tool name
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.text(getToolDisplayName(rec.toolId), margin + 4, y + 9);

    // Recommendation type badge
    const badgeText = rec.recommendationType.replace(/_/g, " ").toUpperCase();
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(120, 113, 108);
    doc.text(badgeText, margin + 4, y + 16);

    // Reasoning
    const reasonLines = doc.splitTextToSize(rec.reasoning, contentWidth - 50);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text(reasonLines[0] ?? "", margin + 4, y + 24);

    // Price info (right side)
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.text(
      `$${rec.estimatedMonthlyCost}/mo`,
      pageWidth - margin - 4,
      y + 9,
      { align: "right" }
    );

    if (rec.monthlySavings > 0) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(22, 163, 74);
      doc.text(
        `Save $${rec.monthlySavings}/mo`,
        pageWidth - margin - 4,
        y + 18,
        { align: "right" }
      );
    }

    // Strikethrough current price
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(156, 163, 175);
    doc.text(
      `was $${rec.currentMonthlySpend}/mo`,
      pageWidth - margin - 4,
      y + 26,
      { align: "right" }
    );

    y += 40;
  }

  y = addDivider(y);

  // ── Savings summary table ──────────────────────────────────────────────────

  y = checkPageBreak(y, 50);
  y = addText("Savings Summary", margin, y, {
    fontSize: 13,
    fontStyle: "bold",
    color: [17, 24, 39],
  });
  y += 4;

  const tableData = [
    ["Current monthly spend", `$${result.totalMonthlySpend}`],
    ["Optimized monthly spend", `$${result.totalOptimizedMonthlySpend}`],
    ["Monthly savings", `$${result.totalMonthlySavings}`],
    ["Annual savings", `$${result.totalAnnualSavings}`],
    ["Savings percentage", `${result.savingsPercentage}%`],
  ];

  for (const [label, value] of tableData) {
    const isHighlight = label === "Annual savings";
    addRect(
      margin,
      y,
      contentWidth,
      10,
      isHighlight ? [236, 253, 245] : [249, 250, 251]
    );

    doc.setFontSize(9);
    doc.setFont("helvetica", isHighlight ? "bold" : "normal");
    doc.setTextColor(isHighlight ? 22 : 75, isHighlight ? 101 : 85, isHighlight ? 52 : 99);
    doc.text(label, margin + 4, y + 7);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(isHighlight ? 22 : 17, isHighlight ? 101 : 24, isHighlight ? 52 : 39);
    doc.text(value, pageWidth - margin - 4, y + 7, { align: "right" });

    y += 12;
  }

  // ── Credex section ─────────────────────────────────────────────────────────

  if (result.shouldPromoteCredex) {
    y += 4;
    y = checkPageBreak(y, 30);
    addRect(margin, y, contentWidth, 26, [17, 24, 39]);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Capture more savings with Credex", margin + 6, y + 10);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(156, 163, 175);
    doc.text(
      "Discounted AI credits — Cursor, Claude, ChatGPT — 20-40% below retail.",
      margin + 6,
      y + 18
    );

    doc.setTextColor(251, 191, 36);
    doc.text("credex.rocks", pageWidth - margin - 6, y + 18, { align: "right" });

    y += 32;
  }

  // ── Footer ─────────────────────────────────────────────────────────────────

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Generated by SpendLens (spendlens.app) · ${dateStr} · Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );

    if (shareId) {
      doc.text(
        `Report ID: ${shareId}`,
        pageWidth - margin,
        pageHeight - 8,
        { align: "right" }
      );
    }
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  doc.save(`spendlens-audit-${shareId ?? "report"}.pdf`);
}