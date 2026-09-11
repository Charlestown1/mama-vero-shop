"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";

function fmt(n) {
  if (n === null || n === undefined) return "Data unavailable";
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function PortfolioPage() {
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState({ symbol: "", quantity: "", avgBuyPrice: "" });
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/portfolio");
    const data = await res.json();
    if (data.success) setSummary(data.data);
    setLoading(false);
  }

  async function addHolding(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/portfolio", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: form.symbol,
        quantity: Number(form.quantity),
        avgBuyPrice: form.avgBuyPrice ? Number(form.avgBuyPrice) : null
      })
    });
    const data = await res.json();
    if (!data.success) { setError(data.message); return; }
    setForm({ symbol: "", quantity: "", avgBuyPrice: "" });
    load();
  }

  async function removeHolding(id) {
    await fetch(`/api/portfolio/${id}`, { method: "DELETE" });
    load();
  }

  async function runAnalysis() {
    setAnalyzing(true);
    setError("");
    const res = await fetch("/api/portfolio/analyze", { method: "POST" });
    const data = await res.json();
    setAnalyzing(false);
    if (!data.success) { setError(data.message); return; }
    setAnalysis(data.data.analysis);
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 py-10">
        <h1 className="font-display text-2xl font-bold">Portfolio</h1>

        {loading && <p className="mt-6 text-sm text-ink-500">Loading...</p>}

        {summary && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="card p-4">
                <p className="text-xs text-ink-500">Total Value</p>
                <p className="font-display text-xl font-bold">{fmt(summary.totalValue)}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-ink-500">Unrealized P/L</p>
                <p className={`font-display text-xl font-bold ${summary.totalPnl > 0 ? "text-signal-green" : summary.totalPnl < 0 ? "text-signal-red" : ""}`}>
                  {fmt(summary.totalPnl)}
                </p>
              </div>
              {summary.concentrationWarning && (
                <div className="card border-gold-500/40 p-4">
                  <p className="text-xs text-gold-500">Concentration</p>
                  <p className="text-sm">{summary.concentrationWarning}</p>
                </div>
              )}
            </div>

            <form onSubmit={addHolding} className="card mt-6 flex flex-wrap gap-2 p-4">
              <input placeholder="Symbol" className="input-field w-24" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} />
              <input placeholder="Quantity" type="number" step="any" className="input-field w-32" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              <input placeholder="Avg buy price (optional)" type="number" step="any" className="input-field w-40" value={form.avgBuyPrice} onChange={(e) => setForm({ ...form, avgBuyPrice: e.target.value })} />
              <button className="btn-primary">Add Holding</button>
            </form>

            {error && <p className="mt-3 text-sm text-signal-red">{error}</p>}

            <div className="card mt-4 divide-y divide-base-700/60">
              {summary.holdings.length === 0 && <p className="p-4 text-sm text-ink-500">No holdings yet.</p>}
              {summary.holdings.map((h) => (
                <div key={h.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                  <span className="font-medium">${h.symbol}</span>
                  <span>{h.quantity} units</span>
                  <span>{fmt(h.currentPrice)}</span>
                  <span>{fmt(h.currentValue)}</span>
                  <span className={h.unrealizedPnl > 0 ? "text-signal-green" : h.unrealizedPnl < 0 ? "text-signal-red" : "text-ink-500"}>
                    {fmt(h.unrealizedPnl)}
                  </span>
                  <button onClick={() => removeHolding(h.id)} className="text-ink-700 hover:text-signal-red">Remove</button>
                </div>
              ))}
            </div>

            <button onClick={runAnalysis} disabled={analyzing} className="btn-secondary mt-6">
              {analyzing ? "Analyzing..." : "Run AI Portfolio Analysis"}
            </button>

            {analysis && (
              <div className="card mt-4 space-y-3 p-4 text-sm">
                <p><span className="text-gold-500">Allocation:</span> {analysis.allocationSummary || "Data unavailable"}</p>
                <p><span className="text-gold-500">Concentration risk:</span> {analysis.concentrationRisk || "Data unavailable"}</p>
                <p><span className="text-gold-500">Correlation:</span> {analysis.correlationNote || "Data unavailable"}</p>
                {analysis.observations?.length > 0 && (
                  <ul className="list-disc space-y-1 pl-5">
                    {analysis.observations.map((o, i) => <li key={i}>{o}</li>)}
                  </ul>
                )}
                <p className="text-xs text-ink-700">AI Analysis — not financial advice.</p>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
