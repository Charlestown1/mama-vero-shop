"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import AdSlot from "@/components/AdSlot";

function fmt(n) {
  if (n === null || n === undefined) return "—";
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      if (data.success) setSnapshot(data.data);
      setLoading(false);
    })();
  }, []);

  const stats = [
    { label: "Portfolio value", value: snapshot ? fmt(snapshot.portfolioValue) : "—" },
    { label: "Watchlist tokens", value: snapshot?.watchlistTokenCount ?? "—" },
    { label: "High-risk detected", value: snapshot?.highRiskDetected ?? "—" },
    { label: "Active alerts", value: snapshot?.activeAlerts ?? "—" }
  ];

  return (
    <>
      <Navbar />
      <AnnouncementBanner placement="dashboard" />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="font-display text-2xl font-bold">
          Welcome back{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Plan: <span className="text-gold-500 capitalize">{session?.user?.subscriptionTier || "free"}</span>
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="card p-4">
              <p className="font-display text-2xl font-bold">{loading ? "…" : stat.value}</p>
              <p className="text-xs text-ink-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Link href="/scanner" className="card p-5 hover:border-gold-500/50">
            <h3 className="font-display font-semibold">Run the Gem Scanner</h3>
            <p className="mt-1 text-sm text-ink-500">Filter tokens by momentum, liquidity and whale activity.</p>
          </Link>
          <Link href="/research" className="card p-5 hover:border-gold-500/50">
            <h3 className="font-display font-semibold">Deep-analyze a token</h3>
            <p className="mt-1 text-sm text-ink-500">Get a structured AI research report.</p>
          </Link>
          <Link href="/watchlist" className="card p-5 hover:border-gold-500/50">
            <h3 className="font-display font-semibold">View your watchlist</h3>
            <p className="mt-1 text-sm text-ink-500">Track the tokens you care about.</p>
          </Link>
        </div>

        <div className="mt-8">
          <AdSlot placement="dashboard" />
        </div>

        {snapshot && (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="card p-5">
              <h3 className="font-display font-semibold">Top Opportunities</h3>
              {snapshot.topOpportunities.length === 0 ? (
                <p className="mt-2 text-sm text-ink-500">Run a scan to populate this.</p>
              ) : (
                <div className="mt-2 space-y-2 text-sm">
                  {snapshot.topOpportunities.map((t, i) => (
                    <div key={i} className="flex justify-between">
                      <span>${t.symbol}</span>
                      <span className="text-gold-500">{t.opportunityScore}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-5">
              <h3 className="font-display font-semibold">Recent Research Reports</h3>
              {snapshot.recentReports.length === 0 ? (
                <p className="mt-2 text-sm text-ink-500">No reports yet.</p>
              ) : (
                <div className="mt-2 space-y-2 text-sm">
                  {snapshot.recentReports.map((r) => (
                    <div key={r._id} className="flex justify-between">
                      <span>${r.tokenSnapshot?.symbol || "Unknown"}</span>
                      <span>{r.classification?.replace(/_/g, " ")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
