import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Features",
  description: "Gem Scanner, AI Researcher, Risk Scanner, Smart Money tracking, alerts, and portfolio analysis.",
  robots: { index: true, follow: true }
};

const FEATURES = [
  ["Gem Scanner", "Deterministic Opportunity Scoring across liquidity, volume, holder growth, and whale activity."],
  ["AI Researcher", "Structured research reports that separate verified data from AI interpretation."],
  ["Risk Scanner", "A transparent security score with a clear breakdown of what could and couldn't be checked."],
  ["Smart Money", "Track wallets and see accumulation activity as it's recorded."],
  ["Alerts", "Price, volume, score, and wallet-activity triggers delivered by email or Telegram."],
  ["Portfolio", "Real-time valuation, P&L, and AI-assisted allocation analysis."]
];

export default function FeaturesPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="font-display text-2xl font-bold">Features</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {FEATURES.map(([title, copy]) => (
            <div key={title} className="card p-4">
              <h3 className="font-display font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-ink-500">{copy}</p>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
