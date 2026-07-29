create table if not exists public.password_reset_challenges (
  id uuid primary key,
  email text not null,
  otp_hash text not null,
  ip_hash text not null,
  attempt_count integer not null default 0,
  expires_at timestamptz not null,
  verified_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists password_reset_challenges_email_created_idx
  on public.password_reset_challenges (email, created_at desc);

create index if not exists password_reset_challenges_ip_created_idx
  on public.password_reset_challenges (ip_hash, created_at desc);

alter table public.password_reset_challenges enable row level security;

revoke all on table public.password_reset_challenges from anon, authenticated;
grant select, insert, update, delete
  on table public.password_reset_challenges
  to service_role;
