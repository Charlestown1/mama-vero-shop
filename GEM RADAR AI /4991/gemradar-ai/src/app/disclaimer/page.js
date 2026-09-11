import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Risk Disclaimer",
  description: "GemRadar AI provides informational and analytical tools only. Nothing on this platform is financial advice.",
  robots: { index: true, follow: true }
};

export default function DisclaimerPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 py-16">
        <h1 className="font-display text-2xl font-bold">Risk Disclaimer</h1>
        <div className="mt-6 space-y-4 text-sm text-ink-300">
          <p>
            GemRadar AI is an informational and analytical tool. Opportunity Scores, Risk Scores, AI
            research reports, and market summaries are generated from available data and automated
            analysis — they are <strong className="text-ink-100">not financial advice</strong>,
            investment recommendations, or a guarantee of any outcome.
          </p>
          <p>
            Cryptocurrency markets are highly volatile and speculative. Data from third-party
            providers may be incomplete, delayed, or unavailable, and AI-generated interpretation can
            be wrong. Any place this app cannot verify a fact, it will say so — it will never
            represent a guess as a confirmed fact, but that does not make its analysis infallible.
          </p>
          <p>
            You are solely responsible for your own investment decisions. Never invest more than you
            can afford to lose. Consider consulting a licensed financial advisor before making
            investment decisions.
          </p>
        </div>
      </main>
    </>
  );
}
