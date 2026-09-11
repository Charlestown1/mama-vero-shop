"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function SubscriptionPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/subscription");
    const json = await res.json();
    if (json.success) setData(json.data);
    setLoading(false);
  }

  async function openPortal() {
    setError("");
    setPortalLoading(true);
    const res = await fetch("/api/subscription/portal", { method: "POST" });
    const json = await res.json();
    setPortalLoading(false);
    if (!json.success) { setError(json.message); return; }
    window.location.href = json.data.url;
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 py-10">
        <h1 className="font-display text-2xl font-bold">Billing & Subscription</h1>

        {loading && <p className="mt-6 text-sm text-ink-500">Loading...</p>}

        {data && (
          <div className="mt-6 space-y-4">
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display text-xl font-bold text-gold-500">{data.planLabel}</p>
                  <p className="text-sm text-ink-500 capitalize">Status: {data.status}</p>
                </div>
                <Link href="/pricing" className="btn-secondary text-sm">Change plan</Link>
              </div>

              {data.currentPeriodEnd && (
                <p className="mt-3 text-sm text-ink-300">
                  {data.cancelAtPeriodEnd ? "Access ends" : "Renews"} on{" "}
                  {new Date(data.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}

              {data.hasBillingAccount && (
                <button onClick={openPortal} disabled={portalLoading} className="btn-primary mt-4">
                  {portalLoading ? "Opening..." : "Manage Billing"}
                </button>
              )}
            </div>

            <div className="card p-5">
              <h3 className="font-display font-semibold">Today&apos;s Usage</h3>
              <div className="mt-2 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Gem scans</span>
                  <span>{data.usageToday.scan || 0} / {data.limits.scansPerDay === Infinity ? "∞" : data.limits.scansPerDay}</span>
                </div>
                <div className="flex justify-between">
                  <span>AI research reports</span>
                  <span>{data.usageToday.ai_research || 0} / {data.limits.aiResearchPerDay === Infinity ? "∞" : data.limits.aiResearchPerDay}</span>
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-signal-red">{error}</p>}
          </div>
        )}
      </main>
    </>
  );
}
