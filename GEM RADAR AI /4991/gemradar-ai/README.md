# GemRadar AI

AI-powered crypto discovery, research, and risk intelligence — a full-stack Next.js SaaS platform
combining a **deterministic** Gem Scanner and Risk Scanner with a **Gemini-powered** AI Researcher,
Smart Money tracking, subscriptions (Stripe), alerts (email/Telegram), and a full Admin Panel.

**Status: all 10 planned phases are implemented.** This document is the final, consolidated setup
guide — read it before deploying.

---

## 1. Architecture overview

- **Framework**: Next.js 14 (App Router) — a single project serves both the frontend and the backend
  via API routes under `src/app/api/`. No separate Express server.
- **Database**: MongoDB Atlas via Mongoose (`src/models/`, 22 models).
- **Auth**: NextAuth.js — email/password (bcrypt-hashed) and Google OAuth, JWT sessions.
- **AI**: Google Gemini, called only from the server (`src/services/ai/geminiService.js`), never
  exposed to the browser. Every AI call follows **DATA → VALIDATION → SCORING → AI INTERPRETATION**:
  Gemini receives only data this app already verified, and its structured output is validated before
  it's ever saved or rendered.
- **Scoring**: The Gem Scanner's Opportunity Score and the Risk Scanner's Security Score are both
  **fully deterministic formulas** (`src/services/scanner/scoringEngine.js`) with admin-configurable
  weights — Gemini never determines a score.
- **Payments**: Stripe Checkout (redirect-based, no Stripe.js needed) + signature-verified, idempotent
  webhooks. Effective plan access is computed server-side from `subscriptionTier` + `subscriptionStatus`
  (`src/services/subscription/subscriptionService.js`) — the frontend is never the authority.
- **Styling**: Tailwind CSS, dark navy/gold "premium fintech terminal" design system, mobile-first.

```
src/
  app/            Pages (App Router) + API routes (src/app/api/**/route.js)
  components/     Shared React components
  config/         Reads process.env — the only place secrets are referenced
  lib/            db connection, auth, middleware helpers, logger, utils
  models/         Mongoose schemas (22 models)
  services/       All business logic, organized by domain
public/           Static assets, manifest.json, sw.js, generated icons
```

---

## 2. Installation (including on Android via Acode + Termux)

1. Install Termux (F-Droid build, not Play Store) and Node.js: `pkg install nodejs git`
2. Extract/clone this project, `cd` into it.
3. `npm install`
4. `cp .env.example .env` and fill in values (see section 3).
5. `npm run dev` → open `http://localhost:3000`.
6. For production: `npm run build && npm start`.

---

## 3. Environment variables

Every variable below is in `.env.example` with an empty or placeholder value — **no real secret is
committed anywhere in this repository.**

### Required to run at all
| Variable | Where to get it |
|---|---|
| `MONGODB_URI` | MongoDB Atlas → Database → Connect → Drivers |
| `NEXTAUTH_SECRET` | Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` in dev; your real HTTPS domain in production |

### Google OAuth (optional — email/password works without it)
| Variable | Where to get it |
|---|---|
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google Cloud Console → APIs & Services → Credentials → OAuth Client ID (type: Web application) |
| `GOOGLE_CALLBACK_URL` | `<your-domain>/api/auth/callback/google` — must be added as an Authorized redirect URI in the same Google Cloud credential |

### Gemini (required for AI Researcher / AI Portfolio Analysis / AI Market Summary)
| Variable | Where to get it |
|---|---|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/) |
| `GEMINI_MODEL` | Defaults to `gemini-1.5-pro` |

### Crypto data providers
| Variable | Notes |
|---|---|
| `COINGECKO_API_BASE`, `COINGECKO_API_KEY` | Free tier needs no key; set a key only if you have a paid CoinGecko plan |
| `DEXSCREENER_API_BASE` | Free, no key needed |
| `ONCHAIN_API_KEY`, `ONCHAIN_API_BASE` | **Not wired to a specific vendor on purpose.** Pick one (Moralis, GoPlus Security, Etherscan+) for holder counts and contract-security checks (honeypot, mint/freeze authority, tax). Without this, the Risk Scanner still works but reports those specific fields as "Data unavailable" rather than guessing. |

### Stripe (required for paid plans)
| Variable | Where to get it |
|---|---|
| `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys |
| `STRIPE_PRO_PRICE_ID`, `STRIPE_PRO_PLUS_PRICE_ID` | Create 2 recurring Prices in Stripe → copy their IDs |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks → your endpoint → Signing secret (or from `stripe listen` locally) |

### Telegram (optional, for Telegram alerts)
| Variable | Where to get it |
|---|---|
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` | Create a bot via [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_WEBHOOK_SECRET` | Any random string you choose — used in the webhook URL query param |

### Email (optional, for email alerts)
| Variable | Notes |
|---|---|
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Any SMTP provider — Resend, SendGrid, or a Gmail app password |

