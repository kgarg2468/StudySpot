# StudySpot — Design Spec

A mobile-first web app for Chapman University students to discover, share, and rate study spots on and around campus. Built by Chapman CEO (Chapman Entrepreneurs).

## Users & Authentication

- Restricted to Chapman students via `@chapman.edu` email.
- Magic link authentication through Supabase Auth. Student enters email, receives a login link, clicks it, done.
- Domain restriction enforced server-side — only `@chapman.edu` addresses can request a magic link.

## Data Model

### Spot

A study location, created once by a student. Other students contribute by rating it.

| Field | Type | Required |
|-------|------|----------|
| id | UUID | auto |
| name | string | yes |
| latitude | float | yes |
| longitude | float | yes |
| address | string | yes (from geocoding) |
| category | enum: Library, Cafe, Outdoor, Building, Other | yes |
| description | text | no |
| hours | string | no |
| is_indoor | boolean | no |
| student_discount | string | no |
| photo_url | string | no |
| created_by | UUID (user ref) | auto |
| created_at | timestamp | auto |

### Rating

One per user per spot. Contains an overall score plus optional attribute breakdowns.

| Field | Type | Required |
|-------|------|----------|
| id | UUID | auto |
| spot_id | UUID (spot ref) | yes |
| user_id | UUID (user ref) | auto |
| overall | integer 1-5 | yes |
| noise_level | integer 1-5 | no |
| seating_availability | integer 1-5 | no |
| wifi_quality | integer 1-5 | no |
| outlet_availability | integer 1-5 | no |
| food_drink | integer 1-5 | no |
| vibe | integer 1-5 | no |
| group_friendly | integer 1-5 | no |
| comment | text | no |
| created_at | timestamp | auto |

Constraint: unique on (spot_id, user_id) — one rating per user per spot. Users can update their existing rating.

### User

Managed by Supabase Auth. Supplemented with a profiles table.

| Field | Type | Required |
|-------|------|----------|
| id | UUID | auto (from Supabase Auth) |
| email | string | yes (from auth) |
| display_name | string | no (defaults to email prefix) |
| created_at | timestamp | auto |

### Aggregated Spot Stats

Materialized or computed view for feed/leaderboard performance:

- overall_avg, overall_count
- noise_avg, seating_avg, wifi_avg, outlet_avg, food_drink_avg, vibe_avg, group_friendly_avg (each with count)

These power the feed tabs and the Quick Facts grid on the detail page.

## Navigation & Pages

### 1. Feed (Home) — `/`

The default view. A vertically scrollable list of spot cards with a collapsible mini-map at top.

**Tabs (feed filters):**
- **Trending** — most ratings received in the last 7 days
- **Top Rated** — highest average overall rating, minimum 3 ratings to qualify
- **Hidden Gems** — fewer than 5 ratings AND average overall >= 4.0
- **New** — most recently created spots

**Mini-map:** Compact Mapbox map showing pins for visible spots. Tapping "Expand" transitions to the full Map View.

**Spot card contents:**
- Icon (based on category — Lucide icons)
- Name
- Overall rating (number + star)
- Location context (on campus / distance from campus)
- Key info snippet (hours, discount if present)
- Attribute tags (top 3-4 most notable attributes as chips)

### 2. Map View — `/map`

Full-screen Mapbox map (standard/light style) with pins for all spots. Tapping a pin shows a bottom card overlay with spot summary. Tapping the card navigates to the Spot Detail page. Back button returns to feed.

Pin appearance: white circle with category icon, consistent with the monochrome theme.

### 3. Spot Detail — `/spot/[id]`

Full scrollable page with sections:

**Hero section:**
- Photo (if uploaded) or category icon fallback on dark background
- Spot name, overall rating (stars + count), location, category

**Quick Facts grid (2-column):**
- Noise Level — aggregate label + bar
- Seating — aggregate label + bar
- WiFi — aggregate label + bar
- Outlets — aggregate label + bar
- Food/Drink — aggregate label + bar
- Vibe — aggregate label + bar
- Group Friendly — aggregate label + bar
- Hours (if set) — text
- Student Discount (if set) — text
- Indoor/Outdoor (if set) — label

Each rated attribute shows as a bar filled proportionally to the average rating, with a text label (e.g., "Quiet", "Moderate", "Loud" for noise). Only attributes with at least one rating are shown.

**Recent Ratings:**
- List of user ratings with display name, star count, optional comment, timestamp
- Sorted newest first

**Actions:**
- "Rate This Spot" button — opens rating form (or shows existing rating for editing)
- "Directions" button — opens native maps app with coordinates
- "Report" link — flags spot for review

### 4. Add Spot — `/add`

Multi-step form, minimal required fields:

**Step 1 — Location:**
- Search bar (Mapbox Geocoding API) OR tap to drop pin on map
- Address auto-populated from geocoding result

**Step 2 — Details:**
- Name (required)
- Category picker (required): Library, Cafe, Outdoor, Building, Other
- Description (optional)
- Hours (optional)
- Indoor/Outdoor toggle (optional)
- Student discount info (optional)
- Photo upload (optional, max 1, max 5MB)

**Step 3 — Your Rating:**
- Overall 1-5 stars (required)
- Optional attribute ratings (noise, seating, WiFi, outlets, food/drink, vibe, group-friendly)
- Optional comment

