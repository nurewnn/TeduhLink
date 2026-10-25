# TeduhLink

TeduhLink helps a rider compare participating rest stops using listed amenities and clearly labelled current bay observations.

## Demo promise

The demo has two test stops:

- **Stop A** has one physical, sensor-monitored model bay.
- **Stop B** is a clearly labelled simulated stop.

The app must distinguish listed amenities, measured readings, simulated readings, and unknown/stale information. Availability is an observation, not a reservation.

## Repository map

- `docs/data-contract.md` - shared payload and status rules for every team member.
- `supabase/migrations/001_initial_schema.sql` - database tables, policies, and demo seed data.
- `.env.example` - local configuration template; never commit real keys.

## Setup plan

1. Create a Supabase project owned by the team.
2. Run `supabase/migrations/001_initial_schema.sql` in its SQL Editor.
3. Copy `.env.example` to `.env.local` and add the project's **URL** and **publishable key**.
4. Build the interface against the seeded stops first.
5. Later, send hardware observations through a protected backend or Supabase Edge Function. Do not put a service-role key in the ESP32 firmware or frontend.

## Team decisions still required

- Who is allowed to create sensor observations?
- What freshness period should turn an old reading into `unknown`? The starter schema uses 60 seconds.
- Does a bay reading represent a specific bay only? For this prototype, yes.
- Which party verifies or updates listed stop amenities?
