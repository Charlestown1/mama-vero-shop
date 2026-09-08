# Mama Vero Shop

A full-stack e-commerce / inventory web application for a foodstuff shop, built with:

- **Frontend:** HTML5, CSS3, vanilla JavaScript (no framework) — designed to be edited easily in Acode
- **Backend:** Node.js + Express.js (REST API)
- **Database:** MongoDB Atlas + Mongoose
- **File storage:** Google Cloud Storage (product images are public, payment-proof screenshots are private and served via signed URLs)
- **Hosting:** designed for GitHub → Render

---

## 1. Project structure

```
mama-vero-shop/
├── server.js
├── package.json
├── .env.example
├── .gitignore
├── config/          # db, Google Cloud Storage, passport (Google OAuth)
├── models/          # User, Product, Order (Mongoose schemas)
├── middleware/       # auth, admin, file upload, error handler
├── controllers/       # business logic
├── routes/           # REST endpoints
├── seed/createAdmin.js  # creates the first admin account
├── uploads/           # empty — NOT used for permanent storage, kept only as a placeholder
└── public/            # the entire frontend (HTML/CSS/JS)
```

## 2. Local setup

1. Install Node.js 18+.
2. From the project folder:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in the values (see section 4 below).
4. Create your first admin account:
   ```
   npm run create-admin
   ```
   This reads `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` from `.env` and creates (or promotes) that account to `role: admin`. This is the **only** way to create an admin — regular sign-up always forces `role: customer` on the backend, regardless of what a client sends.
5. Start the app:
   ```
   npm run dev     # with nodemon, auto-restarts on changes
   npm start        # plain node
   ```
6. Visit `http://localhost:5000`.

## 3. MongoDB Atlas setup

