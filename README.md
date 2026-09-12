# PointHacker

A full-stack web app for maximizing the value of your credit-card reward points — compare
direct portal redemptions against every transfer-partner option and see which one is actually
worth the most. Also ranks your points by travel region and tracks which cards feed which
program's pooled balance.

**Live:** [point-hacker.vercel.app](https://point-hacker.vercel.app) — single-user, no login yet,
so treat the link as unlisted rather than public.

## Features

- **Dashboard** — every program you hold a balance in, with its best redemption option (direct
  vs. transfer) ranked automatically
- **Program detail** — the full ranked list of redemption options for one program, plus which of
  your cards feed it
- **Plan a trip** — pick a region and see which of your balances are actually worth using there
- **Card wallet** — track which physical cards feed which program
- **Catalog** — browse all 23 seeded reference programs (bank-transferable currencies, airlines,
  hotels, cashback) without needing a balance first

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Postgres (Supabase) via Prisma ORM
- Vitest for the redemption-ranking logic
- Deployed on Vercel, GitHub Actions CI (lint, typecheck, test, build) on every push/PR

## Getting started

```bash
npm install
cp .env.example .env   # fill in your own Postgres connection strings
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Other commands

```bash
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run test       # Vitest
npm run build      # production build
npx prisma studio  # browse the database
```
