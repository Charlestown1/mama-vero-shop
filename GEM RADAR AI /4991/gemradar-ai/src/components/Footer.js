import Link from "next/link";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/features", label: "Features" },
  { href: "/disclaimer", label: "Risk Disclaimer" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" }
];

export default function Footer() {
  return (
    <footer className="border-t border-base-700/60 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 text-center text-xs text-ink-500 sm:flex-row sm:justify-between sm:text-left">
        <p>© {new Date().getFullYear()} GemRadar AI. Not financial advice.</p>
        <nav className="flex flex-wrap justify-center gap-4">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-ink-100">{l.label}</Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