### Internal
| Variable | Notes |
|---|---|
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS` | Shared in-memory rate limiter config (see §9) |
| `CRON_SECRET` | Random string — required header for the external scheduler that triggers alert evaluation |

---

## 4. Setting up each external service

**MongoDB Atlas**: create a free (M0) cluster, add a database user, allow your deploy platform's IP
(or `0.0.0.0/0` for simplicity during setup, tightened later), copy the connection string into
`MONGODB_URI`.

**Google OAuth**: in Google Cloud Console, configure the OAuth consent screen, then create a Web
application OAuth Client. Authorized redirect URI = `GOOGLE_CALLBACK_URL`.

**Gemini**: create an API key in AI Studio. No further configuration needed — `geminiService.js`
reads it directly.

**Stripe**: create 2 recurring Products/Prices (Pro, Pro+). After your first deploy, add a webhook
endpoint at `https://yourdomain.com/api/subscription/webhook` subscribed to:
`checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`,
`customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`. For **local** testing use
the Stripe CLI instead: `stripe listen --forward-to localhost:3000/api/subscription/webhook` (it
prints a webhook secret you can use in place of the dashboard one). Also enable the Customer Portal
under Settings → Billing.

**Telegram**: after deploying to a public HTTPS URL, register the webhook once:
```
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://yourdomain.com/api/telegram/webhook?secret=<TELEGRAM_WEBHOOK_SECRET>
```
This cannot be tested against `localhost` — Telegram requires a public URL.

**Alert evaluation scheduler**: this app has no built-in cron. Configure an external scheduler
(Vercel Cron, a GitHub Actions scheduled workflow, or cron-job.org) to `POST /api/alerts/evaluate`
every few minutes with header `x-cron-secret: <CRON_SECRET>`.

---

## 5. Creating the first admin account

There is intentionally no self-service "become admin" button. After signing up normally, promote
your account directly in MongoDB:
```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```
Then `/admin` and all `/api/admin/*` routes become accessible to that account.

---

## 6. Subscriptions

Free/Pro/Pro+ limits and feature flags are centralized in
`src/services/subscription/subscriptionService.js` (`PLAN_LIMITS`). `getEffectivePlan(user)` is the
single authorization function used everywhere — it only honors a paid tier while
`subscriptionStatus` is `active`/`trialing`, so a canceled/past-due account automatically loses paid
access even if `subscriptionTier` still shows the old plan (kept for history/display only). Every
gated route (`assertFeatureAccess`) returns a clean 403 with the required plan rather than crashing
or silently allowing access.

---

## 7. PWA & offline behavior

- `public/manifest.json` + generated icons (`public/icons/`) make the app installable on Android/iOS
  home screens (`Add to Home Screen` in the browser menu).
- `public/sw.js` is a minimal service worker that caches **only the static app shell** (JS/CSS
  bundles, manifest, icons) — it explicitly never intercepts any `/api/*` request. This means:
  what works offline is the app opening at all; what does **not** and never will work offline is
  live prices, scores, AI reports, or any account data — those always require the network, and the
  app never silently serves a stale API response as if it were current.
- An offline indicator (`ServiceWorkerRegistration.js`) shows a red banner the moment
  `navigator.onLine` goes false, explicitly warning that anything on screen may be out of date.
- `/offline` is the fallback page shown for a fully-failed navigation while offline.

---

## 8. Caching strategy

Only **public, non-user-specific** data is cached, and only in-process (a `Map` with TTLs, see
`src/lib/utils/cache.js`) — nothing here is a distributed cache, and nothing user-specific ever goes
through it:

| Data | TTL | Why |
|---|---|---|
| CoinGecko market overview | 30s | Collapses many users' dashboard loads into one upstream call |
| CoinGecko token price | 20s | Called frequently by watchlist/alerts/scanner |
| CoinGecko top movers | 30s | Same as overview |
| Dexscreener pair data | 20s | Called by research/risk/scanner for the same token repeatedly |

Every outbound provider call goes through `src/lib/utils/httpClient.js`, which adds an 8-second
timeout and a single retry on network errors, 5xx, or 429 responses — never on other 4xx errors,
since those won't succeed on retry. If a provider is genuinely down, the relevant field is reported
as "Data unavailable," never faked.

---

## 9. Security notes

- **Passwords**: bcrypt-hashed (cost 12), never selected in any admin or API query (`.select("-password")`
  or field omission everywhere user data is read).
- **Sessions**: JWT-based via NextAuth, `NEXTAUTH_SECRET`-signed; cookie security (httpOnly, secure
  in production) is NextAuth's default behavior — no custom cookie handling was added or needed.
- **Authorization**: every private API route checks `getServerSession` server-side; every admin route
  additionally goes through `requireAdminApi()` (auth + role + rate limit in one place); every
  ownership-scoped query (`Watchlist`, `Portfolio`, `Alert`, `Wallet`, `ResearchReport`) filters by
  `user: session.user.id` at the database level, not just in the UI.
