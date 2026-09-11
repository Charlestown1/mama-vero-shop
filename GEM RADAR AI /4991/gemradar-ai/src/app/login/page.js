"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { ...form, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError(res.error);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-sm px-5 py-20">
        <h1 className="font-display text-2xl font-bold">Log in</h1>
        <p className="mt-1 text-sm text-ink-500">Welcome back to GemRadar AI.</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <input
            type="email" required placeholder="Email" className="input-field"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password" required placeholder="Password" className="input-field"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {error && <p className="text-sm text-signal-red">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Signing in..." : "Log in"}
          </button>
        </form>

        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="btn-secondary mt-4 w-full"
        >
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-ink-500">
          No account? <Link href="/signup" className="text-gold-500">Sign up</Link>
        </p>
      </main>
    </>
  );
}
