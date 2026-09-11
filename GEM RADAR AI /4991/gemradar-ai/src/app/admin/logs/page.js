"use client";
import { useState, useEffect } from "react";

export default function AdminLogsPage() {
  const [data, setData] = useState(null);
  const [action, setAction] = useState("");
  const [since, setSince] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => { load(); }, [page]);

  async function load() {
    const params = new URLSearchParams({ page: String(page), pageSize: "25" });
    if (action) params.set("action", action);
    if (since) params.set("since", since);
    const res = await fetch(`/api/admin/logs?${params.toString()}`);
    const json = await res.json();
    if (json.success) setData(json.data);
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Admin Logs</h1>

      <div className="card mt-4 flex flex-wrap gap-2 p-4">
        <input placeholder="Filter by action (e.g. user.suspend)" className="input-field flex-1" value={action} onChange={(e) => setAction(e.target.value)} />
        <input type="date" className="input-field w-auto" value={since} onChange={(e) => setSince(e.target.value)} />
        <button onClick={() => { setPage(1); load(); }} className="btn-primary text-sm">Filter</button>
      </div>

      {data && (
        <>
          <div className="card mt-4 divide-y divide-base-700/60">
            {data.logs.map((l) => (
              <div key={l._id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                <span className="text-gold-500">{l.action}</span>
                <span>{l.admin?.email || "Unknown admin"}</span>
                <span className="text-ink-500">{l.targetType}{l.targetId ? ` · ${l.targetId}` : ""}</span>
                <span className="text-xs text-ink-700">{new Date(l.createdAt).toLocaleString()}</span>
              </div>
            ))}
            {data.logs.length === 0 && <p className="p-4 text-sm text-ink-500">No matching log entries.</p>}
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
