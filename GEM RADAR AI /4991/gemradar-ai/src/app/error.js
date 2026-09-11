"use client";
import { useEffect } from "react";

// Next.js App Router error boundary. Deliberately shows a generic message —
// never the raw error stack/message, which could leak implementation
// details (query shapes, file paths, provider error text). The real error
// is only sent to the server-side logger.
export default function GlobalErrorBoundary({ error, reset }) {
  useEffect(() => {
    console.error("Unhandled client error:", error?.digest || error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-5 text-center">
      <h1 className="font-display text-2xl font-bold text-signal-red">Something went wrong</h1>
      <p className="mt-2 text-sm text-ink-500">
        An unexpected error occurred. Nothing was lost — try again, or head back to the dashboard.
      </p>
      <button onClick={() => reset()} className="btn-primary mt-6">Try Again</button>
    </main>
  );
}
