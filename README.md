# PointHacker

A full-stack web app for maximizing the value of your credit-card reward points — compare
direct portal redemptions against every transfer-partner option and see which one is actually
worth the most. Around that it ranks your points by travel region, tracks which cards feed which
program, keeps a history of every balance, warns before points expire, factors in transfer-bonus
promos, and recommends which card to apply for next.

**Live:** [point-hacker.vercel.app](https://point-hacker.vercel.app) — sign in with Google; each
account only sees and manages its own cards and balances.

## Features

- **Sign-in** — Google OAuth (Auth.js); every user's cards, balances, and spending profile are
  private to their account, while the program catalog, card catalog, and promos are shared
- **Dashboard** — every program you hold a balance in (labelled in points or miles as the
  program calls them), with its best redemption option ranked automatically, a change-vs-last
  delta and sparkline, and a warning pill when points are expiring soon or likely expired
- **Program detail** — the full ranked list of redemption options for one program, the
  program's expiration policy, your balance history, and which of your cards feed it
- **Award goals** — say "Tokyo, business class, 2 people, next spring" and the app estimates the
  miles needed in every program that flies there (from a rough award-cost table), shows how close
  each of your balances gets you — including the exact transfers (with active promos) that would
  close the gap — and which catalog card's welcome bonus would finish the job
- **Plan a trip** — pick a region and see which of your balances are actually worth using there
- **Transfer bonuses** — record time-limited promos (e.g. +30% Chase → Hyatt); active ones are
  folded into every ranking and tagged wherever they drive a recommendation
- **Which card next?** — leads with which card's welcome bonus closes the gap on your goal, then
  set your monthly spend by category (sliders) and preferences; a curated catalog of 19 popular
  cards is scored by estimated first-year value, each shown as a generated card-art tile with an
  explicit earns / welcome bonus / annual fee breakdown, the best card per category, and cards
  you already hold excluded
- **Card wallet** — add the cards you hold by picking from the catalog (or as a custom entry),
  so they feed the right program balance and drop out of recommendations
- **Catalog** — browse all 26 seeded reference programs (bank-transferable currencies, airlines,
  hotels, cashback) without needing a balance first

All valuations, earn rates, transfer ratios, and expiration policies are best-effort estimates
maintained as reference data in `src/lib/data/` — verify with the issuer/program before acting.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Postgres (Supabase) via Prisma ORM
- Auth.js (`next-auth` v5) with the Prisma adapter, Google OAuth
- Vitest for the pure logic (redemption ranking, region relevance, transfer bonuses, points
  expiration, card scoring)
- Deployed on Vercel, GitHub Actions CI (lint, typecheck, test, build) on every push/PR

## Getting started

```bash
npm install
cp .env.example .env   # fill in your own Postgres connection strings + auth secrets
npx prisma migrate dev
npx prisma db seed
npm run dev
```

You'll also need a Google OAuth client (redirect URI
`http://localhost:3000/api/auth/callback/google`) for `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`, plus
an `AUTH_SECRET` (`npx auth secret`) — see `.env.example` for the full list.

Open [http://localhost:3000](http://localhost:3000).

## Other commands

```bash
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run test       # Vitest
npm run build      # production build
npx prisma studio  # browse the database
```
