"use client";
import { useState, useEffect } from "react";

// Renders admin-created announcements for a placement. Content is inserted
// as plain text (never dangerouslySetInnerHTML) — announcements are
// sanitized server-side on save and rendered as text here, so there is no
// path for an admin-entered announcement to execute as markup/script.
export default function AnnouncementBanner({ placement }) {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/announcements?placement=${encodeURIComponent(placement)}`);
      const data = await res.json();
      if (data.success) setAnnouncements(data.data.announcements);
    })();
  }, [placement]);

  const visible = announcements.filter((a) => !dismissed.includes(a._id));
  if (visible.length === 0) return null;

  return (
    <div className="mx-auto max-w-6xl px-5 pt-4">
      {visible.map((a) => (
        <div key={a._id} className="card mb-3 flex items-center justify-between gap-3 border-gold-500/30 p-3 text-sm">
          <div>
            <span className="font-semibold text-gold-500">{a.title}</span>
            <span className="ml-2 text-ink-300">{a.message}</span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {a.ctaUrl && a.ctaText && (
              <a href={a.ctaUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs">
                {a.ctaText}
              </a>
            )}
            <button onClick={() => setDismissed((d) => [...d, a._id])} className="text-ink-700 hover:text-ink-100">✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}
