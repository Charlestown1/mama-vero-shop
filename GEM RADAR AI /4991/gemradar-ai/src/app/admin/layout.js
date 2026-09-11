"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

const SECTIONS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/tokens", label: "Tokens" },
  { href: "/admin/scanner", label: "Scanner & Risk" },
  { href: "/admin/announcements", label: "Announcements" },
  { href: "/admin/advertisements", label: "Advertisements" },
  { href: "/admin/logs", label: "Admin Logs" },
  { href: "/admin/settings", label: "System Settings" }
];

// Server-side protection already lives in middleware.js (role check on every
// /admin/* request) and in every /api/admin/* route via requireAdminApi() —
// this layout's nav is a convenience, not the security boundary.
export default function AdminLayout({ children }) {
  const pathname = usePathname();

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-7xl px-5 py-6">
        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-base-700/60 pb-2 md:flex-wrap">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
                pathname === s.href ? "bg-gold-500/10 text-gold-500" : "text-ink-300 hover:text-ink-100"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
        {children}
      </div>
    </>
  );
}
