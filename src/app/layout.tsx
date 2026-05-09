import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SpendLens — Free AI Spend Audit for Startups",
  description:
    "Find out if your startup is overpaying for AI tools. Enter your subscriptions, get an instant audit with savings recommendations. Free, no login required.",
  keywords: ["AI spending", "startup tools", "ChatGPT cost", "Cursor pricing", "AI audit", "SaaS optimization"],
  openGraph: {
    title: "SpendLens — Free AI Spend Audit",
    description: "Most startups overpay for AI tools by 30–40%. Find out where you're wasting money in 2 minutes.",
    type: "website",
    url: process.env.NEXT_PUBLIC_APP_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "SpendLens — Free AI Spend Audit",
    description: "Most startups overpay for AI tools by 30–40%. Audit yours free in 2 minutes.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
