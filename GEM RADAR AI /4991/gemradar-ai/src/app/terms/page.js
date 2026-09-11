import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Terms of Service",
  description: "Terms of Service for GemRadar AI.",
  robots: { index: true, follow: true }
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 py-16">
        <h1 className="font-display text-2xl font-bold">Terms of Service</h1>
        <div className="mt-6 space-y-4 text-sm text-ink-300">
          <p>
            This is placeholder terms-of-service content shipped with the project template. Before
            operating GemRadar AI as a real product, replace this page with terms reviewed by a
            qualified lawyer, covering at minimum: acceptable use, subscription billing terms
            (referencing the Free/Pro/Pro+ plans and Stripe-based billing), account suspension,
            limitation of liability, and dispute resolution.
          </p>
          <p>
            By using GemRadar AI you agree to use the platform's Gem Scanner, AI Researcher, Risk
            Scanner, and related tools for informational purposes only, consistent with the{" "}
            <a href="/disclaimer" className="text-gold-500">Risk Disclaimer</a>.
          </p>
        </div>
      </main>
    </>
  );
}
