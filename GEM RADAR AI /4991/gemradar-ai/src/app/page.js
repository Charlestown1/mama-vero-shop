import Link from "next/link";
import Navbar from "@/components/Navbar";
import AnnouncementBanner from "@/components/AnnouncementBanner";

export const metadata = {
  title: "GemRadar AI — Find the Gem. Understand the Gem. Before Everyone Else.",
  description: "AI-powered crypto discovery, research and risk intelligence for traders who want to see what the market is doing before the crowd.",
  alternates: { canonical: "/" }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "GemRadar AI",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description: "AI-powered crypto discovery, research and risk intelligence platform.",
  offers: [
    { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD" },
    { "@type": "Offer", name: "Pro", price: "9.99", priceCurrency: "USD" },
    { "@type": "Offer", name: "Pro+", price: "19.99", priceCurrency: "USD" }
  ]
};

const FEATURES = [
  { title: "Gem Scanner", copy: "Filter thousands of tokens by liquidity, volume acceleration, holder growth and whale accumulation." },
  { title: "AI Researcher", copy: "Deep-dive any token into a structured report — facts from data, interpretation from AI, never blended." },
  { title: "Risk Scanner", copy: "A deterministic security score built from contract, liquidity and holder-concentration checks." },
  { title: "Smart Money", copy: "Follow tracked wallets and see accumulation before it shows up in price." },
  { title: "Market Intelligence", copy: "Live prices, dominance, gainers and losers across the assets that matter." },
  { title: "Custom Alerts", copy: "Price, volume, score and whale-activity triggers — delivered by email, Telegram or in-app." }
];

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <AnnouncementBanner placement="homepage" />
      <main>
        <section className="mx-auto max-w-5xl px-5 pb-20 pt-24 text-center">
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Find the Gem.
            <br />
            Understand the Gem.
            <br />
            <span className="text-gold-500">Before Everyone Else.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-ink-300">
            AI-powered crypto discovery, research and risk intelligence for traders who want to see
            what the market is doing before the crowd.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="btn-primary">Scan for Gems</Link>
            <Link href="/research" className="btn-secondary">Research a Token</Link>
          </div>
          <p className="mt-6 text-xs text-ink-700">
            AI Analysis, not financial advice. GemRadar AI never guarantees outcomes.
          </p>
        </section>

        <section className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-5 pb-24 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6">
              <h3 className="font-display font-semibold text-ink-100">{f.title}</h3>
              <p className="mt-2 text-sm text-ink-300">{f.copy}</p>
            </div>
          ))}
        </section>

        <section className="border-t border-base-700/60 py-16 text-center">
          <h2 className="font-display text-2xl font-bold">Ready to see what the data actually says?</h2>
          <Link href="/signup" className="btn-primary mt-6 inline-block">Create your free account</Link>
        </section>
      </main>
    </>
  );
}
