# LastKey Digital Legacy — Technical Documentation

This document explains **what every major part of the project is**, **why it exists**, and **how it works end‑to‑end**. It is written for presentations and for onboarding new developers.

---

## 1) What the product is (one‑liner)

**LastKey Digital Legacy** is a digital afterlife platform: users **secure digital assets**, **preserve memories**, and configure a **Guardian Protocol (dead‑man’s switch)** so legacy content can be delivered to loved ones when the user becomes inactive.

---

## 2) Tech stack (what and why)

### Frontend
- **React + Vite**: fast dev server, modern build pipeline.
- **React Router**: client-side routing for public/protected pages.
- **TanStack React Query**: consistent data fetching, caching, and mutation handling.
- **Framer Motion**: smooth UI transitions; product feels “human-made”.
- **Tailwind (layout utilities)** + **CSS variables design system**:
  - The app is **dark-first**.
  - Colors and surfaces are driven by CSS variables in `client/src/index.css`.

### Backend
- **Node.js + Express**: REST API + middleware.
- **MongoDB + Mongoose**: persistent storage for users, assets, capsules, beneficiaries.
- **Socket.IO**: real-time Guardian Protocol updates (DMS status).
- **JWT**: stateless authentication for protected routes.
- **Nodemailer**: transactional emails (verify, guardian alerts, emergency, etc.).
- **Stripe (optional)**: paid tiers and checkout sessions.
- **BullMQ + Redis (optional)**: queue-based scheduling/workers for guardian/capsule jobs.
  - **Fallback mode** exists when Redis is disabled: server uses a cron-like loop.

---

## 3) Repository structure (map)

### `client/`
- `src/App.jsx`: route table and protection rules.
- `src/contexts/AuthContext.jsx`: auth state (`user`, `token`, login/logout).
- `src/components/`: reusable UI and system components (Navbar, ProtectedRoute, etc.).
- `src/pages/`: page-level screens (Dashboard, Vault, Pricing, etc.).
- `src/index.css`: **design system tokens** + global UI primitives (glass surfaces, inputs, responsive rules).
- `src/socket.js`: Socket.IO client connection + Guardian Protocol event handling.
- `src/utils/analytics.js`: optional PostHog analytics (DEV-gated logs).

### `server/`
- `server.js`: Express app + Socket.IO + startup logic + background workers/fallback cron.
- `routes/`: HTTP endpoints mapping → controllers + middleware.
- `controllers/`: domain business logic (auth, user, capsule, etc.).
- `models/`: Mongoose schemas (User, Asset, Beneficiary, Capsule).
- `services/`: scheduling/queue/email/audit infrastructure.
- `workers/`: BullMQ job processors (guardian/capsule).
- `.env.example`: environment variable template (includes `REDIS_ENABLED`).

---

## 4) Core concepts (domain language)

### Guardian Protocol (Dead‑Man’s Switch / DMS)
- A user sets an **inactivity duration** (minutes).
- If the user does not “check in” (ping) within that duration:
  - warnings may be sent,
  - and eventually the protocol can trigger legacy delivery to beneficiaries.

### Vault (Digital Assets)
- Users store entries (platform, username, URL, secret, notes, and crypto fields).
- Secrets are stored encrypted using an encryption key (`ASSET_ENCRYPTION_KEY`).

### Beneficiaries
- A beneficiary is someone who should receive access to the legacy.
- Relationship icons/colors help UX clarity.
- Emergency access codes allow beneficiaries to access the portal (public route).

### Time Capsules
- Messages stored with an `unlockAt`.
- Can be released on schedule (queue/cron), and delivered/available later.

---

## 5) Backend architecture (how requests are processed)

### Layers
1. **Route** (`server/routes/*.js`)
2. **Middleware** (auth via JWT `protect`, validation, etc.)
3. **Controller** (`server/controllers/*.js`)
4. **Model** (`server/models/*.js`)
5. **Services** (`server/services/*.js`) for cross-cutting concerns (email, scheduling, queues)

### Important reliability decision
The server is designed to **start listening even if MongoDB/Redis are unavailable**:
- MongoDB connect happens with retry/backoff logic.
- BullMQ/Redis is optional via `REDIS_ENABLED`.
- Scheduling services are defensive and return no‑op when queues are disabled.

