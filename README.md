# 4-Day Week Finder

A free, self-hosted job search tool that aggregates **real, live results**
from job board APIs, filtered for 4-day work week, remote, and part-time
roles.

## What's real here vs. the earlier version

The previous version just opened Indeed/LinkedIn/etc. in new tabs. This
version has an actual backend (`app/api/search/route.js`, a Vercel
serverless function) that calls real job-search APIs and returns combined,
de-duplicated, sorted results directly in the app.

**Live data sources (no scraping — all public, ToS-compliant APIs):**
- [Remotive](https://remotive.com/api-documentation) — free, no key
- [RemoteOK](https://remoteok.com/api) — free, no key
- [Arbeitnow](https://www.arbeitnow.com/api/job-board-api) — free, no key
- [Adzuna](https://developer.adzuna.com/) — free key required, optional but
  recommended (broadest coverage + real part-time filtering)

Boards without a public search API (Indeed, LinkedIn, ZipRecruiter,
Wellfound, Snagajob, etc.) are kept as one-tap "open in a new tab" links
under "More boards," same as before — they just don't have inline results
since those sites don't offer a free public search API.

**Honest limitation:** none of these APIs have an explicit "4-day work week"
flag. The "4-Day Week" tab filters by keyword-matching phrases like "4 day
week," "32 hour week," "compressed workweek" in the job title/description —
so it'll surface roles that mention it, but won't catch every 4-day-week job
that didn't say so explicitly.

## Setup

```bash
npm install
```

(Optional) Add Adzuna keys — sign up free at https://developer.adzuna.com/,
then create a `.env.local` file:

```bash
cp .env.example .env.local
# edit .env.local and paste in your ADZUNA_APP_ID / ADZUNA_APP_KEY
```

Run locally:

```bash
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel (free)

1. Push this folder to a GitHub repo.
2. Go to https://vercel.com/new and import the repo.
3. If using Adzuna, add `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` under
   Project Settings → Environment Variables.
4. Deploy. Vercel's free tier covers this comfortably — the API route is a
   lightweight serverless function with no database.

## Add to your phone's home screen

Once deployed, open the Vercel URL on your phone:

- **iPhone (Safari):** Share icon → Add to Home Screen
- **Android (Chrome):** ⋮ menu → Add to Home screen

This app includes a `manifest.json` and app icon so it installs like a real
app (full-screen, own icon, no browser bar).

**Icon note:** `public/icon.svg` is a placeholder. It works for Android/
Chrome installs. iOS prefers a PNG `apple-touch-icon` for best results —
swap in your own 180x180 PNG at `public/apple-touch-icon.png` and reference
it in `app/layout.js`, or ask me to generate one for you.

## Extending it

- Add more sources by writing another `fetchX()` function in
  `app/api/search/route.js` following the same pattern (fetch → normalize →
  return array), then add it to the `Promise.all` and the spread in `jobs`.
- Adjust `FOUR_DAY_PHRASES` in the same file to broaden/narrow the 4-day-week
  keyword match.
