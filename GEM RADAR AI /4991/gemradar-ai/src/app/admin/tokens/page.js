"use client";
import { useState, useEffect } from "react";

export default function AdminTokensPage() {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [flag, setFlag] = useState("");
  const [page, setPage] = useState(1);
  const [notesDraft, setNotesDraft] = useState({});

  useEffect(() => { load(); }, [page, flag]);

  async function load() {
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (search) params.set("search", search);
    if (flag) params.set("flag", flag);
    const res = await fetch(`/api/admin/tokens?${params.toString()}`);
    const json = await res.json();
    if (json.success) setData(json.data);
  }

  async function toggle(tokenId, field, value) {
    await fetch(`/api/admin/tokens/${tokenId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: value })
    });
    load();
  }

  async function saveNotes(tokenId) {
    await fetch(`/api/admin/tokens/${tokenId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adminNotes: notesDraft[tokenId] || "" })
    });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Tokens</h1>

      <div className="card mt-4 flex flex-wrap gap-2 p-4">
        <input
          placeholder="Search symbol/name/address" className="input-field flex-1"
          value={search} onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (setPage(1), load())}
        />
        <select className="input-field w-auto" value={flag} onChange={(e) => { setFlag(e.target.value); setPage(1); }}>
          <option value="">All</option>
          <option value="featured">Featured</option>
          <option value="blacklisted">Blacklisted</option>
          <option value="suspicious">Suspicious</option>
        </select>
        <button onClick={() => { setPage(1); load(); }} className="btn-primary text-sm">Search</button>
      </div>

      {data && (
        <>
          <div className="mt-4 space-y-3">
            {data.tokens.map((t) => (
              <div key={t._id} className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-display font-semibold">${t.symbol} <span className="text-xs text-ink-500">{t.blockchain}</span></p>
                    <p className="break-all text-xs text-ink-700">{t.address}</p>
                  </div>
                  <div className="text-sm">
                    <span className="text-gold-500">Opp: {t.latestOpportunityScore ?? "—"}</span>
                    <span className="ml-3 text-ink-500">Risk: {t.latestRiskLevel || "—"}</span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <button onClick={() => toggle(t._id, "isFeatured", !t.isFeatured)} className={t.isFeatured ? "btn-primary" : "btn-secondary"}>
                    {t.isFeatured ? "Unfeature" : "Feature"}
                  </button>
                  <button onClick={() => toggle(t._id, "isSuspicious", !t.isSuspicious)} className={t.isSuspicious ? "btn-primary" : "btn-secondary"}>
                    {t.isSuspicious ? "Clear Suspicious" : "Mark Suspicious"}
                  </button>
                  <button onClick={() => toggle(t._id, "isBlacklisted", !t.isBlacklisted)} className={t.isBlacklisted ? "bg-signal-red text-white rounded-lg px-3 py-1" : "btn-secondary"}>
                    {t.isBlacklisted ? "Remove from Blacklist" : "Blacklist from Scanner"}
                  </button>
                </div>

                <div className="mt-3 flex gap-2">
                  <input
                    placeholder="Admin notes / warnings"
                    className="input-field flex-1 text-sm"
                    defaultValue={t.adminNotes || ""}
                    onChange={(e) => setNotesDraft((d) => ({ ...d, [t._id]: e.target.value }))}
                  />
                  <button onClick={() => saveNotes(t._id)} className="btn-secondary text-xs">Save</button>
                </div>
              </div>
            ))}
            {data.tokens.length === 0 && <p className="text-sm text-ink-500">No tokens found.</p>}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary text-xs disabled:opacity-40">Previous</button>
            <span className="text-ink-500">Page {data.page} of {data.totalPages || 1}</span>
            <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="btn-secondary text-xs disabled:opacity-40">Next</button>
          </div>
        </>
      )}
    </div>
  );
}
