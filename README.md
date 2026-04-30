# Abdullah Mustafa — Portfolio

A cinematic, Netflix-inspired personal portfolio built with React, TypeScript, GSAP, and Tailwind CSS. Deployed on Vercel.

## Features

- **Netflix-style opening animation** — N logo fade-in + zoom-out on first load
- **Spider-Man-style hero mask overlay** — GSAP-powered mask reveal placed over the hero photo's face area on hover/tap
- **Netflix UI** — Hero banner, horizontal card carousels, dark theme, red accent
- **Data-driven** — All content lives in `src/data/` files; update content without touching components
- **Resume viewer** — PDF embed at `/resume` with download fallback
- **Terminal assistant** — `/api/rag-chat` retrieves portfolio context and answers questions through Gemini when configured
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
4. Add environment variables if you want the Gemini-backed terminal enabled:
   - `GEMINI_API_KEY` for the RAG assistant
   - `GEMINI_MODEL` optional, defaults to `gemini-2.0-flash`
   - `KV_REST_API_URL` and `KV_REST_API_TOKEN` for persistent viewer counts through Vercel KV / Upstash

For a no-payment setup, create the Gemini key in Google AI Studio on the free tier and do not enable billing on the project. Without these variables, the app still deploys: the terminal uses local fallback answers and the viewer API uses an instance-local count. The Gemini route also has an in-memory per-IP limiter before the external API call, so heavy traffic falls back to local portfolio context instead of burning API quota.

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