- **Stripe webhooks**: signature-verified against the raw request body before any processing;
  idempotent per Stripe event ID (recorded in `SystemSetting`), so redelivery can't double-process.
- **Advertisements/Announcements**: image and destination URLs are restricted to `http`/`https`
  schemes only (rejects `javascript:` etc.); announcement text is escaped on save and rendered as
  plain text, never as HTML.
- **Rate limiting** (in-memory, single-instance — see limitation below) is applied to: signup (by
  IP), scanner, AI research, risk scanner, portfolio AI analysis, market AI summary, alert creation,
  wallet creation, watchlist creation, Stripe checkout/portal, and **every** admin API route (via
  `requireAdminApi`). This is separate from subscription usage limits (daily scan/research counts,
  enforced via `usageService.reserveUsage`) — rate limiting protects against request bursts on any
  account; usage limits are a billing entitlement.
- **HTTP security headers** (`next.config.mjs`): CSP, `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, HSTS. The CSP uses
  `'unsafe-inline'` for scripts/styles — a deliberate, documented tradeoff (Next.js hydration data +
  Tailwind both rely on inline content; a strict nonce-based CSP would require a middleware nonce
  pipeline, which is a larger architectural change than a hardening pass should make). It still
  restricts `script-src` to same-origin + inline, blocking arbitrary remote script injection.
- **Error handling**: `app/error.js` and `app/global-error.js` show a generic message to the user and
  log the real error server-side only — no stack traces or internal details reach the client. API
  routes uniformly return `{ success: false, message }` and never leak raw database errors.
- **Secrets**: every credential is read via `process.env` inside `src/config/*.js` only; nothing in
  `src/app` (the browser-rendered tree) references `process.env` directly except `NEXTAUTH_URL` for
  building callback URLs, which is not a secret.

---

## 10. Known limitations (be honest about these before deploying)

- **Rate limiting is in-memory**, scoped to a single server process. It resets on redeploy and does
  not coordinate across multiple instances. Fine for one server; move to Redis (e.g. Upstash) before
  scaling horizontally.
- **The in-memory cache** (§8) has the same single-instance limitation.
- **No live Stripe/Telegram/Gemini credentials were available in this build environment.** Every
  integration is implemented against each provider's documented API and has been build-checked
  (imports resolve, syntax is valid, request/response shapes match the docs) — but end-to-end
  behavior against a real Stripe account, a real Telegram bot, and a real Gemini key has **not** been
  observed running. Test each with real credentials before relying on them in production.
- **On-chain security/holder data** (honeypot, mint/freeze authority, tax, verified holder
  concentration) requires a paid provider you choose and wire into `onchainProvider.js` — without it,
  the Risk Scanner is fully functional but reports those specific fields as unavailable rather than
  guessing.
- **Scanner token discovery**: the Gem Scanner re-scores tokens already in the database (added via
  research or admin); it does not yet pull a fresh, open-ended list of trending tokens across chains.
  Wiring a trending/boosted-pairs endpoint (Dexscreener has one) into `scannerService.js` is the
  natural next step.
- **Wallet activity ingestion**: `WalletActivity` is read, displayed, and alerted on, but nothing yet
  writes new records into it automatically — that requires a paid on-chain indexing/streaming
  provider and a background job, which depends on which `ONCHAIN_API_KEY` provider you choose.
- **Client-component pages** (dashboard, scanner, admin, etc. — anything using React hooks) cannot
  export Next.js `metadata` directly; only server-component pages (home, legal pages) have custom
  per-page SEO metadata. All private pages are excluded from `robots.txt` and `sitemap.xml`
  regardless, so this only affects page `<title>` polish, not indexing safety.
- **Legal pages** (`/terms`, `/privacy`, `/disclaimer`) contain honest placeholder content describing
  what the app actually stores — replace with lawyer-reviewed text before operating as a real
  product with real users' money.

---

## 11. Deployment checklist

1. Set every environment variable from §3 in your host's environment (Vercel, Railway, your own
   server, etc.) — never commit a real `.env`.
2. `npm run build` to confirm a clean production build.
3. Point `NEXTAUTH_URL` at your real HTTPS domain.
4. Register the Stripe webhook and Telegram webhook against that same domain (§4).
5. Set up the external cron for `/api/alerts/evaluate` (§4).
6. Promote your own account to admin directly in MongoDB (§5).
7. Smoke-test: sign up, run a scan, generate a research report (needs `GEMINI_API_KEY`), try
   upgrading a plan in Stripe test mode, confirm the webhook updates your plan, visit `/admin`.

This is a complete, internally consistent implementation of all 10 planned phases — but "feature
complete" is not the same claim as "battle-tested in production." Budget time for real-credential
testing before launch.
