"use client";
import { useState, useEffect } from "react";

export default function AdminUserDetailPage({ params }) {
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch(`/api/admin/users/${params.id}`);
    const data = await res.json();
    if (data.success) setDetail(data.data);
    else setError(data.message);
  }

  async function applyUpdate(body) {
    setError("");
    const res = await fetch(`/api/admin/users/${params.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!data.success) { setError(data.message); return; }
    setConfirmAction(null);
    load();
  }

  if (error && !detail) return <p className="text-sm text-signal-red">{error}</p>;
  if (!detail) return <p className="text-sm text-ink-500">Loading...</p>;

  const { user, subscription, payments, activity } = detail;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">{user.email}</h1>
      <p className="text-sm text-ink-500">@{user.username} · joined {new Date(user.createdAt).toLocaleDateString()}</p>

      {error && <p className="mt-3 text-sm text-signal-red">{error}</p>}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="card p-4">
          <h3 className="font-display font-semibold">Account</h3>
          <div className="mt-2 space-y-1 text-sm">
            <p>Role: <span className="text-gold-500">{user.role}</span></p>
            <p>Plan: <span className="text-gold-500 capitalize">{user.subscriptionTier.replace("_", "+")}</span></p>
            <p>Subscription status: {user.subscriptionStatus}</p>
            <p>Status: {user.isSuspended ? <span className="text-signal-red">Suspended</span> : <span className="text-signal-green">Active</span>}</p>
            <p>Telegram: {user.telegramChatId ? "Connected" : "Not connected"}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {user.isSuspended ? (
              <button onClick={() => setConfirmAction({ label: "Unsuspend this user?", body: { isSuspended: false } })} className="btn-primary text-xs">Unsuspend</button>
            ) : (
              <button onClick={() => setConfirmAction({ label: "Suspend this user? They will be unable to log in.", body: { isSuspended: true } })} className="btn-secondary text-xs">Suspend</button>
            )}
            {user.role === "user" ? (
              <button onClick={() => setConfirmAction({ label: "Grant this user admin access?", body: { role: "admin" } })} className="btn-secondary text-xs">Make Admin</button>
            ) : (
              <button onClick={() => setConfirmAction({ label: "Remove admin access from this user?", body: { role: "user" } })} className="btn-secondary text-xs">Revoke Admin</button>
            )}
          </div>
        </div>

        <div className="card p-4">
          <h3 className="font-display font-semibold">Activity</h3>
          <div className="mt-2 space-y-1 text-sm">
            <p>Research reports: {activity.researchReportsCount}</p>
            <p>Alerts: {activity.alertsCount} ({activity.activeAlertsCount} active)</p>
            <p>Watchlists: {activity.watchlistsCount}</p>
            <p>Has portfolio: {activity.hasPortfolio ? `Yes (${activity.portfolioHoldingsCount} holdings)` : "No"}</p>
          </div>
        </div>

        <div className="card p-4 md:col-span-2">
          <h3 className="font-display font-semibold">Subscription Override</h3>
          <p className="mt-1 text-xs text-ink-500">
            For support use only — normal upgrades/downgrades go through Stripe. This directly sets the fields Stripe webhooks would otherwise set.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["free", "pro", "pro_plus"].map((tier) => (
              <button
                key={tier}
                onClick={() => setConfirmAction({ label: `Manually set plan to ${tier}?`, body: { subscriptionTier: tier, subscriptionStatus: tier === "free" ? "none" : "active" } })}
                className="btn-secondary text-xs capitalize"
              >
                Set {tier.replace("_", "+")}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-4 md:col-span-2">
          <h3 className="font-display font-semibold">Recent Payments</h3>
          {payments.length === 0 ? (
            <p className="mt-2 text-sm text-ink-500">No payment records.</p>
          ) : (
            <div className="mt-2 space-y-1 text-sm">
              {payments.map((p) => (
                <div key={p._id} className="flex justify-between">
                  <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                  <span>${p.amount} {p.currency}</span>
                  <span className={p.status === "succeeded" ? "text-signal-green" : "text-signal-red"}>{p.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5">
          <div className="card max-w-sm p-5">
            <p className="text-sm">{confirmAction.label}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setConfirmAction(null)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={() => applyUpdate(confirmAction.body)} className="btn-primary text-sm">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
