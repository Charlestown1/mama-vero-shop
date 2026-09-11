import Link from "next/link";
import ScoreBadge from "./ScoreBadge";

function formatUsd(n) {
  if (n === undefined || n === null) return "Data unavailable";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

const RISK_COLOR = {
  LOW: "text-signal-green",
  MEDIUM: "text-gold-500",
  HIGH: "text-signal-red",
  CRITICAL: "text-signal-red"
};

export default function TokenCard({ result }) {
  return (
    <div className="card flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display text-lg font-bold">${result.symbol}</p>
          <p className="text-xs text-ink-500">{result.blockchain}</p>
        </div>
        <ScoreBadge label="Opportunity" score={result.opportunityScore} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-ink-500">Liquidity</p>
          <p>{formatUsd(result.metrics?.liquidity)}</p>
        </div>
        <div>
          <p className="text-ink-500">Market Cap</p>
          <p>{formatUsd(result.metrics?.marketCap)}</p>
        </div>
        <div>
          <p className="text-ink-500">24H Volume</p>
          <p>{formatUsd(result.metrics?.volume24h)}</p>
        </div>
        <div>
          <p className="text-ink-500">Risk</p>
          <p className={RISK_COLOR[result.riskLevel] || "text-ink-300"}>{result.riskLevel || "Data unavailable"}</p>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Link
          href={`/token/${result.address}?blockchain=${encodeURIComponent(result.blockchain)}`}
          className="btn-primary flex-1 text-center text-sm"
        >
          Deep Analyze
        </Link>
        <button className="btn-secondary flex-1 text-sm">Watchlist</button>
      </div>
    </div>
  );
}
