create table if not exists public.ride_ready_athletes (
  athlete_id bigint primary key,
  username text,
  firstname text,
  lastname text,
  access_token text not null,
  refresh_token text not null,
  expires_at bigint not null,
  profile_json jsonb,
  imported_bikes_json jsonb default '[]'::jsonb,
  app_state_json jsonb,
  last_sync_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists ride_ready_athletes_updated_at_idx
  on public.ride_ready_athletes (updated_at desc);
