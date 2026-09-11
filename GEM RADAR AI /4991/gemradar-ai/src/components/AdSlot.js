"use client";
import { useState, useEffect } from "react";

// Fetches once per mount (empty dependency array) — a component re-render
// never triggers another fetch/impression; the server additionally
// deduplicates repeat impressions from the same viewer within a short window
// (see adServingService.recordImpression). Renders nothing when no active,
// eligible campaign exists for this placement — never a fake/sample ad.
export default function AdSlot({ placement }) {
  const [ad, setAd] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/ads?placement=${encodeURIComponent(placement)}`);
        const data = await res.json();
        if (!cancelled && data.success) setAd(data.data.ad);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [placement]);

  async function handleClick() {
    const res = await fetch(`/api/ads/${ad.id}/click`, { method: "POST" });
    const data = await res.json();
    if (data.success) window.open(data.data.url, "_blank", "noopener,noreferrer");
  }

  if (!loaded || !ad) return null;

  return (
    <button onClick={handleClick} className="card flex w-full items-center gap-3 p-4 text-left hover:border-gold-500/50">
      {ad.imageUrl && <img src={ad.imageUrl} alt={ad.title} className="h-12 w-12 rounded-lg object-cover" />}
      <div className="flex-1">
        <p className="text-xs uppercase tracking-wide text-ink-700">Sponsored{ad.advertiserName ? ` · ${ad.advertiserName}` : ""}</p>
        <p className="font-medium">{ad.title}</p>
        {ad.description && <p className="text-sm text-ink-500">{ad.description}</p>}
      </div>
      <span className="btn-secondary shrink-0 text-xs">{ad.ctaText}</span>
    </button>
  );
}
