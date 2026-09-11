"use client";
import { useState, useEffect } from "react";

const PLACEMENTS = ["homepage", "dashboard", "scanner", "research_page", "token_page", "sidebar", "top_banner", "bottom_banner"];
const EMPTY_FORM = {
  title: "", advertiserName: "", imageUrl: "", destinationUrl: "", description: "", ctaText: "Learn More",
  placement: "dashboard", priority: 0, maxImpressions: "", maxClicks: "", targetSubscriptionLevel: "all", startDate: "", endDate: ""
};

export default function AdminAdvertisementsPage() {
  const [ads, setAds] = useState([]);
  const [range, setRange] = useState("all");
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, [range]);

  async function load() {
    const res = await fetch(`/api/admin/advertisements?range=${range}`);
    const data = await res.json();
    if (data.success) setAds(data.data.advertisements);
  }

  async function create(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/advertisements", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        maxImpressions: form.maxImpressions ? Number(form.maxImpressions) : undefined,
        maxClicks: form.maxClicks ? Number(form.maxClicks) : undefined
      })
    });
    const data = await res.json();
    if (!data.success) { setError(data.message); return; }
    setForm(EMPTY_FORM);
    load();
  }

  async function setStatus(id, status) {
    await fetch(`/api/admin/advertisements/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status })
    });
    load();
  }

  async function remove(id) {
    await fetch(`/api/admin/advertisements/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-bold">Advertisements</h1>
        <div className="flex gap-2">
          {["today", "7d", "30d", "all"].map((r) => (
            <button key={r} onClick={() => setRange(r)} className={range === r ? "btn-primary text-xs" : "btn-secondary text-xs"}>{r}</button>
          ))}
        </div>
      </div>

      <form onSubmit={create} className="card mt-4 flex flex-col gap-3 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <input placeholder="Title" className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input placeholder="Advertiser name" className="input-field" value={form.advertiserName} onChange={(e) => setForm({ ...form, advertiserName: e.target.value })} />
        </div>
        <input placeholder="Image URL (https://...)" className="input-field" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
        <input placeholder="Destination URL (https://...)" className="input-field" value={form.destinationUrl} onChange={(e) => setForm({ ...form, destinationUrl: e.target.value })} />
        <textarea placeholder="Description" className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="grid gap-3 sm:grid-cols-3">
          <input placeholder="CTA text" className="input-field" value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} />
          <select className="input-field" value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })}>
            {PLACEMENTS.map((p) => <option key={p} value={p}>{p.replace("_", " ")}</option>)}
          </select>
          <select className="input-field" value={form.targetSubscriptionLevel} onChange={(e) => setForm({ ...form, targetSubscriptionLevel: e.target.value })}>
            <option value="all">All plans</option>
            <option value="free">Free only</option>
            <option value="pro">Pro only</option>
            <option value="pro_plus">Pro+ only</option>
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <input type="number" placeholder="Priority" className="input-field" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
          <input type="number" placeholder="Max impressions" className="input-field" value={form.maxImpressions} onChange={(e) => setForm({ ...form, maxImpressions: e.target.value })} />
          <input type="number" placeholder="Max clicks" className="input-field" value={form.maxClicks} onChange={(e) => setForm({ ...form, maxClicks: e.target.value })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input type="date" className="input-field" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          <input type="date" className="input-field" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        </div>
        {error && <p className="text-sm text-signal-red">{error}</p>}
        <button className="btn-primary">Create Advertisement</button>
      </form>

      <div className="mt-4 space-y-3">
        {ads.map((ad) => (
          <div key={ad._id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{ad.title} <span className="text-xs text-ink-500">({ad.placement})</span></p>
                <p className="text-xs text-ink-500 capitalize">{ad.lifecycleStatus}</p>
              </div>
              <div className="flex gap-2 text-xs">
                {ad.status === "active" ? (
                  <button onClick={() => setStatus(ad._id, "paused")} className="btn-secondary">Pause</button>
                ) : (
                  <button onClick={() => setStatus(ad._id, "active")} className="btn-primary">Resume</button>
                )}
                <button onClick={() => remove(ad._id)} className="text-signal-red">Delete</button>
              </div>
            </div>
            <div className="mt-3 flex gap-6 text-sm">
              <span>Impressions: <strong>{ad.impressions}</strong></span>
              <span>Clicks: <strong>{ad.clicks}</strong></span>
              <span>CTR: <strong className="text-gold-500">{ad.ctr}%</strong></span>
            </div>
          </div>
        ))}
        {ads.length === 0 && <p className="text-sm text-ink-500">No advertisements yet.</p>}
      </div>
    </div>
  );
}
