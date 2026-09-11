import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function SubscriptionCancelPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Checkout canceled</h1>
        <p className="mt-2 text-sm text-ink-500">No charge was made. You can try again anytime.</p>
        <Link href="/pricing" className="btn-primary mt-6 inline-block">Back to Pricing</Link>
      </main>
    </>
  );
}
