-- StudySpot Database Schema
-- Run this in Supabase SQL Editor to set up the database

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
  updated_at timestamptz,
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

-- Auto-create profile on first login
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Aggregation view for feed performance
create view spot_stats as
select
  s.id as spot_id,
  count(r.id) as rating_count,
  avg(r.overall) as overall_avg,
  avg(r.noise_level) as noise_avg,
  count(r.noise_level) as noise_count,
  avg(r.seating_availability) as seating_avg,
  count(r.seating_availability) as seating_count,
  avg(r.wifi_quality) as wifi_avg,
  count(r.wifi_quality) as wifi_count,
  avg(r.outlet_availability) as outlet_avg,
  count(r.outlet_availability) as outlet_count,
  avg(r.food_drink) as food_drink_avg,
  count(r.food_drink) as food_drink_count,
  avg(r.vibe) as vibe_avg,
  count(r.vibe) as vibe_count,
  avg(r.group_friendly) as group_friendly_avg,
  count(r.group_friendly) as group_friendly_count,
  count(case when r.created_at > now() - interval '7 days' then 1 end) as recent_rating_count
from spots s
left join ratings r on r.spot_id = s.id
group by s.id;

-- Row Level Security
alter table profiles enable row level security;
alter table spots enable row level security;
alter table ratings enable row level security;
alter table reports enable row level security;

-- Profiles: anyone authenticated can read, only own profile can update
create policy "profiles_select" on profiles for select to authenticated using (true);
create policy "profiles_update" on profiles for update to authenticated using (auth.uid() = id);

-- Spots: authenticated can read and insert, only creator can update/delete
create policy "spots_select" on spots for select to authenticated using (true);
create policy "spots_insert" on spots for insert to authenticated with check (auth.uid() = created_by);
create policy "spots_update" on spots for update to authenticated using (auth.uid() = created_by);
create policy "spots_delete" on spots for delete to authenticated using (auth.uid() = created_by);

-- Ratings: authenticated can read and insert, only author can update/delete
create policy "ratings_select" on ratings for select to authenticated using (true);
create policy "ratings_insert" on ratings for insert to authenticated with check (auth.uid() = user_id);
create policy "ratings_update" on ratings for update to authenticated using (auth.uid() = user_id);
create policy "ratings_delete" on ratings for delete to authenticated using (auth.uid() = user_id);

-- Reports: authenticated can insert, only admins can read/update
create policy "reports_insert" on reports for insert to authenticated with check (auth.uid() = reported_by);
create policy "reports_select" on reports for select to authenticated using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);
create policy "reports_update" on reports for update to authenticated using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

-- Storage bucket for spot photos
insert into storage.buckets (id, name, public) values ('spot-photos', 'spot-photos', true);

create policy "spot_photos_select" on storage.objects for select using (bucket_id = 'spot-photos');
create policy "spot_photos_insert" on storage.objects for insert to authenticated with check (bucket_id = 'spot-photos');
create policy "spot_photos_update" on storage.objects for update to authenticated using (bucket_id = 'spot-photos');
