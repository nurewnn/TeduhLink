-- TeduhLink starter schema. Run this in a new Supabase project's SQL Editor.
-- It uses two openly labelled demonstration stops and one monitored physical model bay.

create extension if not exists pgcrypto;

create type public.occupancy_state as enum ('available', 'occupied', 'unknown');
create type public.observation_source as enum ('measured', 'simulated');
create type public.device_health as enum ('online', 'offline', 'unreliable');

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  site_code text not null unique,
  name text not null,
  access_details text not null,
  is_demo boolean not null default true,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.amenities (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  amenity_code text not null check (amenity_code in ('shelter', 'charging')),
  listed_at timestamptz not null default now(),
  verified_at timestamptz,
  unique (site_id, amenity_code)
);

create table public.bays (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  bay_code text not null,
  is_monitored boolean not null default false,
  unique (site_id, bay_code)
);

create table public.observations (
  id uuid primary key default gen_random_uuid(),
  bay_id uuid not null references public.bays(id) on delete cascade,
  occupancy public.occupancy_state not null,
  source public.observation_source not null,
  device_status public.device_health not null,
  observed_at timestamptz not null,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index observations_latest_by_bay on public.observations (bay_id, observed_at desc, received_at desc);

-- A current UI-friendly state. The 60-second threshold is deliberately visible and easy to change.
create view public.current_bay_status as
select
  b.id as bay_id,
  b.site_id,
  b.bay_code,
  b.is_monitored,
  o.source,
  o.observed_at,
  o.received_at,
  o.device_status,
  case
    when o.id is null then 'unknown'::public.occupancy_state
    when o.observed_at < now() - interval '60 seconds' then 'unknown'::public.occupancy_state
    when o.device_status in ('offline', 'unreliable') then 'unknown'::public.occupancy_state
    else o.occupancy
  end as display_occupancy,
  case
    when o.id is null then false
    when o.observed_at < now() - interval '60 seconds' then false
    when o.device_status in ('offline', 'unreliable') then false
    else true
  end as is_fresh
from public.bays b
left join lateral (
  select * from public.observations
  where bay_id = b.id
  order by observed_at desc, received_at desc
  limit 1
) o on true;

alter table public.sites enable row level security;
alter table public.amenities enable row level security;
alter table public.bays enable row level security;
alter table public.observations enable row level security;

-- Demo users may read. There is intentionally no browser write policy for observations.
-- RLS policies do not replace database grants, so explicitly remove default client privileges.
revoke all on public.sites, public.amenities, public.bays, public.observations from anon, authenticated;
grant select on public.sites, public.amenities, public.bays, public.observations to anon, authenticated;
create policy "Public can read demo sites" on public.sites for select using (true);
create policy "Public can read demo amenities" on public.amenities for select using (true);
create policy "Public can read demo bays" on public.bays for select using (true);
create policy "Public can read demo observations" on public.observations for select using (true);

insert into public.sites (site_code, name, access_details, is_demo, verified_at)
values
  ('stop-a', 'Stop A - physical model', 'Demonstration model: one monitored bay.', true, now()),
  ('stop-b', 'Stop B - simulated', 'Demonstration data: simulated availability.', true, now());

insert into public.amenities (site_id, amenity_code, verified_at)
select s.id, a.amenity_code, now()
from public.sites s
cross join (values ('shelter'::text), ('charging'::text)) as a(amenity_code);

insert into public.bays (site_id, bay_code, is_monitored)
select id, 'bay-1', site_code = 'stop-a'
from public.sites;

insert into public.observations (bay_id, occupancy, source, device_status, observed_at)
select b.id,
       'available'::public.occupancy_state,
       case when s.site_code = 'stop-a' then 'measured'::public.observation_source else 'simulated'::public.observation_source end,
       'online'::public.device_health,
       now()
from public.bays b
join public.sites s on s.id = b.site_id;
