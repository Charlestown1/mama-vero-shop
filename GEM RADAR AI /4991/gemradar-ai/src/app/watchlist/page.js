"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";

function fmt(n, opts = {}) {
  if (n === null || n === undefined) return "Data unavailable";
  if (opts.pct) return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(4)}`;
}

export default function WatchlistPage() {
  const [lists, setLists] = useState([]);
  const [newListName, setNewListName] = useState("");
  const [addForm, setAddForm] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/watchlists");
    const data = await res.json();
    if (data.success) setLists(data.data.watchlists);
    setLoading(false);
  }

  async function createList(e) {
    e.preventDefault();
    if (!newListName.trim()) return;
    const res = await fetch("/api/watchlists", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newListName })
    });
    const data = await res.json();
    if (!data.success) { setError(data.message); return; }
    setNewListName("");
    load();
  }

  async function renameList(id, name) {
    await fetch(`/api/watchlists/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name })
    });
    load();
  }

  async function deleteList(id) {
    await fetch(`/api/watchlists/${id}`, { method: "DELETE" });
    load();
  }

  async function addToken(listId, e) {
    e.preventDefault();
    setError("");
    const form = addForm[listId] || {};
    const res = await fetch(`/api/watchlists/${listId}/items`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form)
    });
    const data = await res.json();
    if (!data.success) { setError(data.message); return; }
    setAddForm((prev) => ({ ...prev, [listId]: {} }));
    load();
  }

  async function removeItem(listId, itemId) {
    await fetch(`/api/watchlists/${listId}/items/${itemId}`, { method: "DELETE" });
    load();
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 py-10">
        <h1 className="font-display text-2xl font-bold">Watchlists</h1>

        <form onSubmit={createList} className="mt-4 flex gap-2">
          <input
            placeholder="New watchlist name" className="input-field"
            value={newListName} onChange={(e) => setNewListName(e.target.value)}
          />
          <button className="btn-primary">Create</button>
        </form>

        {error && <p className="mt-3 text-sm text-signal-red">{error}</p>}
        {loading && <p className="mt-6 text-sm text-ink-500">Loading...</p>}

        <div className="mt-6 space-y-6">
          {lists.map((list) => (
            <div key={list._id} className="card p-4">
              <div className="flex items-center justify-between gap-2">
                <input
                  className="bg-transparent font-display text-lg font-semibold outline-none"
                  defaultValue={list.name}
                  onBlur={(e) => e.target.value !== list.name && renameList(list._id, e.target.value)}
                />
                <button onClick={() => deleteList(list._id)} className="text-xs text-signal-red">Delete list</button>
              </div>

              <form onSubmit={(e) => addToken(list._id, e)} className="mt-3 flex flex-wrap gap-2">
                <input
                  placeholder="Symbol" className="input-field w-24"
                  value={addForm[list._id]?.symbol || ""}
                  onChange={(e) => setAddForm((p) => ({ ...p, [list._id]: { ...p[list._id], symbol: e.target.value } }))}
                />
                <input
                  placeholder="Address (optional)" className="input-field flex-1"
                  value={addForm[list._id]?.address || ""}
                  onChange={(e) => setAddForm((p) => ({ ...p, [list._id]: { ...p[list._id], address: e.target.value } }))}
                />
                <input
                  placeholder="Blockchain" className="input-field w-32"
                  value={addForm[list._id]?.blockchain || ""}
                  onChange={(e) => setAddForm((p) => ({ ...p, [list._id]: { ...p[list._id], blockchain: e.target.value } }))}
                />
                <button className="btn-secondary text-sm">Add</button>
              </form>

              <div className="mt-3 divide-y divide-base-700/60">
                {list.items.length === 0 && <p className="py-3 text-sm text-ink-500">No tokens yet.</p>}
                {list.items.map((item) => (
                  <div key={item._id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <Link href={`/token/${item.token.address}?blockchain=${encodeURIComponent(item.token.blockchain)}`} className="font-medium">
                      ${item.token.symbol}
                    </Link>
                    <span>{fmt(item.price)}</span>
                    <span className={item.priceChange24h > 0 ? "text-signal-green" : item.priceChange24h < 0 ? "text-signal-red" : "text-ink-500"}>
                      {fmt(item.priceChange24h, { pct: true })}
                    </span>
                    <span className="text-gold-500">Opp: {item.opportunityScore ?? "—"}</span>
                    <span className="text-ink-500">{item.riskLevel || "—"}</span>
                    <button onClick={() => removeItem(list._id, item._id)} className="text-ink-700 hover:text-signal-red">Remove</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
