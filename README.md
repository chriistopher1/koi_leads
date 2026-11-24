# KoiLeads

VIDEO - DEMO  : https://youtu.be/Ux5KXXnidEU

Open-source SaaS for finding and managing business leads from Google Maps.

Scrape businesses by keyword + location, score them with AI, organize them as **qualified** / **disqualified**, then generate draft emails and Instagram DMs from lead data.

---

## Features

- **Google Maps scrape** — search by keyword and location (via RapidAPI Local Business Data)
- **Lead list** — browse scraped businesses, view details, filter and categorize
- **AI scoring** — automatically score leads and suggest qualify / disqualify
- **AI outreach drafts** — generate email and Instagram DM drafts from lead data
- **Auth** — Google OAuth via Supabase Auth
- **Billing** — Free / Pro / Business plans with Xendit invoices (IDR)

---

## Tech stack

| Layer | Tool |
| --- | --- |
| Framework | [Next.js](https://nextjs.org) 16 (App Router) |
| UI | [shadcn/ui](https://ui.shadcn.com) + Tailwind CSS |
| Database & Auth | [Supabase](https://supabase.com) (Postgres + Google OAuth) |
| Scraping | [RapidAPI Local Business Data](https://rapidapi.com/letscrape-6bRBa3QguO5/api/local-business-data) |
| AI | [OpenRouter](https://openrouter.ai) |
| Payments | [Xendit](https://www.xendit.co) |

> **Note:** The repo includes `apify-client` as a leftover dependency, but the live scraper path uses **RapidAPI**, not Apify.

---

## Project structure

```text
koi_leads/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── (auth)/
│   │   ├── login/               # Google sign-in
│   │   ├── register/            # Google sign-up
│   │   └── auth/callback/       # OAuth code exchange
│   ├── (dashboard)/
│   │   ├── dashboard/           # Overview / stats
│   │   ├── scraper/             # Run a scrape campaign
│   │   ├── leads/               # Lead list + detail
│   │   ├── outreach/            # AI draft messages
│   │   ├── settings/            # Account & billing
│   │   ├── support/
│   │   └── payment-method/      # Payment success / failed pages
│   └── api/
│       ├── scraper/             # Start scrape + score leads
│       ├── leads/               # Score / draft helpers
│       ├── outreach/draft/      # Generate outreach copy
│       ├── payment/             # Create / cancel / webhook
│       └── payment-method/      # Link method + webhook
├── components/                  # UI by feature (landing, leads, scraper, …)
├── lib/
│   ├── supabase/                # Browser, server, admin, middleware clients
│   ├── rapidapi.ts              # Maps scrape client
│   ├── openrouter.ts            # AI scoring + drafts
│   └── xendit.ts                # Invoices & webhooks
├── types/                       # Shared TypeScript types
├── hooks/
├── koi_leads.sql                # Full Supabase schema (run once)
├── .env.example                 # Env template
└── middleware.ts                # Auth session + route protection
```

### Main user flows

1. **Sign in** with Google → profile row created by DB trigger  
2. **Scraper** → campaign + leads saved → AI score attached  
3. **Leads** → review details → mark qualified / disqualified  
4. **Outreach** → draft email or Instagram DM with OpenRouter  
5. **Settings / pricing** → Xendit invoice → webhook updates plan + quota  

---

## Prerequisites

- Node.js 20+ and npm
- A [Supabase](https://supabase.com) project
- A Google Cloud OAuth client (for Supabase Google login)
- A [RapidAPI](https://rapidapi.com) key with **Local Business Data** subscribed
- An [OpenRouter](https://openrouter.ai) API key
- A [Xendit](https://dashboard.xendit.co) account (optional if you only want scrape + AI locally)
- For local payment webhooks: [ngrok](https://ngrok.com) or similar public tunnel

---

## Quick start

```bash
git clone https://github.com/YOUR_USERNAME/koi_leads.git
cd koi_leads
npm install
cp .env.example .env.local
```

Fill `.env.local` (see [Environment variables](#environment-variables)), then complete the Supabase steps below. After that:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Setup guide (Supabase → running app)

Follow these steps in order on a **new** Supabase project.

### 1. Create a Supabase project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Pick org, name, database password, and region
3. Wait until the project is ready

### 2. Run the database schema

1. In the dashboard, open **SQL Editor** → **New query**
2. Paste the full contents of [`koi_leads.sql`](./koi_leads.sql)
3. Click **Run**

This creates:

| Table | Purpose |
| --- | --- |
| `profiles` | User plan, quota, Xendit customer id (auto-created on signup) |
| `campaigns` | Scrape jobs (query, location, status) |
| `leads` | Scraped businesses + AI score + status |
| `outreach_drafts` | Saved email / IG DM drafts |
| `subscriptions` | Plan purchases |
| `payments` | Xendit invoice records |

It also enables **Row Level Security** so users only see their own rows, and a trigger that inserts a `profiles` row when a user signs up via Auth.

### 3. Configure Auth (Google OAuth)

KoiLeads uses **Google only** (login + register pages call `signInWithOAuth`).

#### 3a. Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/) → create or select a project  
2. **APIs & Services → Credentials → Create credentials → OAuth client ID**  
3. Application type: **Web application**  
4. Authorized redirect URI (important — use your Supabase callback, not localhost):

   ```text
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```

5. Copy the **Client ID** and **Client Secret**

#### 3b. Supabase Auth settings

1. Supabase → **Authentication → Providers → Google** → enable  
2. Paste Client ID + Client Secret → save  
3. **Authentication → URL Configuration**:
   - **Site URL:** `http://localhost:3000` (change to your production URL later)
   - **Redirect URLs** — add:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/**` (optional, helpful in local)

### 4. Copy Supabase API keys

Supabase → **Project Settings → API**:

| Env var | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | `anon` / `publishable` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key (server only) |

> Never put `SUPABASE_SERVICE_ROLE_KEY` in client code or commit it. It bypasses RLS and is used by payment webhooks.

### 5. RapidAPI (scraping)

1. Create an account at [RapidAPI](https://rapidapi.com)  
2. Subscribe to **[Local Business Data](https://rapidapi.com/letscrape-6bRBa3QguO5/api/local-business-data)** (free tier is fine to start)  
3. Copy your **X-RapidAPI-Key** into `RAPIDAPI_KEY`

### 6. OpenRouter (AI)

1. Sign up at [https://openrouter.ai](https://openrouter.ai)  
2. Create an API key → `OPENROUTER_API_KEY`  
3. Optionally set `OPENROUTER_MODEL` (default: `google/gemini-flash-1.5`)

Used for:

- Lead scoring after scrape (`lib/openrouter.ts` → `scoreLead`)
- Email / Instagram DM drafts (`draftOutreach`)

### 7. Xendit (payments) — optional for local scrape/AI testing

Skip this if you only need scrape + leads + drafts on the free plan.

1. Create an account at [https://dashboard.xendit.co](https://dashboard.xendit.co)  
2. **Settings → Developers → API keys** → copy secret key → `XENDIT_API_KEY`  
3. Set up webhooks / callbacks:
   - Invoice paid → `POST {APP_URL}/api/payment/webhook`
   - Payment method (if used) → `POST {APP_URL}/api/payment-method/webhook`
4. Copy the **callback verification token** → `XENDIT_WEBHOOK_TOKEN`

#### Local webhooks

Xendit cannot reach `localhost`. Use a tunnel:

```bash
ngrok http 3000
```

Then:

1. Set `NEXT_PUBLIC_APP_URL` to the ngrok HTTPS URL  
2. Point Xendit webhook URLs to  
   `https://YOUR_NGROK_URL/api/payment/webhook`  
3. Restart `npm run dev` after changing env

### 8. Fill `.env.local`

```bash
cp .env.example .env.local
```

Minimum for login + scrape + AI:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RAPIDAPI_KEY=...
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=google/gemini-flash-1.5
```

Add for payments:

```env
XENDIT_API_KEY=xnd_development_...
XENDIT_WEBHOOK_TOKEN=...
```

### 9. Install and run

```bash
npm install
npm run dev
```

Checklist:

- [ ] Landing page loads at `/`
- [ ] **Masuk dengan Google** works and lands on `/dashboard`
- [ ] A row appears in `profiles` for your user
- [ ] Scraper creates a campaign and leads
- [ ] Leads page shows data; status can be updated
- [ ] Outreach can generate a draft
- [ ] (Optional) Checkout creates a Xendit invoice; webhook marks payment paid

---

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL (OAuth + Xendit redirects) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Yes | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes* | Service role (webhooks / admin). *Needed for billing |
| `RAPIDAPI_KEY` | Yes | RapidAPI Local Business Data key |
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key |
| `OPENROUTER_MODEL` | No | Chat model id (default Gemini Flash) |
| `XENDIT_API_KEY` | For billing | Xendit secret API key |
| `XENDIT_WEBHOOK_TOKEN` | For billing | Xendit callback verification token |

See [`.env.example`](./.env.example). Real secrets belong only in `.env.local` (gitignored).

---

## Scripts

```bash
npm run dev      # Development server (http://localhost:3000)
npm run build    # Production build
npm run start    # Run production build
npm run lint     # ESLint
```

---

## Security notes

- No API keys are hardcoded in source; everything reads from `process.env`
- `.env*` is gitignored; only `.env.example` (placeholders) is safe to commit
- `SUPABASE_SERVICE_ROLE_KEY` and `XENDIT_API_KEY` must stay server-side
- RLS is enabled on all app tables — do not disable it in production
- Xendit webhooks verify `x-callback-token` against `XENDIT_WEBHOOK_TOKEN`

If you ever pasted a real key into chat, git history, or a public issue: **rotate it** in the provider dashboard.

---

## Deploy (e.g. Vercel)

1. Push the repo and import the project in [Vercel](https://vercel.com)  
2. Add the same env vars from `.env.example` in the Vercel project settings  
3. Set `NEXT_PUBLIC_APP_URL` to your production URL  
4. Update Supabase **Site URL** + **Redirect URLs** to the production domain  
5. Point Xendit webhooks to `https://your-domain.com/api/payment/webhook`  

---

## Contributing

Issues and PRs are welcome. Keep changes focused, and never commit `.env.local` or live credentials.

---

## License

This project is intended to be open source. Add a `LICENSE` file (e.g. MIT) before publishing the public repository if you have not already.
