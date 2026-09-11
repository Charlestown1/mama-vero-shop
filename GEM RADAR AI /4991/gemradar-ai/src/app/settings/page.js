"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";

export default function SettingsPage() {
  const [code, setCode] = useState(null);
  const [instructions, setInstructions] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function generateCode() {
    setError("");
    const res = await fetch("/api/notifications/telegram/generate-code", { method: "POST" });
    const data = await res.json();
    if (!data.success) { setError(data.message); return; }
    setCode(data.data.code);
    setInstructions(data.data.instructions);
  }

  async function sendTest() {
    setError("");
    setStatus("");
    const res = await fetch("/api/notifications/telegram/test", { method: "POST" });
    const data = await res.json();
    if (!data.success) { setError(data.message); return; }
    setStatus("Test message sent — check Telegram.");
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 py-10">
        <h1 className="font-display text-2xl font-bold">Settings</h1>

        <div className="card mt-6 p-5">
          <h2 className="font-display font-semibold">Telegram Notifications</h2>
          <p className="mt-1 text-sm text-ink-500">
            Telegram requires you to message the bot first — that&apos;s how Telegram lets a bot know
            who you are. Generate a code, send it to the bot, then send a test message.
          </p>

          <button onClick={generateCode} className="btn-secondary mt-4">Generate Link Code</button>

          {code && (
            <div className="mt-4 rounded-lg border border-base-700/60 p-3 text-sm">
              <p className="font-display text-lg font-bold text-gold-500">{code}</p>
              <p className="mt-1 text-ink-300">{instructions}</p>
            </div>
          )}

          <button onClick={sendTest} className="btn-primary mt-4">Send Test Notification</button>

          {status && <p className="mt-3 text-sm text-signal-green">{status}</p>}
          {error && <p className="mt-3 text-sm text-signal-red">{error}</p>}
        </div>
      </main>
    </>
  );
}
