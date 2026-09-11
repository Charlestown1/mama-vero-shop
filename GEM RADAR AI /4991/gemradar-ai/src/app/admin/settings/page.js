"use client";
import { useState, useEffect } from "react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState([]);
  const [form, setForm] = useState({ key: "", value: "", description: "" });
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/admin/settings");
    const data = await res.json();
    if (data.success) setSettings(data.data.settings);
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    let parsedValue = form.value;
    try { parsedValue = JSON.parse(form.value); } catch { /* keep as plain string */ }

    const res = await fetch("/api/admin/settings", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: form.key, value: parsedValue, description: form.description })
    });
    const data = await res.json();
    if (!data.success) { setError(data.message); return; }
    setForm({ key: "", value: "", description: "" });
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">System Settings</h1>
      <p className="mt-1 text-sm text-ink-500">
        Non-secret platform configuration only. Scanner/Risk weights have their own dedicated page —
        this is for everything else (feature flags, defaults, etc).
      </p>

      <form onSubmit={save} className="card mt-4 flex flex-col gap-3 p-4">
        <input placeholder="Setting key (e.g. maintenance_mode)" className="input-field" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
        <input placeholder='Value (plain text or JSON, e.g. true or {"a":1})' className="input-field" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
        <input placeholder="Description (optional)" className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        {error && <p className="text-sm text-signal-red">{error}</p>}
        <button className="btn-primary">Save Setting</button>
      </form>

      <div className="card mt-4 divide-y divide-base-700/60">
        {settings.map((s) => (
          <div key={s._id} className="p-4 text-sm">
            <p className="font-medium text-gold-500">{s.key}</p>
            <p className="break-all text-ink-300">{JSON.stringify(s.value)}</p>
            {s.description && <p className="text-xs text-ink-500">{s.description}</p>}
          </div>
        ))}
        {settings.length === 0 && <p className="p-4 text-sm text-ink-500">No custom settings saved yet.</p>}
      </div>
    </div>
  );
}
