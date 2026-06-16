# internship-web — student/instructor app (Next.js App Router)

Sessions 3.1 + 3.2-core done; 3.3–3.7 pending (see CONTINUATION in repo root README of internship-api memory notes).

## Run
```bash
npm install
cp .env.local.example .env.local   # point API_URL at internship-api
npm run dev                        # http://localhost:3000
```

## Architecture decisions
- Tokens live in httpOnly cookies; client components call same-origin `/api/proxy/*` which attaches the bearer and auto-refreshes once on 401 (`src/app/api/proxy`). Server components use `lib/serverApi.ts`.
- `src/middleware.ts` gates /my, /classroom, /instructor (UX only; API enforces real auth).
- Layout doctrine: TopNav+Footer = desktop, BottomTabs = mobile (distinct components, not scaled CSS).
- Public pages are ISR (60–300s) with generateMetadata + JSON-LD Course schema on detail.
- Fonts load via runtime Google Fonts link (works in offline-ish CI); swap to next/font when builds have network.

## Verified live (against internship-api + seeded DB)
home/catalog/detail/verify SSR render real data · JSON-LD present · URL-param filters · seats-left · preview badges · 404 slug UI · login sets cookies → /my 200 with progress rings · /my w/o session → 307 /login?next=/my · authed /login → /my · proxy auto-auth (/users/me) · logout clears.


## Mobile experience (single app — automatic by device)
There is **no separate mobile site**. `src/middleware.ts` detects the device from the User-Agent: phones & tablets are auto-redirected from the desktop routes to their mobile-native equivalents under `/m` (app bar, bottom tabs, bottom sheets, full-screen — no phone frame, it's a real device); desktop browsers hitting `/m` are sent back. Same session, same proxy, same deploy. `/login` and `/verify/*` are shared (no redirect). Path map: `/`→`/m`, `/internships`→`/m/explore`, `/internships/{slug}`→`/m/internships/{slug}`, `/my`→`/m/learn`.
