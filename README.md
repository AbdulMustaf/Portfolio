# Abdullah Mustafa — Portfolio

A cinematic, Netflix-inspired personal portfolio built with React, TypeScript, GSAP, and Tailwind CSS. Deployed on Vercel.

## Features

- **Netflix-style opening animation** — N logo fade-in + zoom-out on first load
- **Spider-Man-style hero mask overlay** — GSAP-powered mask reveal placed over the hero photo's face area on hover/tap
- **Netflix UI** — Hero banner, horizontal card carousels, dark theme, red accent
- **Data-driven** — All content lives in `src/data/` files; update content without touching components
- **Resume viewer** — PDF embed at `/resume` with download fallback
- **Terminal assistant** — `/api/rag-chat` answers visitor questions from portfolio data, escalating to Gemini only for questions the deterministic rules can't cover, under a hard monthly spend cap
- **Viewer counter** — `/api/viewer-count` increments a persistent Vercel KV / Upstash count when configured
- **Fully responsive** — Desktop, tablet, mobile

## Tech Stack

| Tool | Version |
|---|---|
| React | 18 |
| TypeScript | 5 |
| Vite | 5 |
| Tailwind CSS | 3 |
| GSAP | 3 |
| React Router | 6 |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Customizing Your Content

All portfolio content is in `src/data/`. Edit these files — no component changes needed:

| File | What it controls |
|---|---|
| `src/data/profileData.ts` | Name, headline, bio, social links |
| `src/data/projectsData.ts` | Projects (title, description, tags, image, links) |
| `src/data/experienceData.ts` | Work history (role, org, dates, highlights, tech) |
| `src/data/skillsData.ts` | Skills organized by category |
| `src/data/socialLinksData.ts` | GitHub, LinkedIn, email, resume URL |

## Adding Your Hero Photo

1. Drop your photo at `public/images/hero.jpg`
2. The hero banner will automatically use it
3. The Spider-Man mask overlay will appear over the face area on hover/tap

## Adding Your Resume

1. Drop your resume PDF at `public/resume.pdf`
2. It will be embedded at `/resume` automatically
3. To update, replace the file — no code changes needed

## Deploying to Vercel

### Option 1 — Vercel CLI
```bash
npx vercel
```

### Option 2 — Vercel Dashboard
1. Push this repo to GitHub
2. Import it at [vercel.com/new](https://vercel.com/new)
3. Vercel auto-detects Vite — click Deploy
4. Add environment variables in **Vercel Dashboard → Settings → Environment Variables**:

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes (for AI answers) | API key from [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `GEMINI_MODEL` | No | Defaults to `gemini-3.1-flash-lite`. Google retires models on a schedule — a retired ID 404s on every call, so verify before changing (see below) |
| `KV_REST_API_URL` | **Yes (for AI answers)** | From Vercel Dashboard → Storage → KV → your database → `.env.local` tab |
| `KV_REST_API_TOKEN` | **Yes (for AI answers)** | Same location as `KV_REST_API_URL` |
| `RAG_MONTHLY_BUDGET_USD` | No | Monthly Gemini spend ceiling. Defaults to `2` |
| `RAG_MAX_MODEL_CALLS_PER_DAY` | No | Daily model-call ceiling. Defaults to `800` (under the free tier's ~1000/day) |
| `RAG_PRICE_INPUT_PER_M` / `RAG_PRICE_OUTPUT_PER_M` | No | Per-1M-token prices used by the spend ledger. Update if you change the model |
| `RAG_HEALTH_TOKEN` | No | Secret for `/api/rag-health`. Unset means that route 404s |

**Setting up Vercel KV (persistent viewer count):**
1. Go to Vercel Dashboard → Storage → Create Database → KV
2. Once created, open the database → `.env.local` tab
3. Copy `KV_REST_API_URL` and `KV_REST_API_TOKEN` into your project's environment variables
4. Redeploy for the variables to take effect

**KV is required for AI answers, not just the counter.** Rate limiting, the spend
ledger and the answer cache all live in KV, so without it `/api/rag-chat` will not
call Gemini at all — it answers from the local rule engine instead. An unmetered
model call is how a fixed budget gets blown, so the route fails closed on purpose.

For a no-payment setup, create the Gemini key in Google AI Studio on the free tier
and do not enable billing on the project; the free tier allows roughly 1000
requests/day, well above what this site needs. If you do enable billing, also set a
[Cloud spend cap](https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps)
slightly below your real ceiling — enforcement lags ~10 minutes — as a backstop
behind the in-app budget.

**How requests are costed.** Each question descends a ladder and stops at the first
tier that can answer it: guardrails (empty / prompt injection / sensitive /
off-topic), then the deterministic rule engine, then a 7-day answer cache, and only
then Gemini. Roughly 70% of real traffic never reaches the model. A question that
does costs about $0.0004, so a $2/month budget covers ~4,700 model calls. Past 80%
of the budget the endpoint stops paying for anything the rule engine can already
answer.

**Checking the model is alive.** A retired model ID returns 404 on every call and
the endpoint quietly answers from keyword search instead — easy to miss. Every
response reports the tier that served it in the `X-RAG-Mode` header and a `mode`
field, and the terminal shows `[offline mode]` when answers stop coming from the
model. To check directly:

```bash
# list the models your key can actually use
curl "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY"

# health + budget, and probe the model end to end
curl "https://<your-domain>/api/rag-health?token=$RAG_HEALTH_TOKEN&probe=1"
```

**Verifying in production:**
- RAG: Open the terminal and ask something open-ended like "Why did he retract his own research result?" — with `GEMINI_API_KEY` and KV set you get a synthesised answer and `X-RAG-Mode: model`. Canonical questions ("what are his skills?") are answered from portfolio data for free and report `X-RAG-Mode: rule`, which is expected, not a failure
- Viewer count: Open the terminal in a private/incognito window and compare the count shown to the previous session; it should be higher by exactly 1 if KV is configured

The `vercel.json` SPA rewrite rule is already configured.

### Custom domain

In Vercel, open the project, go to **Settings → Domains**, add `abdullahmustafa.com`, then follow Vercel's DNS instructions at your domain registrar. Usually that means pointing the apex domain to Vercel and optionally adding `www.abdullahmustafa.com` as a redirect/alias.

## Project Structure

```
src/
├── components/        # UI components
│   ├── NavBar.tsx
│   ├── HeroBanner.tsx
│   ├── HeroMaskReveal.tsx   ← Spider-Man animation wrapper
│   ├── NetflixTitle.tsx     ← Opening N animation
│   ├── ContentRow.tsx       ← Horizontal card carousel
│   ├── ProjectCard.tsx      ← Project card + modal
│   ├── ExperienceTimeline.tsx
│   ├── SkillsGrid.tsx
│   ├── AwardsSection.tsx
│   ├── ContactButtons.tsx
│   └── Footer.tsx
├── data/              ← EDIT THESE to update content
│   ├── profileData.ts
│   ├── projectsData.ts
│   ├── experienceData.ts
│   ├── skillsData.ts
│   └── socialLinksData.ts
├── hooks/
│   └── HeroMaskOverlay.tsx  ← GSAP Spider-Man mask overlay logic
├── pages/
│   ├── Home.tsx
│   └── Resume.tsx
└── styles/
    ├── globals.css
    └── animations.css
```
