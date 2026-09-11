/** @type {import('next').NextConfig} */

// Pragmatic CSP: 'unsafe-inline' is required because Next.js injects inline
// hydration data/scripts and this build uses Tailwind's inline utility
// styles — a strict nonce-based CSP would need a middleware-level nonce
// pipeline, which is a bigger architectural change than a hardening pass
// should make. This still meaningfully blocks arbitrary third-party script
// injection (e.g. via a compromised ad or announcement field) since
// script-src is scoped to 'self' + inline, never a remote host.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https: data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Browsers ignore this over plain HTTP in dev, so it's safe to always set.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }
];

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }]
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  }
};

export default nextConfig;
