export const metadata = { title: "You're offline — GemRadar AI", robots: { index: false, follow: false } };

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 text-center">
      <h1 className="font-display text-2xl font-bold">You&apos;re offline</h1>
      <p className="mt-3 text-sm text-ink-500">
        GemRadar AI needs a connection for live prices, scores, and AI research — none of that is
        safe to show cached. Reconnect and reload to continue.
      </p>
    </main>
  );
}
