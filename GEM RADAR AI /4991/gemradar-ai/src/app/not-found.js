import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata = { title: "Page not found", robots: { index: false, follow: false } };

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-5 text-center">
        <h1 className="font-display text-3xl font-bold text-gold-500">404</h1>
        <p className="mt-2 text-sm text-ink-500">This page doesn&apos;t exist, or you don&apos;t have access to it.</p>
        <Link href="/" className="btn-primary mt-6">Back to Home</Link>
      </main>
    </>
  );
}
