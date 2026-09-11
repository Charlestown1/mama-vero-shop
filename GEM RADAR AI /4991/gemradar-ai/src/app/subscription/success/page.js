"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

// Arriving here means Stripe redirected the browser after checkout — it does
// NOT mean the subscription is confirmed yet. The webhook is the source of
// truth, so this page polls our own /api/subscription a few times to reflect
// what the server has actually recorded rather than assuming success.
export default function SubscriptionSuccessPage() {
  const [status, setStatus] = useState("checking");
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      const res = await fetch("/api/subscription");
      const data = await res.json();
      if (data.success && data.data.effectivePlan !== "free") {
        setPlan(data.data.planLabel);
        setStatus("confirmed");
        clearInterval(interval);
      } else if (attempts >= 6) {
        setStatus("pending");
        clearInterval(interval);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-md px-5 py-20 text-center">
        {status === "checking" && (
          <>
            <h1 className="font-display text-2xl font-bold">Confirming your subscription...</h1>
            <p className="mt-2 text-sm text-ink-500">This usually takes a few seconds while we hear back from Stripe.</p>
          </>
        )}
        {status === "confirmed" && (
          <>
            <h1 className="font-display text-2xl font-bold text-signal-green">You&apos;re on {plan}!</h1>
            <Link href="/dashboard" className="btn-primary mt-6 inline-block">Go to Dashboard</Link>
          </>
        )}
        {status === "pending" && (
          <>
            <h1 className="font-display text-2xl font-bold text-gold-500">Almost there</h1>
            <p className="mt-2 text-sm text-ink-500">
              Payment was received by Stripe, but our system hasn&apos;t confirmed it yet. Check{" "}
              <Link href="/subscription" className="text-gold-500">Billing</Link> in a moment — this
              is expected if the webhook hasn&apos;t reached us yet (e.g. local dev without a public URL).
            </p>
          </>
        )}
      </main>
    </>
  );
}
