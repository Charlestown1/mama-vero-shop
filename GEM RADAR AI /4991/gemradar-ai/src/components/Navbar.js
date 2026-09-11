"use client";
import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";

const NAV_LINKS = [
  { href: "/scanner", label: "Scanner" },
  { href: "/research", label: "Research" },
  { href: "/market", label: "Market" },
  { href: "/pricing", label: "Pricing" }
];

export default function Navbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-base-700/60 bg-base-900/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="font-display text-lg font-bold tracking-tight text-ink-100">
          GemRadar <span className="text-gold-500">AI</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-ink-300 hover:text-ink-100">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {session ? (
            <>
              <Link href="/dashboard" className="btn-secondary text-sm">Dashboard</Link>
              <Link href="/subscription" className="text-sm text-ink-500 hover:text-ink-100">Billing</Link>
              <Link href="/settings" className="text-sm text-ink-500 hover:text-ink-100">Settings</Link>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="text-sm text-ink-500 hover:text-ink-100">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-ink-300 hover:text-ink-100">Log in</Link>
              <Link href="/signup" className="btn-primary text-sm">Get Started</Link>
            </>
          )}
        </div>

        <button className="md:hidden text-ink-100" onClick={() => setOpen(!open)} aria-label="Menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-base-700/60 px-5 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-ink-300">
                {l.label}
              </Link>
            ))}
            {session ? (
              <>
                <Link href="/dashboard" onClick={() => setOpen(false)} className="text-ink-100">Dashboard</Link>
                <Link href="/settings" onClick={() => setOpen(false)} className="text-ink-300">Settings</Link>
                <button onClick={() => signOut({ callbackUrl: "/" })} className="text-left text-ink-500">Sign out</button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="text-ink-300">Log in</Link>
                <Link href="/signup" onClick={() => setOpen(false)} className="btn-primary w-fit text-sm">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
