"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";

const CHAINS = ["Ethereum", "BNB Chain", "Solana", "Base", "Arbitrum", "Polygon", "Avalanche"];

export default function SmartMoneyPage() {
  const [wallets, setWallets] = useState([]);
  const [form, setForm] = useState({ address: "", blockchain: "Ethereum", label: "" });
  const [activityByWallet, setActivityByWallet] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadWallets(); }, []);

  async function loadWallets() {
    const res = await fetch("/api/smart-money/wallets");
    const data = await res.json();
    if (data.success) setWallets(data.data.wallets);
  }

  async function addWallet(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/smart-money/wallets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    setLoading(false);
    if (!data.success) { setError(data.message); return; }
    setForm({ address: "", blockchain: "Ethereum", label: "" });
    loadWallets();
  }

  async function removeWallet(id) {
    await fetch(`/api/smart-money/wallets/${id}`, { method: "DELETE" });
    loadWallets();
  }

  async function toggleTracked(wallet) {
    await fetch(`/api/smart-money/wallets/${wallet._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isTracked: !wallet.isTracked })
    });
    loadWallets();
  }

  async function loadActivity(walletId) {
    const res = await fetch(`/api/smart-money/wallets/${walletId}/activity`);
    const data = await res.json();
    if (data.success) {
      setActivityByWallet((prev) => ({ ...prev, [walletId]: data.data }));
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 py-10">
        <h1 className="font-display text-2xl font-bold">Smart Money / Whale Tracker</h1>
        <p className="mt-1 text-sm text-ink-500">
          Track wallets you care about. Activity only appears once an on-chain data source is connected —
          nothing here is simulated.
        </p>

        <form onSubmit={addWallet} className="card mt-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <input
            placeholder="Wallet address" className="input-field flex-1"
            value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <select
            className="input-field sm:w-40" value={form.blockchain}
            onChange={(e) => setForm({ ...form, blockchain: e.target.value })}
          >
            {CHAINS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            placeholder="Label (optional)" className="input-field sm:w-40"
            value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}
          />
          <button type="submit" disabled={loading} className="btn-primary sm:w-auto">
            {loading ? "Adding..." : "Follow Wallet"}
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-signal-red">{error}</p>}

        <div className="mt-6 space-y-3">
          {wallets.length === 0 && (
            <div className="card p-6 text-center text-sm text-ink-500">
              You&apos;re not tracking any wallets yet.
            </div>
          )}
          {wallets.map((w) => {
            const activity = activityByWallet[w._id];
            return (
              <div key={w._id} className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{w.label || "Unnamed wallet"}</p>
                    <p className="break-all text-xs text-ink-500">{w.address} · {w.blockchain}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => loadActivity(w._id)} className="btn-secondary text-xs">
                      View Activity
                    </button>
                    <button onClick={() => toggleTracked(w)} className="btn-secondary text-xs">
                      {w.isTracked ? "Pause" : "Resume"}
                    </button>
                    <button onClick={() => removeWallet(w._id)} className="text-xs text-signal-red">
                      Remove
                    </button>
                  </div>
                </div>

                {activity && (
                  <div className="mt-3 border-t border-base-700/60 pt-3 text-sm">
                    {activity.activity.length === 0 ? (
                      <p className="text-ink-700">
                        No activity recorded yet — connect an on-chain activity provider
                        (set <code>ONCHAIN_API_KEY</code>) to start ingesting real transactions for this wallet.
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {activity.activity.map((a) => (
                          <li key={a._id}>
                            {a.type} — {a.token?.symbol || "Unknown token"} — ${a.amountUsd?.toLocaleString() || "Data unavailable"}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