Submit creates the spot and the first rating in one transaction.

### 5. Login — `/login`

- Email input field
- "Send Magic Link" button
- Confirmation message: "Check your Chapman email for a login link"
- Error state if non-`@chapman.edu` email is entered

### 6. Profile — `/profile`

Lightweight page showing:
- Display name (editable)
- List of spots you created
- List of ratings you've given
- Logout button

## Moderation

- Light moderation model: all posts go live immediately.
- Flag/report button on spots and ratings.
- Flagged items stored in a `reports` table with reason and reporter.
- Admin review: a simple `/admin` page (protected, hardcoded admin emails) showing flagged items with approve/remove actions.

## Visual Design

**Aesthetic:** Matches Chapman Entrepreneurs website — black and white, bold typography, minimal, high-contrast.

**Color tokens:**
- Background: `#000000`
- Card background: `#111111`
- Card background secondary: `#1a1a1a`
- Border: `#222222`
- Primary text: `#ffffff`
- Secondary text: `#999999` (inactive tabs, metadata)
- Muted text: `#666666` (sub-labels)
- Tag/chip text: `#888888`
- Accent: `#ffffff` (buttons, active states — no color accent, pure monochrome)

**Typography:** Inter (or system font stack). Bold weight hierarchy — 800 for headings, 700 for spot names, 500-600 for body.

**Icons:** Lucide React. Monochrome, consistent stroke weight.

**Map:** Mapbox GL JS, standard (light) style for readability.

**Branding:**
- Header: "StudySpot" (bold, white, left-aligned)
- Footer: "by Chapman CEO" (uppercase, small, centered, `#555`)

**Responsive:** Mobile-first. On desktop (>768px), feed could expand to a wider layout but mobile is the priority.

## Tech Stack

| Concern | Technology | Free Tier |
|---------|-----------|-----------|
| Framework | Next.js 14+ (App Router) | — |
| Styling | Tailwind CSS | — |
| Icons | Lucide React | — |
| Map | Mapbox GL JS | 50k loads/month |
| Backend/DB | Supabase (Postgres) | 500MB DB, 50k auth users |
| Auth | Supabase Magic Link | included |
| Photo Storage | Supabase Storage | 1GB |
| Hosting | Vercel | hobby tier |
| Geocoding | Mapbox Geocoding API | 100k requests/month |

## Database Schema (Supabase/Postgres)

```sql
-- Profiles (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users primary key,
  display_name text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- Spots
create table spots (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  latitude double precision not null,
  longitude double precision not null,
  address text not null,
  category text not null check (category in ('Library', 'Cafe', 'Outdoor', 'Building', 'Other')),
  hours text,
  is_indoor boolean,
  student_discount text,
  photo_url text,
  created_by uuid references profiles(id) not null,
  created_at timestamptz default now()
);

-- Ratings
create table ratings (
  id uuid default gen_random_uuid() primary key,
  spot_id uuid references spots(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  overall integer not null check (overall between 1 and 5),
  noise_level integer check (noise_level between 1 and 5),
  seating_availability integer check (seating_availability between 1 and 5),
  wifi_quality integer check (wifi_quality between 1 and 5),
  outlet_availability integer check (outlet_availability between 1 and 5),
  food_drink integer check (food_drink between 1 and 5),
  vibe integer check (vibe between 1 and 5),
  group_friendly integer check (group_friendly between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique(spot_id, user_id)
);

-- Reports
create table reports (
  id uuid default gen_random_uuid() primary key,
  target_type text not null check (target_type in ('spot', 'rating')),
  target_id uuid not null,
  reported_by uuid references profiles(id) not null,
  reason text not null,
  status text default 'pending' check (status in ('pending', 'reviewed', 'actioned')),
  created_at timestamptz default now()
);

-- Aggregation view for feed performance
create view spot_stats as
select
  s.id as spot_id,
  count(r.id) as rating_count,
  coalesce(avg(r.overall), 0) as overall_avg,
  coalesce(avg(r.noise_level), 0) as noise_avg,
  coalesce(avg(r.seating_availability), 0) as seating_avg,
  coalesce(avg(r.wifi_quality), 0) as wifi_avg,
  coalesce(avg(r.outlet_availability), 0) as outlet_avg,
  coalesce(avg(r.food_drink), 0) as food_drink_avg,
  coalesce(avg(r.vibe), 0) as vibe_avg,
  coalesce(avg(r.group_friendly), 0) as group_friendly_avg,
  count(case when r.created_at > now() - interval '7 days' then 1 end) as recent_rating_count
from spots s
left join ratings r on r.spot_id = s.id
group by s.id;
```

## Row-Level Security (RLS)

- **spots:** anyone authenticated can read; only creator can update/delete their own; any authenticated user can insert.
- **ratings:** anyone authenticated can read; only the rating author can update/delete; any authenticated user can insert (with unique constraint enforcing one per spot).
- **reports:** any authenticated user can insert; only admins can read/update.
- **profiles:** users can read all profiles; users can only update their own.

## Out of Scope (v1)

- Live busyness / check-in system
- Favorites / bookmarks
- Social features (following, commenting on ratings)
- Multiple photos per spot
- Native mobile app
- Push notifications
- Search by name (can be added easily later)
