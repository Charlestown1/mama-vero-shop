"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ReportSection from "@/components/ReportSection";
import AnnouncementBanner from "@/components/AnnouncementBanner";

const CHAINS = ["Ethereum", "BNB Chain", "Solana", "Base", "Arbitrum", "Polygon", "Avalanche"];

const CLASSIFICATION_COLOR = {
  STRONG_OPPORTUNITY: "text-signal-green",
  WATCH: "text-gold-500",
  NEUTRAL: "text-ink-300",
  HIGH_RISK: "text-signal-red",
  AVOID: "text-signal-red"
};

export default function ResearchPage() {
  const [form, setForm] = useState({ symbol: "", address: "", blockchain: "Ethereum" });
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { loadHistory(); }, []);

  async function loadHistory() {
    const res = await fetch("/api/research");
    const data = await res.json();
    if (data.success) setHistory(data.data.reports);
  }

  async function openReport(id) {
    setError("");
    const res = await fetch(`/api/research/${id}`);
    const data = await res.json();
    if (data.success) {
      setReport(data.data.report);
      setShowHistory(false);
    } else {
      setError(data.message);
    }
  }

  async function deleteReport(id, e) {
    e.stopPropagation();
    await fetch(`/api/research/${id}`, { method: "DELETE" });
    setHistory((h) => h.filter((r) => r._id !== id));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setReport(null);

    const res = await fetch("/api/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.message);
      return;
    }
    setReport(data.data.report);
    loadHistory();
  }

  const content = report?.reportContent;

  return (
    <>
      <Navbar />
      <AnnouncementBanner placement="research" />
      <main className="mx-auto max-w-4xl px-5 py-10">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">AI Researcher</h1>
          <button className="btn-secondary text-sm" onClick={() => setShowHistory(!showHistory)}>
            History ({history.length})
          </button>
        </div>
        <p className="mt-1 text-sm text-ink-500">
          Facts come from connected data providers. Interpretation comes from AI. Missing data is
          always shown as &ldquo;Data unavailable&rdquo; — never invented.
        </p>

        {showHistory && (
          <div className="card mt-4 divide-y divide-base-700/60">
            {history.length === 0 && <p className="p-4 text-sm text-ink-500">No reports yet.</p>}
            {history.map((r) => (
              <button
                key={r._id}
                onClick={() => openReport(r._id)}
                className="flex w-full items-center justify-between p-4 text-left text-sm hover:bg-base-800"
              >
                <span>
                  ${r.tokenSnapshot?.symbol || "Unknown"} · {r.tokenSnapshot?.blockchain || "—"}
                </span>
                <span className="flex items-center gap-3">
                  <span className={CLASSIFICATION_COLOR[r.classification] || "text-ink-300"}>
                    {r.classification || "—"}
                  </span>
                  <span onClick={(e) => deleteReport(r._id, e)} className="text-ink-700 hover:text-signal-red">
                    Delete
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card mt-4 flex flex-col gap-3 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              placeholder="Symbol (e.g. SUI)" className="input-field"
              value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })}
            />
            <input
              placeholder="Contract address" className="input-field sm:col-span-1"
              value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <select
              className="input-field" value={form.blockchain}
              onChange={(e) => setForm({ ...form, blockchain: e.target.value })}
            >
              {CHAINS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Analyzing..." : "Deep Analyze"}
          </button>
        </form>

        {error && (
          <div className="card mt-4 border-signal-red/40 p-4 text-sm text-signal-red">{error}</div>
        )}

        {report && content && (
          <div className="mt-6 space-y-4">
            <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-display text-lg font-bold">${report.tokenSnapshot?.symbol || "Unknown"}</p>
                <p className="text-xs text-ink-500">{report.tokenSnapshot?.blockchain}</p>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="font-display text-2xl font-bold text-gold-500">{report.aiOpportunityScore}</p>
                  <p className="text-xs text-ink-500">Opportunity</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-2xl font-bold text-signal-red">{report.aiRiskScore}</p>
                  <p className="text-xs text-ink-500">AI Risk</p>
                </div>
              </div>
              <p className={`font-display font-bold ${CLASSIFICATION_COLOR[report.classification] || ""}`}>
                {report.classification?.replace(/_/g, " ")}
              </p>
            </div>

            <ReportSection title="Overview" value={content.overview} />
            <ReportSection title="Market Data" value={content.marketData} />
            <ReportSection title="Price Structure" value={content.priceStructure} />
            <ReportSection title="Volume Analysis" value={content.volumeAnalysis} />
            <ReportSection title="Liquidity Analysis" value={content.liquidityAnalysis} />
            <ReportSection title="Holder Analysis" value={content.holderAnalysis} />
            <ReportSection title="Whale Activity" value={content.whaleActivity} />
            <ReportSection title="Social Sentiment" value={content.socialSentiment} />
            <ReportSection title="Tokenomics" value={content.tokenomics} />
            <ReportSection title="Contract Security" value={content.contractSecurity} />
            <ReportSection title="Bull Case" value={content.bullCase} />
            <ReportSection title="Bear Case" value={content.bearCase} />
            <ReportSection title="Catalysts" value={content.catalysts} />
            <ReportSection title="Risks" value={content.risks} />

            <p className="text-center text-xs text-ink-700">
              AI Analysis — not financial advice. Classification reflects the data available at the time of this report.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