1. Create a free cluster at https://www.mongodb.com/cloud/atlas.
2. Create a database user (username + password) under **Database Access**.
3. Under **Network Access**, allow your IP (or `0.0.0.0/0` while testing — restrict this in production, or use Render's outbound IPs if your Atlas plan supports IP allow-listing).
4. Get your connection string from **Connect → Drivers**, and put it in `MONGODB_URI` in `.env`, e.g.:
   ```
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/mama-vero-shop?retryWrites=true&w=majority
   ```

## 4. Environment variables (`.env`)

| Variable | Description |
|---|---|
| `PORT` | Port the server listens on (Render sets this automatically in production). |
| `NODE_ENV` | `development` or `production`. |
| `CLIENT_URL` | The public URL of your deployed app (used for CORS). |
| `MONGODB_URI` | Your MongoDB Atlas connection string. |
| `JWT_SECRET` | Long random string used to sign login tokens. |
| `JWT_EXPIRES_IN` | e.g. `7d`. |
| `SESSION_SECRET` | Long random string. Used only during the brief Google OAuth redirect handshake. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | From Google Cloud Console → OAuth consent screen → Credentials. |
| `GOOGLE_CALLBACK_URL` | e.g. `https://yourapp.onrender.com/api/auth/google/callback`. |
| `GOOGLE_CLOUD_PROJECT_ID` | Your Google Cloud project ID. |
| `GOOGLE_CLOUD_BUCKET` | The name of the GCS bucket you create (see below). |
| `GOOGLE_CLOUD_CLIENT_EMAIL` | The `client_email` field from your service account JSON key. |
| `GOOGLE_CLOUD_PRIVATE_KEY` | The `private_key` field from your service account JSON key (see note below about newlines). |
| `BANK_NAME` / `BANK_ACCOUNT_NAME` / `BANK_ACCOUNT_NUMBER` | Shown to customers at checkout. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | Used only by `npm run create-admin`. |

### A note on `GOOGLE_CLOUD_PRIVATE_KEY`

Most hosting dashboards (including Render) don't let you paste a real multi-line private key into a single-line environment variable box. The usual approach is to paste the key with its newlines replaced by the two literal characters `\n`, e.g.:

```
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n"
```

`config/googleCloud.js` automatically converts those literal `\n` sequences back into real newlines before initializing the client, so you don't need to do anything special beyond pasting it this way.

## 5. Google Cloud Storage setup

1. Create (or use) a Google Cloud project.
2. Enable the **Cloud Storage API**.
3. Create a bucket (Cloud Storage → Buckets → Create). A regional bucket close to your users is fine. **Do not** make the bucket public — access control is handled per-object in code (product images are made public individually on upload; payment proofs stay private and are served through short-lived signed URLs).
4. Create a **Service Account** (IAM & Admin → Service Accounts) with the **Storage Object Admin** role scoped to your bucket (or `Storage Admin` if simpler while testing).
5. Create a JSON key for that service account and download it.
6. From the JSON file, copy:
   - `client_email` → `GOOGLE_CLOUD_CLIENT_EMAIL`
   - `private_key` → `GOOGLE_CLOUD_PRIVATE_KEY` (see newline note above)
   - `project_id` → `GOOGLE_CLOUD_PROJECT_ID`
7. Set `GOOGLE_CLOUD_BUCKET` to your bucket's name.

**Never commit the JSON key file or paste its contents directly into source code.** Only the three values above go into environment variables.

## 6. Google OAuth ("Continue with Google") setup

1. In Google Cloud Console, go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. Application type: **Web application**.
3. Authorized redirect URI: `https://yourapp.onrender.com/api/auth/google/callback` (and `http://localhost:5000/api/auth/google/callback` for local testing — you can add both).
4. Copy the generated **Client ID** and **Client Secret** into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
5. Set `GOOGLE_CALLBACK_URL` to match exactly what you registered.

If these variables are left blank, the app still runs fine — the "Continue with Google" buttons will simply fail gracefully (manual email/password auth is unaffected).

## 7. Deploying to Render

1. Push this project to a GitHub repository (make sure `.env` is **not** committed — it's already in `.gitignore`).
2. On Render: **New → Web Service**, connect your repo.
3. Build command: `npm install`. Start command: `npm start`.
4. Add every variable from `.env.example` under Render's **Environment** tab (with your real values).
5. Deploy. Render only hosts the running Node process — no uploaded files ever rely on Render's local disk, since everything goes to Google Cloud Storage.
6. After the first deploy, run `npm run create-admin` locally (pointed at your production `MONGODB_URI`) to create your admin account, or temporarily add a Render "Job" / one-off shell command to run it against production.

## 8. API overview

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
PATCH  /api/auth/me
GET    /api/auth/google
GET    /api/auth/google/callback

GET    /api/products
GET    /api/products/categories
GET    /api/products/:id

GET    /api/config/bank-details

POST   /api/orders                          (auth required)
GET    /api/orders                          (auth required)
GET    /api/orders/:id                      (auth required)
POST   /api/orders/:id/payment-proof         (auth required, multipart/form-data, field name "paymentProof")
GET    /api/orders/:id/payment-proof-url      (auth required — signed URL for the customer's own proof)

GET    /api/admin/overview                   (admin only)
GET    /api/admin/products                   (admin only)
POST   /api/admin/products                   (admin only, multipart/form-data, field name "image")
PATCH  /api/admin/products/:id                (admin only)
DELETE /api/admin/products/:id                (admin only)
GET    /api/admin/customers                   (admin only)
GET    /api/admin/orders                      (admin only)
GET    /api/admin/orders/:id                  (admin only)
GET    /api/admin/orders/:id/payment-proof-url  (admin only)
PATCH  /api/admin/orders/:id/payment           (admin only) — body: { "status": "verified" | "rejected" | "pending" }
PATCH  /api/admin/orders/:id/status            (admin only) — body: { "status": "pending" | "preparing" | "ready_for_pickup" | "completed" | "cancelled" }
```

## 9. Security notes

- Passwords are hashed with bcrypt (12 salt rounds) — never stored in plain text.
- Auth uses an httpOnly JWT cookie; there is no way for frontend JavaScript to read or forge it.
- Every admin API route is protected server-side by `protect` + `adminOnly` middleware — hiding the admin button in the UI is not the security boundary.
- Stock is decremented atomically inside a MongoDB transaction at order time, re-checked against the live database value, and re-verified per item — the browser's numbers are never trusted, and two simultaneous purchases of the last item can't both succeed.
- Payment screenshots are uploaded straight to memory then to Google Cloud Storage as **private** objects; only short-lived signed URLs (15 minutes) are ever handed to the browser, and only to the order's owner or an admin.
- File uploads are restricted to JPG/JPEG/PNG/WebP and capped at 5MB.
- Rate limiting is applied globally to `/api/*` and more tightly to `/api/auth/login` and `/api/auth/register`.

## 10. Adding your first products

Log in as your admin account, open **Admin Dashboard → Products → Add Product**, and start adding items (Egusi, Ogbono, Crayfish, Garri, etc.). Nothing is hard-coded — all product data lives in MongoDB and is fully editable from the dashboard.
