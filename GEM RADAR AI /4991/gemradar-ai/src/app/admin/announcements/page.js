"use client";
import { useState, useEffect } from "react";

const PLACEMENTS = ["homepage", "dashboard", "scanner", "research", "token_page", "global_banner"];
const EMPTY_FORM = { title: "", message: "", ctaText: "", ctaUrl: "", placement: "global_banner", priority: 0, targetPlan: "all", startDate: "", activeUntil: "" };

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/admin/announcements");
    const data = await res.json();
    if (data.success) setAnnouncements(data.data.announcements);
  }

  async function create(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/announcements", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form)
    });
    const data = await res.json();
    if (!data.success) { setError(data.message); return; }
    setForm(EMPTY_FORM);
    load();
  }

  async function toggleActive(a) {
    await fetch(`/api/admin/announcements/${a._id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !a.isActive })
    });
    load();
  }

  async function remove(id) {
    await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Announcements</h1>

      <form onSubmit={create} className="card mt-4 flex flex-col gap-3 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <input placeholder="Title" className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <select className="input-field" value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })}>
            {PLACEMENTS.map((p) => <option key={p} value={p}>{p.replace("_", " ")}</option>)}
          </select>
        </div>
        <textarea placeholder="Message" className="input-field" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        <div className="grid gap-3 sm:grid-cols-3">
          <input placeholder="CTA text (optional)" className="input-field" value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} />
          <input placeholder="CTA URL (optional)" className="input-field" value={form.ctaUrl} onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })} />
          <select className="input-field" value={form.targetPlan} onChange={(e) => setForm({ ...form, targetPlan: e.target.value })}>
            <option value="all">All plans</option>
            <option value="free">Free only</option>
            <option value="pro">Pro only</option>
            <option value="pro_plus">Pro+ only</option>
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <input type="number" placeholder="Priority" className="input-field" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
          <input type="date" className="input-field" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          <input type="date" className="input-field" value={form.activeUntil} onChange={(e) => setForm({ ...form, activeUntil: e.target.value })} />
        </div>
        {error && <p className="text-sm text-signal-red">{error}</p>}
        <button className="btn-primary">Create Announcement</button>
      </form>

      <div className="card mt-4 divide-y divide-base-700/60">
        {announcements.map((a) => (
          <div key={a._id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
            <div>
              <p className="font-medium">{a.title} <span className="text-xs text-ink-500">({a.placement})</span></p>
              <p className="text-ink-500">{a.message}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggleActive(a)} className="btn-secondary text-xs">{a.isActive ? "Deactivate" : "Activate"}</button>
              <button onClick={() => remove(a._id)} className="text-xs text-signal-red">Delete</button>
            </div>
          </div>
        ))}
        {announcements.length === 0 && <p className="p-4 text-sm text-ink-500">No announcements yet.</p>}
      </div>
    </div>
  );
}
