"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";

function fmt(n) {
  if (n === null || n === undefined) return "—";
  if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export default function MarketPage() {
  const [data, setData] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/market");
      const json = await res.json();
      if (json.success) setData(json.data);
      setLoading(false);
    })();
  }, []);

  async function runAiSummary() {
    setSummarizing(true);
    setSummaryError("");
    const res = await fetch("/api/market/summary", { method: "POST" });
    const json = await res.json();
    setSummarizing(false);
    if (!json.success) { setSummaryError(json.message); return; }
    setAiSummary(json.data.summary);
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 py-10">
        <h1 className="font-display text-2xl font-bold">Market Intelligence</h1>

        {loading && <p className="mt-6 text-sm text-ink-500">Loading market data...</p>}
        {data?.errors && (
          <div className="mt-4 space-y-1">
            {data.errors.map((e, i) => <p key={i} className="text-xs text-signal-red">{e}</p>)}
          </div>
        )}

        {data && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {data.overview.map((c) => (
                <div key={c.symbol} className="card p-4">
                  <p className="text-xs text-ink-500">{c.symbol}</p>
                  <p className="font-display font-bold">{fmt(c.price)}</p>
                  <p className={`text-xs ${c.change24h > 0 ? "text-signal-green" : "text-signal-red"}`}>
                    {c.change24h?.toFixed(2)}%
                  </p>
                </div>
              ))}
              {data.overview.length === 0 && (
                <p className="col-span-full text-sm text-ink-500">Market overview unavailable right now.</p>
              )}
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="card p-4">
                <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-signal-green">Top Gainers</h3>
                <div className="mt-2 space-y-2 text-sm">
                  {data.gainers.map((g) => (
                    <div key={g.symbol} className="flex justify-between">
                      <span>{g.symbol}</span>
                      <span className="text-signal-green">+{g.change24h?.toFixed(2)}%</span>
                    </div>
                  ))}
                  {data.gainers.length === 0 && <p className="text-ink-500">Data unavailable</p>}
                </div>
              </div>
              <div className="card p-4">
                <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-signal-red">Top Losers</h3>
                <div className="mt-2 space-y-2 text-sm">
                  {data.losers.map((l) => (
                    <div key={l.symbol} className="flex justify-between">
                      <span>{l.symbol}</span>
                      <span className="text-signal-red">{l.change24h?.toFixed(2)}%</span>
                    </div>
                  ))}
                  {data.losers.length === 0 && <p className="text-ink-500">Data unavailable</p>}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button onClick={runAiSummary} disabled={summarizing} className="btn-secondary">
                {summarizing ? "Summarizing..." : "AI Market Summary"}
              </button>
              {summaryError && <p className="mt-2 text-sm text-signal-red">{summaryError}</p>}
              {aiSummary && (
                <div className="card mt-3 space-y-2 p-4 text-sm">
                  <p><span className="text-gold-500">Sentiment:</span> {aiSummary.sentiment || "Data unavailable"}</p>
                  <p>{aiSummary.summary || "Data unavailable"}</p>
                  {aiSummary.keyMovers?.length > 0 && (
                    <ul className="list-disc space-y-1 pl-5">
                      {aiSummary.keyMovers.map((m, i) => <li key={i}>{typeof m === "string" ? m : JSON.stringify(m)}</li>)}
                    </ul>
                  )}
                  <p className="text-xs text-ink-700">AI Analysis based on the data above — not financial advice.</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}
