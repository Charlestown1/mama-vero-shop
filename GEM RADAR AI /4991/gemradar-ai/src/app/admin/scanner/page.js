"use client";
import { useState, useEffect } from "react";

const SCANNER_LABELS = {
  volumeMomentum: "Volume Momentum", liquidityQuality: "Liquidity Quality", holderGrowth: "Holder Growth",
  whaleActivity: "Whale Activity", priceMomentum: "Price Momentum", socialMomentum: "Social Momentum",
  marketStructure: "Market Structure", earlyOpportunity: "Early Opportunity"
};
const RISK_LABELS = {
  highBuyTax: "High Buy Tax Penalty", highSellTax: "High Sell Tax Penalty", mintAuthorityActive: "Mint Authority Active Penalty",
  freezeAuthorityActive: "Freeze Authority Active Penalty", honeypot: "Honeypot Penalty", liquidityNotLocked: "Liquidity Not Locked Penalty",
  highHolderConcentration: "High Holder Concentration Penalty", contractNotVerified: "Contract Not Verified Penalty"
};

function WeightEditor({ title, labels, apiPath, requireSum100 }) {
  const [weights, setWeights] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch(apiPath);
      const data = await res.json();
      if (data.success) setWeights(data.data.weights);
    })();
  }, [apiPath]);

  if (!weights) return <div className="card p-4"><p className="text-sm text-ink-500">Loading {title}...</p></div>;

  const total = Object.values(weights).reduce((sum, v) => sum + Number(v || 0), 0);
  const valid = requireSum100 ? Math.round(total) === 100 : Object.values(weights).every((v) => v >= 0 && v <= 100);

  async function save() {
    setError(""); setStatus("");
    const res = await fetch(apiPath, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(weights)
    });
    const data = await res.json();
    if (!data.success) { setError(data.message); return; }
    setStatus("Saved.");
  }

  return (
    <div className="card p-4">
      <h3 className="font-display font-semibold">{title}</h3>
      <div className="mt-3 space-y-3">
        {Object.keys(labels).map((key) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <label className="text-sm">{labels[key]}</label>
            <input
              type="number" className="input-field w-24" value={weights[key]}
              onChange={(e) => setWeights((w) => ({ ...w, [key]: Number(e.target.value) }))}
            />
          </div>
        ))}
      </div>

      <p className={`mt-3 text-sm ${valid ? "text-signal-green" : "text-signal-red"}`}>
        Total: {total} {requireSum100 ? "(must equal 100)" : "(each 0-100)"}
      </p>
      {error && <p className="text-sm text-signal-red">{error}</p>}
      {status && <p className="text-sm text-signal-green">{status}</p>}
      <button onClick={save} disabled={!valid} className="btn-primary mt-3 disabled:opacity-40">Save Weights</button>
    </div>
  );
}

export default function AdminScannerPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Scanner & Risk Settings</h1>
      <p className="mt-1 text-sm text-ink-500">
        Both scoring engines remain fully deterministic — these weights are the only thing AI never touches.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <WeightEditor title="Gem Scanner Weights" labels={SCANNER_LABELS} apiPath="/api/admin/scanner-weights" requireSum100 />
        <WeightEditor title="Risk Scanner Penalty Weights" labels={RISK_LABELS} apiPath="/api/admin/risk-weights" requireSum100={false} />
      </div>
    </div>
  );
}
