"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import AdSlot from "@/components/AdSlot";

const LEVEL_COLOR = {
  LOW: "text-signal-green",
  MEDIUM: "text-gold-500",
  HIGH: "text-signal-red",
  CRITICAL: "text-signal-red"
};

export default function TokenPage({ params }) {
  const searchParams = useSearchParams();
  const blockchain = searchParams.get("blockchain") || "Ethereum";
  const [assessment, setAssessment] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function run() {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/risk?address=${params.address}&blockchain=${encodeURIComponent(blockchain)}`);
      const data = await res.json();
      setLoading(false);
      if (!data.success) { setError(data.message); return; }
      setAssessment(data.data.assessment);
    }
    run();
  }, [params.address, blockchain]);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="break-all font-display text-xl font-bold">{params.address}</h1>
        <p className="text-sm text-ink-500">{blockchain}</p>

        {loading && <p className="mt-6 text-sm text-ink-500">Running risk scan...</p>}
        {error && <p className="mt-6 text-sm text-signal-red">{error}</p>}

        <div className="mt-4">
          <AdSlot placement="token_page" />
        </div>

        {assessment && (
          <div className="mt-6 space-y-4">
            <div className="card flex items-center justify-between p-6">
              <div>
                <p className="font-display text-3xl font-bold">{assessment.score}<span className="text-base text-ink-500">/100</span></p>
                <p className={`text-sm font-semibold ${LEVEL_COLOR[assessment.level]}`}>{assessment.level} RISK</p>
              </div>
              {!assessment.onchainProviderConfigured && (
                <p className="max-w-[55%] text-right text-xs text-ink-700">
                  Contract-level checks (honeypot, tax, mint/freeze authority, holder concentration)
                  need an on-chain provider — set <code>ONCHAIN_API_KEY</code> to enable them.
                </p>
              )}
            </div>

            <div className="card p-4">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-signal-red">Risk Factors</h3>
              {assessment.reasons.length === 0 ? (
                <p className="mt-2 text-sm text-ink-500">No negative signals detected in available data.</p>
              ) : (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-300">
                  {assessment.reasons.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              )}
            </div>

            <div className="card p-4">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-signal-green">Positive Factors</h3>
              {assessment.positiveFactors.length === 0 ? (
                <p className="mt-2 text-sm text-ink-500">None confirmed from available data.</p>
              ) : (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-300">
                  {assessment.positiveFactors.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              )}
            </div>

            <div className="card p-4">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-500">Not Yet Checkable</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-700">
                {assessment.unavailableFactors.map((f, i) => <li key={i}>{f} — Data unavailable</li>)}
              </ul>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
