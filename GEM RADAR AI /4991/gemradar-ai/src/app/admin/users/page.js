"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminUsersPage() {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [page, plan, status]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (search) params.set("search", search);
    if (plan) params.set("plan", plan);
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/users?${params.toString()}`);
    const json = await res.json();
    if (json.success) setData(json.data);
    setLoading(false);
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Users</h1>

      <div className="card mt-4 flex flex-wrap gap-2 p-4">
        <input
          placeholder="Search email/username/name" className="input-field flex-1"
          value={search} onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (setPage(1), load())}
        />
        <select className="input-field w-auto" value={plan} onChange={(e) => { setPlan(e.target.value); setPage(1); }}>
          <option value="">All plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="pro_plus">Pro+</option>
        </select>
        <select className="input-field w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <button onClick={() => { setPage(1); load(); }} className="btn-primary text-sm">Search</button>
      </div>

      {loading && <p className="mt-4 text-sm text-ink-500">Loading...</p>}

      {data && (
        <>
          <div className="card mt-4 divide-y divide-base-700/60">
            {data.users.map((u) => (
              <Link key={u._id} href={`/admin/users/${u._id}`} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm hover:bg-base-800">
                <div>
                  <p className="font-medium">{u.email}</p>
                  <p className="text-xs text-ink-500">@{u.username} · {u.role}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gold-500 capitalize">{u.subscriptionTier.replace("_", "+")}</span>
                  {u.isSuspended && <span className="text-xs text-signal-red">Suspended</span>}
                  <span className="text-xs text-ink-500">{new Date(u.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
            {data.users.length === 0 && <p className="p-4 text-sm text-ink-500">No users match this filter.</p>}
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
