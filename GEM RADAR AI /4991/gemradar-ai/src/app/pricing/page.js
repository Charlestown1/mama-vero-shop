"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/subscription/plans");
      const data = await res.json();
      if (data.success) {
        setPlans(data.data.plans);
        setCurrentPlan(data.data.currentPlan);
      }
    })();
  }, []);

  async function handleUpgrade(planKey) {
    setError("");
    if (!session) { router.push("/signup"); return; }
    if (planKey === "free") return;

    setLoadingPlan(planKey);
    const res = await fetch("/api/subscription/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planKey })
    });
    const data = await res.json();
    setLoadingPlan(null);

    if (!data.success) { setError(data.message); return; }
    window.location.href = data.data.url;
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 py-16">
        <h1 className="text-center font-display text-3xl font-bold">Pricing</h1>
        <p className="mt-2 text-center text-sm text-ink-500">
          Plans, limits and prices are all served from one server-side configuration.
        </p>

        {error && <p className="mt-4 text-center text-sm text-signal-red">{error}</p>}

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {plans.map((p) => {
            const isCurrent = currentPlan === p.key;
            return (
              <div key={p.key} className={`card flex flex-col p-6 ${isCurrent ? "border-gold-500" : ""}`}>
                {isCurrent && <span className="mb-2 w-fit rounded-full bg-gold-500/10 px-3 py-1 text-xs text-gold-500">Current plan</span>}
                <h3 className="font-display text-lg font-semibold">{p.label}</h3>
                <p className="mt-2 font-display text-3xl font-bold text-gold-500">
                  ${p.priceUsd}
                  {p.interval && <span className="text-sm text-ink-500">/{p.interval}</span>}
                </p>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-ink-300">
                  {p.features.map((f) => <li key={f}>• {f}</li>)}
                </ul>
                <button
                  onClick={() => handleUpgrade(p.key)}
                  disabled={isCurrent || loadingPlan === p.key}
                  className={isCurrent ? "btn-secondary mt-6" : "btn-primary mt-6"}
                >
                  {isCurrent ? "Current Plan" : loadingPlan === p.key ? "Redirecting..." : p.key === "free" ? "Get started" : "Upgrade"}
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
