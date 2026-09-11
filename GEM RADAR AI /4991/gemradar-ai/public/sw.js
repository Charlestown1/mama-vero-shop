// GemRadar AI service worker — app-shell caching ONLY.
//
// What this caches: the static build assets Next.js needs to render the
// basic app chrome (JS/CSS bundles, icons, manifest) so the app can at least
// open and show an offline state without a network round-trip.
//
// What this NEVER caches: any /api/* request. Market prices, portfolio
// values, research reports, auth state — all of it must come from the
// network or not be shown at all. Serving a cached API response would mean
// showing stale crypto data as if it were live, which is explicitly not
// acceptable for this app. Session cookies and auth tokens are never
// touched by this file at all — the browser's own cookie jar handles those,
// this cache only ever stores response bodies for static GET requests below.
const CACHE_NAME = "gemradar-shell-v1";
const SHELL_ASSETS = ["/", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Never intercept API calls — those must always hit the network so the
  // user never sees stale financial data presented as current.
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || caches.match("/offline"))
      )
  );
});
