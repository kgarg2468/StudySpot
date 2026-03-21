# StudySpot

A mobile-first web app for Chapman University students to discover, share, and rate study spots on and around campus. Built by Chapman CEO (Chapman Entrepreneurs).

## Features

- **Magic Link Auth** — sign in with your `@chapman.edu` email
- **Feed** — browse study spots with Trending, Top Rated, Hidden Gems, and New tabs
- **Map View** — full-screen Mapbox map with pins for all spots
- **Spot Detail** — ratings breakdown, quick facts grid, attribute bars, directions
- **Add Spot** — 3-step form: location (search/pin), details, your rating
- **Rate & Review** — overall + 7 optional attribute ratings per spot
- **Profile** — manage display name, view your spots and ratings
- **Moderation** — report spots/ratings, admin dashboard for review

## Tech Stack

| Concern | Technology |
|---------|-----------|
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Map | Mapbox GL JS |
| Backend/DB | Supabase (Postgres) |
| Auth | Supabase Magic Link |
| Photo Storage | Supabase Storage |
| Hosting | Vercel |
| Geocoding | Mapbox Geocoding API |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Mapbox](https://mapbox.com) access token

### Setup

1. **Clone and install:**

```bash
git clone https://github.com/kgarg2468/StudySpot.git
cd StudySpot
npm install
```

2. **Configure environment variables:**

```bash
cp .env.local.example .env.local
```

Fill in your Supabase URL, anon key, service role key, and Mapbox token.

3. **Set up the database:**

Run the SQL in `supabase/schema.sql` in your Supabase SQL Editor. This creates all tables, views, RLS policies, triggers, and the storage bucket.

4. **Configure Supabase Auth:**

In your Supabase dashboard under Authentication > URL Configuration, add your local dev URL (`http://localhost:3000`) as a redirect URL.

5. **Run the dev server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── page.tsx           # Feed (home)
│   ├── login/             # Magic link login
│   ├── map/               # Full-screen map view
│   ├── spot/[id]/         # Spot detail page
│   ├── add/               # Multi-step add spot form
│   ├── profile/           # User profile
│   ├── admin/             # Admin moderation dashboard
│   ├── auth/callback/     # Auth callback handler
│   └── api/admin/         # Server-side admin API
├── components/
│   ├── layout/            # Header, bottom nav
│   ├── spots/             # Spot card, category icon, attribute bar, rating form
│   ├── map/               # Mini-map component
│   ├── add-spot/          # Location, details, rating step components
│   ├── moderation/        # Report modal
│   └── ui/                # Star rating, attribute chip
├── lib/
│   ├── supabase/          # Client, server, middleware config
│   ├── auth/              # Auth context provider
│   ├── types/             # TypeScript types
│   └── constants.ts       # Chapman location, attribute labels, helpers
└── middleware.ts           # Supabase session refresh
```

## License

MIT
