"use client";

// Catches errors thrown from the root layout itself (rare, but Next.js
// requires this file to handle that case since error.js can't catch errors
// in its own parent layout). Must render its own <html>/<body>.
export default function GlobalError({ reset }) {
  return (
    <html lang="en">
      <body style={{ background: "#0a0e17", color: "#f5f0e6", fontFamily: "sans-serif" }}>
        <main style={{ maxWidth: 420, margin: "20vh auto", textAlign: "center", padding: "0 20px" }}>
          <h1>Something went wrong</h1>
          <p style={{ color: "#8a93a6", fontSize: 14 }}>Please refresh the page.</p>
          <button onClick={() => reset()} style={{ marginTop: 16, padding: "8px 16px" }}>Try Again</button>
        </main>
      </body>
    </html>
  );
}