---

## 6) Frontend architecture (how the UI is composed)

### Routing model
- `client/src/App.jsx` defines public routes and protected routes.
- Protected routes are wrapped in `client/src/components/ProtectedRoute.jsx`, which checks auth state (via `AuthContext`) and redirects as needed.

### State model
- **Auth state** lives in `client/src/contexts/AuthContext.jsx`:
  - `user` (profile + tier flags)
  - `token` (JWT used for API calls)
  - `logout()` clears auth state and returns the user to public pages
- **Server state** (API responses) is managed by **React Query**:
  - `useQuery` for reads
  - `useMutation` for writes
  - `invalidateQueries` to refresh caches after changes

### Styling model (dark spatial system)
- Global tokens live in `client/src/index.css` under `:root`:
  - surfaces (`--glass-1`, `--glass-2`, `--glass-3`)
  - borders (`--glass-border`, `--glass-border-hover`)
  - text (`--text-1`, `--text-2`, `--text-3`)
  - accents (`--ion`, `--plasma`, `--pulse`, `--amber`, `--danger`)
- Pages/components are expected to use **inline styles + CSS variables** for colors so the theme stays consistent and does not rely on dynamic Tailwind scanning.

---

## 7) API + real-time (Socket.IO) — how the app stays in sync

### REST API base URL
- Frontend uses:
  - `import.meta.env.VITE_API_BASE_URL` (if set)
  - or defaults to `http://localhost:5000/api`

### Socket.IO events (Guardian Protocol)
- Frontend connects using `client/src/socket.js`.
- Typical events:
  - `dms-sync`: server sends current DMS state on connect
  - `dms-update`: server pushes updates when ping/scheduler changes occur
- UI consumers:
  - `Dashboard.jsx` listens and updates `dmsStatus`
  - `GuardianProtocolPanel.jsx` renders countdown and status

---

## 8) End-to-end user flows (technical walkthrough)

### 8.1 New user → onboarding → dashboard
1. User visits `/` (Landing) and registers.
2. App stores auth token and navigates to onboarding.
3. Onboarding posts settings (inactivity duration / phone / alert channels).
4. Dashboard loads:
   - user stats and guardian status
   - AI suggestions (if enabled)
   - socket connection for live DMS updates

### 8.2 Guardian Protocol ping (reset inactivity timer)
1. User clicks “I’m Here — Reset Timer”.
2. Frontend calls the ping endpoint with JWT.
3. Backend updates:
   - `lastActive = now`
   - `triggerStatus = active`
4. Backend emits Socket.IO updates for UI.
5. Scheduler logic:
   - In Redis mode: cancel and reschedule BullMQ jobs.
   - In fallback mode: cron loop computes inactivity and triggers warnings/actions.

### 8.3 Vault (secure asset storage)
1. User visits `/vault`.
2. User creates assets (general or crypto types).
3. Vault shows:
   - “AES‑256 Encrypted” banner
   - masked secrets with reveal toggle
   - copy-to-clipboard with auto-clear behavior

### 8.4 Beneficiaries + Emergency access
1. User adds beneficiaries at `/beneficiaries`.
2. Beneficiary uses `/emergency?code=...`.
3. Emergency Access UI:
   - prefills URL code
   - shows a large, copyable code display
4. Backend validates code and returns permitted legacy data.

### 8.5 Pricing → Stripe checkout (optional)
1. User visits `/pricing`.
2. Paid tier buttons call backend checkout session creation (Stripe must be configured).
3. Backend returns a Stripe checkout URL and user is redirected.

### 8.6 AI features (optional)
- Voice Messages and Memoir AI call AI endpoints.
- If OpenAI is not configured, these routes should degrade gracefully.

---

## 9) Frontend pages (what each page is for)

