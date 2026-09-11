"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import TokenCard from "@/components/TokenCard";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import AdSlot from "@/components/AdSlot";

const CHAINS = ["Ethereum", "BNB Chain", "Solana", "Base", "Arbitrum", "Polygon", "Avalanche"];

export default function ScannerPage() {
  const [blockchain, setBlockchain] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runScan() {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (blockchain) params.set("blockchain", blockchain);

    const res = await fetch(`/api/scanner?${params.toString()}`);
    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.message);
      return;
    }
    setResults(data.data.results);
  }

  return (
    <>
      <Navbar />
      <AnnouncementBanner placement="scanner" />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="font-display text-2xl font-bold">Gem Scanner</h1>
        <p className="mt-1 text-sm text-ink-500">
          Opportunity Score is calculated from real weighted signals — never invented by AI.
        </p>

        <div className="card mt-6 flex flex-wrap items-center gap-3 p-4">
          <select
            className="input-field w-auto"
            value={blockchain}
            onChange={(e) => setBlockchain(e.target.value)}
          >
            <option value="">All blockchains</option>
            {CHAINS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={runScan} disabled={loading} className="btn-primary">
            {loading ? "Scanning..." : "Scan for Gems"}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-signal-red">{error}</p>}

        {results.length === 0 && !loading && !error && (
          <div className="card mt-6 p-8 text-center text-sm text-ink-500">
            No results yet. Run a scan, or connect a token-discovery data source in
            <code className="mx-1 text-ink-300">scannerService.js</code> to populate live candidates.
          </div>
        )}

        <div className="mt-6">
          <AdSlot placement="scanner" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((r) => <TokenCard key={r.id} result={r} />)}
        </div>
      </main>
    </>
  );
}
