"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();

    if (!data.success) {
      setError(data.message);
      setLoading(false);
      return;
    }

    const loginRes = await signIn("credentials", {
      email: form.email, password: form.password, redirect: false
    });
    setLoading(false);
    if (loginRes?.error) {
      router.push("/login");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-sm px-5 py-20">
        <h1 className="font-display text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-ink-500">Start scanning for free.</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <input required placeholder="Full name" className="input-field"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input required placeholder="Username" className="input-field"
            value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input required type="email" placeholder="Email" className="input-field"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input required type="password" placeholder="Password" className="input-field"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <input required type="password" placeholder="Confirm password" className="input-field"
            value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
          {error && <p className="text-sm text-signal-red">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="btn-secondary mt-4 w-full"
        >
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-ink-500">
          Already have an account? <Link href="/login" className="text-gold-500">Log in</Link>
        </p>
      </main>
    </>
  );
}
