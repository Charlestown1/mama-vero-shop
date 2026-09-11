"use client";
import { useState, useEffect } from "react";

const RANGES = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "all", label: "All time" }
];

export default function AdminDashboardPage() {
  const [range, setRange] = useState("7d");
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/admin/dashboard?range=${range}`);
      const data = await res.json();
      setLoading(false);
      if (!data.success) { setError(data.message); return; }
      setStats(data.data);
    })();
  }, [range]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={range === r.key ? "btn-primary text-xs" : "btn-secondary text-xs"}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-signal-red">{error}</p>}
      {loading && <p className="mt-6 text-sm text-ink-500">Loading...</p>}

      {stats && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="card p-4"><p className="text-xs text-ink-500">Total Users</p><p className="font-display text-2xl font-bold">{stats.users.total}</p></div>
            <div className="card p-4"><p className="text-xs text-ink-500">New Users</p><p className="font-display text-2xl font-bold text-signal-green">{stats.users.new}</p></div>
            <div className="card p-4"><p className="text-xs text-ink-500">Free</p><p className="font-display text-2xl font-bold">{stats.users.free}</p></div>
            <div className="card p-4"><p className="text-xs text-ink-500">Pro</p><p className="font-display text-2xl font-bold text-gold-500">{stats.users.pro}</p></div>
            <div className="card p-4"><p className="text-xs text-ink-500">Pro+</p><p className="font-display text-2xl font-bold text-gold-500">{stats.users.proPlus}</p></div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="card p-4"><p className="text-xs text-ink-500">Active Subs</p><p className="font-display text-xl font-bold">{stats.subscriptions.active}</p></div>
            <div className="card p-4"><p className="text-xs text-ink-500">Canceled Subs</p><p className="font-display text-xl font-bold">{stats.subscriptions.canceled}</p></div>
            <div className="card p-4"><p className="text-xs text-ink-500">Active Alerts</p><p className="font-display text-xl font-bold">{stats.activity.activeAlerts}</p></div>
            <div className="card p-4"><p className="text-xs text-ink-500">Research Reports</p><p className="font-display text-xl font-bold">{stats.activity.researchReports}</p></div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="card p-4"><p className="text-xs text-ink-500">Scanner Runs</p><p className="font-display text-xl font-bold">{stats.activity.scannerRuns}</p></div>
            <div className="card p-4"><p className="text-xs text-ink-500">Watchlists Created</p><p className="font-display text-xl font-bold">{stats.activity.watchlistsCreated}</p></div>
            <div className="card p-4"><p className="text-xs text-ink-500">Wallet Activity</p><p className="font-display text-xl font-bold">{stats.activity.walletActivityRecorded}</p></div>
            <div className="card p-4">
              <p className="text-xs text-ink-500">Ad CTR</p>
              <p className="font-display text-xl font-bold">{stats.ads.ctr}%</p>
              <p className="text-xs text-ink-700">{stats.ads.impressions} impressions · {stats.ads.clicks} clicks</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="card p-4">
              <h3 className="font-display font-semibold">Recent Payments</h3>
              {stats.recentPayments.length === 0 ? (
                <p className="mt-2 text-sm text-ink-500">No payments in this range.</p>
              ) : (
                <div className="mt-2 space-y-2 text-sm">
                  {stats.recentPayments.map((p) => (
                    <div key={p._id} className="flex justify-between">
                      <span>{p.user?.email || "Unknown"}</span>
                      <span className={p.status === "succeeded" ? "text-signal-green" : "text-signal-red"}>
                        ${p.amount} · {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-4">
              <h3 className="font-display font-semibold">Recent Admin Activity</h3>
              {stats.recentAdminLogs.length === 0 ? (
                <p className="mt-2 text-sm text-ink-500">No admin activity yet.</p>
              ) : (
                <div className="mt-2 space-y-2 text-sm">
                  {stats.recentAdminLogs.map((l) => (
                    <div key={l._id} className="flex justify-between">
                      <span>{l.admin?.email || "Unknown"}</span>
                      <span className="text-ink-500">{l.action}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
