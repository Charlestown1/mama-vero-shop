"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";

const METRICS = [
  { value: "price", label: "Price (USD)", type: "price" },
  { value: "priceChange24h", label: "24h Price Change %", type: "price_pct" },
  { value: "volume24h", label: "24h Volume", type: "volume" },
  { value: "holderGrowthPct", label: "Holder Growth %", type: "holder_growth" },
  { value: "opportunityScore", label: "Opportunity Score", type: "score" },
  { value: "riskScore", label: "Risk Score", type: "risk_score" }
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [form, setForm] = useState({ tokenSymbol: "", metric: "price", operator: "gt", value: "", channels: ["in_app"] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/alerts");
    const data = await res.json();
    if (data.success) setAlerts(data.data.alerts);
    setLoading(false);
  }

  function toggleChannel(channel) {
    setForm((f) => ({
      ...f,
      channels: f.channels.includes(channel) ? f.channels.filter((c) => c !== channel) : [...f.channels, channel]
    }));
  }

  async function createAlert(e) {
    e.preventDefault();
    setError("");
    const metricDef = METRICS.find((m) => m.value === form.metric);
    const res = await fetch("/api/alerts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: metricDef.type,
        tokenSymbol: form.tokenSymbol,
        metric: form.metric,
        operator: form.operator,
        value: Number(form.value),
        channels: form.channels
      })
    });
    const data = await res.json();
    if (!data.success) { setError(data.message); return; }
    setForm({ tokenSymbol: "", metric: "price", operator: "gt", value: "", channels: ["in_app"] });
    load();
  }

  async function toggleActive(alert) {
    await fetch(`/api/alerts/${alert._id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !alert.isActive })
    });
    load();
  }

  async function remove(id) {
    await fetch(`/api/alerts/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="font-display text-2xl font-bold">Alerts</h1>
        <p className="mt-1 text-sm text-ink-500">
          Alerts are evaluated on a schedule by a background job — see Settings for how to enable
          Telegram delivery. Nothing triggers instantly on this page.
        </p>

        <form onSubmit={createAlert} className="card mt-6 flex flex-col gap-3 p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <input placeholder="Symbol" className="input-field" value={form.tokenSymbol} onChange={(e) => setForm({ ...form, tokenSymbol: e.target.value })} />
            <select className="input-field" value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })}>
              {METRICS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select className="input-field" value={form.operator} onChange={(e) => setForm({ ...form, operator: e.target.value })}>
              <option value="gt">greater than</option>
              <option value="gte">≥</option>
              <option value="lt">less than</option>
              <option value="lte">≤</option>
              <option value="eq">equals</option>
            </select>
            <input placeholder="Threshold" type="number" step="any" className="input-field" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
          </div>
          <div className="flex gap-4 text-sm">
            {["in_app", "email", "telegram"].map((c) => (
              <label key={c} className="flex items-center gap-2">
                <input type="checkbox" checked={form.channels.includes(c)} onChange={() => toggleChannel(c)} />
                {c.replace("_", "-")}
              </label>
            ))}
          </div>
          <button className="btn-primary">Create Alert</button>
        </form>

        {error && <p className="mt-3 text-sm text-signal-red">{error}</p>}
        {loading && <p className="mt-6 text-sm text-ink-500">Loading...</p>}

        <div className="card mt-6 divide-y divide-base-700/60">
          {alerts.length === 0 && !loading && <p className="p-4 text-sm text-ink-500">No alerts yet.</p>}
          {alerts.map((a) => (
            <div key={a._id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
              <span>
                {a.tokenSymbol || "—"} · {a.condition.metric} {a.condition.operator} {a.condition.value}
              </span>
              <span className="text-ink-500">Triggered {a.triggerCount || 0}x</span>
              <div className="flex gap-2">
                <button onClick={() => toggleActive(a)} className="btn-secondary text-xs">
                  {a.isActive ? "Disable" : "Enable"}
                </button>
                <button onClick={() => remove(a._id)} className="text-xs text-signal-red">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