- **`Landing.jsx`**: marketing entry point; hero + stats bar + feature grid.
- **Auth**: `Register`, `Login`, `VerifyEmail`, `ForgotPassword`, `ResetPassword`.
- **`Onboarding.jsx`**: initial Guardian configuration.
- **`Dashboard.jsx`**: DMS panel + suggestions + activity.
- **`Vault.jsx`**: encrypted asset CRUD; copy/reveal; security banner.
- **`Beneficiaries.jsx`**: manage recipients; relationship icon/color mapping.
- **Capsules / Memories**: `LifeTimeline`, `MemoirAI`, `VoiceMessages`.
- **`Pricing.jsx`**: tier comparison + annual toggle + checkout (optional).
- **`Settings.jsx`**: update inactivity duration / phone / alert channels after onboarding.
- **`EmergencyAccess.jsx`**: public portal for beneficiaries to redeem emergency access.
- **Legal**: `PrivacyPolicy`, `TermsOfService`.

---

## 10) Frontend components (what each component is for)

- **`Navbar.jsx`**: global navigation + “More” dropdown (includes Settings + Pricing).
- **`ProtectedRoute.jsx`**: redirects unauthorized users away from private pages.
- **`GuardianProtocolPanel.jsx`**: renders DMS countdown and ping CTA.
- **`ActivityFeed.jsx`**: shows recent user activity.
- **`GlobalSearch.jsx`**: Ctrl/Cmd+K quick navigation modal.
- **`ErrorBoundary.jsx`**: catches render crashes and shows safe fallback UI.
- **`CookieBanner.jsx`**: essential cookie notice.
- **`LoadingSkeleton.jsx`**: skeleton placeholders using the app’s dark design system.

---

## 11) Backend modules (what each module is for)

### Controllers
- **`authController.js`**: registration/login/email verification/forgot/reset password.
- **`userController.js`**: ping, stats, settings updates; guarded scheduler integration.
- **`capsuleController.js`**: capsule CRUD + safe scheduling integration.
- **`aiController.js`**: AI endpoints (suggestions/voice/memoir/scoring).

### Models
- **`User.js`**: identity + guardian state (`lastActive`, `triggerStatus`, `inactivityDuration`, `alertChannels`, `phone`).
- **`Asset.js`**: vault items (encrypted secret + metadata + crypto fields).
- **`Beneficiary.js`**: recipients + emergency code/expiry + access logging.
- **`Capsule.js`**: time capsule content + unlockAt/release state.

### Services / Workers
- **Queue wiring**: optional Redis/BullMQ initialization gated by `REDIS_ENABLED`.
- **Schedulers**: guardian/capsule schedulers are defensive (do not crash startup when disabled).
- **Workers**: BullMQ processors for guardian/capsule jobs (only when Redis enabled).

---

## 12) Environment variables (dev vs prod)

### Required / important
- `PORT`: server port (default 5000)
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret (required in production)
- `ASSET_ENCRYPTION_KEY`: encryption key for vault secrets (required for real security)

### Optional / feature-gated
- `REDIS_ENABLED=false|true`: enables BullMQ queues if true
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`: Redis connection details
- `OPENAI_API_KEY`: AI features
- Stripe keys/IDs: payments
- Email credentials: transactional mail

---

## 13) Local development — how to run

### Start backend
From `server/`:
- `npm run dev`

If you see “Port 5000 is already in use”, find and kill the PID:
- `netstat -ano | Select-String ":5000"`
- `Stop-Process -Id <PID> -Force`

### Start frontend
From `client/`:
- `npm run dev`

---

## 14) Debugging checklist (common issues)

### Server boots but DB is down
- The server should still listen; it will retry MongoDB in the background.
- Routes that require DB will fail until connected.

### Redis not running
- If `REDIS_ENABLED=false`, BullMQ is disabled and fallback checks run.
- If `REDIS_ENABLED=true` but Redis isn’t running, you’ll see connection failures.

### Emails not sending
- Missing email env variables causes email sending to be skipped/disabled.

### Payments not available
- If Stripe keys are not set, payment endpoints will be disabled or return friendly errors.

---

## 15) “Why this architecture?” (presentation talking points)

- **Resilience**: server doesn’t crash if external services are missing (Redis/Stripe/OpenAI).
- **Security**: vault encryption key + emergency access auditing.
- **Scalability**: BullMQ path is production-ready; fallback supports development.
- **Product UX**: dark spatial design system + motion + real-time Guardian countdown.
