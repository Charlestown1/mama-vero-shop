"use client";
import { useEffect, useState } from "react";

// Registers the app-shell service worker and shows a small, honest offline
// indicator. This never claims cached data is live — see OfflineBanner below
// and the fetch handler in public/sw.js for what is and isn't cached.
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failing (e.g. unsupported browser, dev environment
        // quirks) should never break the app — it's a progressive enhancement.
      });
    }
  }, []);

  return <OfflineBanner />;
}

function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="sticky top-0 z-50 bg-signal-red/90 px-4 py-2 text-center text-xs font-medium text-white">
      You&apos;re offline. Prices, scores, and reports shown now may be out of date — nothing here is live until you reconnect.
    </div>
  );
}
