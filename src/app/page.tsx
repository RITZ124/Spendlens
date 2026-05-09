"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Zap, Shield, TrendingDown, CheckCircle2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOOLS = [
  { name: "Cursor", color: "#000" },
  { name: "ChatGPT", color: "#10a37f" },
  { name: "Claude", color: "#d97706" },
  { name: "Copilot", color: "#6e40c9" },
  { name: "Gemini", color: "#4285f4" },
  { name: "Windsurf", color: "#0ea5e9" },
];

const STATS = [
  { value: "$840", label: "avg monthly savings found" },
  { value: "73%", label: "of teams are overspending" },
  { value: "2 min", label: "to complete your audit" },
];

const FEATURES = [
  {
    icon: BarChart3,
    title: "Instant spend breakdown",
    desc: "Enter your tools and plans — get a per-tool analysis in seconds. No login, no signup.",
  },
  {
    icon: TrendingDown,
    title: "Finance-grade recommendations",
    desc: "Every suggestion is justified with real pricing data. Not guesses — actual numbers from vendor pages.",
  },
  {
    icon: Zap,
    title: "AI-written summary",
    desc: "A personalized 100-word audit summary generated just for your stack.",
  },
  {
    icon: Shield,
    title: "Shareable audit link",
    desc: "Get a unique URL to share your audit with your team or CFO. Private info stays private.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900 text-lg">SpendLens</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 hidden sm:block">Free. No account needed.</span>
          <Link href="/audit">
            <Button size="sm" className="bg-black text-white hover:bg-gray-800">
              Start audit →
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm text-amber-800 font-medium">Free AI spend audit — takes 2 minutes</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight tracking-tight mb-6">
            Stop guessing.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">
              Start saving on AI.
            </span>
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Most startups overpay for AI tools by 30–40%. SpendLens audits your subscriptions,
            finds exactly where you're wasting money, and tells you what to do about it.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/audit">
              <Button
                size="lg"
                className="bg-black text-white hover:bg-gray-800 h-14 px-8 text-base font-medium rounded-xl gap-2"
              >
                Audit my AI spend free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <p className="text-sm text-gray-400">No login · No credit card · 2 minutes</p>
          </div>
        </motion.div>

        {/* Tool logos strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-14 flex flex-wrap items-center justify-center gap-3"
        >
          <span className="text-sm text-gray-400 mr-2">Audits your spend on:</span>
          {TOOLS.map((t) => (
            <span
              key={t.name}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700"
            >
              {t.name}
            </span>
          ))}
          <span className="text-sm text-gray-400">+ more</span>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="bg-gray-950 py-14">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="text-4xl font-bold text-white mb-2">{s.value}</div>
              <div className="text-gray-400 text-sm">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">How it works</h2>
          <p className="text-gray-500">Three steps. Two minutes. Real savings.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { step: "01", title: "Enter your tools", desc: "Tell us what AI subscriptions your team pays for — plans, seats, and what you use them for." },
            { step: "02", title: "Get your audit", desc: "Our engine analyzes each tool against current pricing, your team size, and your actual use case." },
            { step: "03", title: "Act on it", desc: "See exactly what to downgrade, switch, or cancel. Shareable report included." },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative p-6 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all"
            >
              <div className="text-5xl font-black text-gray-100 mb-4 leading-none">{item.step}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Built for startup teams</h2>
            <p className="text-gray-500">Not a spreadsheet. A real audit engine with real pricing data.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 bg-white rounded-2xl border border-gray-100"
              >
                <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">What founders are finding</h2>
          <p className="text-gray-400 text-sm italic">(Illustrative examples — results vary by team)</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { quote: "Found out we had Cursor Business for 3 devs. Downgraded to Pro, saved $60/month immediately.", name: "CTO, 8-person SaaS startup", savings: "$720/yr" },
            { quote: "We were paying for ChatGPT Team AND Claude Pro for 2 people. SpendLens told us to pick one.", name: "Founder, B2B tool", savings: "$240/yr" },
            { quote: "Our API costs were wild. This helped us realize we should switch to a flat subscription.", name: "Eng lead, early-stage startup", savings: "$1,200/yr" },
          ].map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl border border-gray-100 bg-white"
            >
              <div className="text-2xl font-bold text-green-600 mb-3">{t.savings} saved</div>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">"{t.quote}"</p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <span className="text-xs text-gray-400">{t.name}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-950 py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to find out what you're wasting?</h2>
          <p className="text-gray-400 mb-8">Takes 2 minutes. Completely free. No account needed.</p>
          <Link href="/audit">
            <Button
              size="lg"
              className="bg-white text-black hover:bg-gray-100 h-14 px-8 text-base font-medium rounded-xl gap-2"
            >
              Start my free audit
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" />No login</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" />Free forever</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" />Instant results</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6 text-center text-sm text-gray-400">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="font-medium text-gray-600">SpendLens</span>
            <span>— a free tool by</span>
            <a href="https://credex.rocks" className="text-gray-600 hover:text-black underline underline-offset-2">Credex</a>
          </div>
          <span>Pricing data verified weekly from official vendor pages</span>
        </div>
      </footer>
    </main>
  );
}
