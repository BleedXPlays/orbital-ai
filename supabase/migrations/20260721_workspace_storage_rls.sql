-- OrbitalAI uses Firebase Authentication through Supabase Third-Party Auth.
-- Enable the Firebase integration in the Supabase dashboard before applying
-- this migration. The expected Firebase project ID is orbital-ai-957b9.

create or replace function public.is_orbital_firebase_user()
returns boolean
language sql
stable
security invoker
set search_path = public, auth
as $$
  select
    coalesce((auth.jwt() ->> 'iss') =
      'https://securetoken.google.com/orbital-ai-957b9', false)
    and coalesce((auth.jwt() ->> 'aud') = 'orbital-ai-957b9', false)
    and nullif(auth.jwt() ->> 'sub', '') is not null;
$$;

revoke all on function public.is_orbital_firebase_user() from public;
grant execute on function public.is_orbital_firebase_user()
  to anon, authenticated, service_role;

alter table public.workspaces enable row level security;
alter table public.workspaces force row level security;

create index if not exists workspaces_user_id_idx
  on public.workspaces (user_id);

grant select, insert, update, delete on public.workspaces
  to anon, authenticated;

drop policy if exists "Orbital Firebase identity restriction"
  on public.workspaces;
create policy "Orbital Firebase identity restriction"
  on public.workspaces
  as restrictive
  for all
  to anon, authenticated
  using (
    (select public.is_orbital_firebase_user()) is true
    and user_id = (select auth.jwt() ->> 'sub')
  )
  with check (
    (select public.is_orbital_firebase_user()) is true
    and user_id = (select auth.jwt() ->> 'sub')
  );

drop policy if exists "Users manage only their workspace"
  on public.workspaces;
create policy "Users manage only their workspace"
  on public.workspaces
  for all
  to anon, authenticated
  using (
    user_id = (select auth.jwt() ->> 'sub')
  )
  with check (
    user_id = (select auth.jwt() ->> 'sub')
  );

insert into storage.buckets (id, name, public)
values
  ('orbital-attachments', 'orbital-attachments', false),
  ('orbital-files', 'orbital-files', false)
on conflict (id) do update
set public = false;

drop policy if exists "Orbital storage identity restriction"
  on storage.objects;
create policy "Orbital storage identity restriction"
  on storage.objects
  as restrictive
  for all
  to anon, authenticated
  using (
    bucket_id not in ('orbital-attachments', 'orbital-files')
    or (
      (select public.is_orbital_firebase_user()) is true
      and (storage.foldername(name))[1] =
        (select auth.jwt() ->> 'sub')
    )
  )
  with check (
    bucket_id not in ('orbital-attachments', 'orbital-files')
    or (
      (select public.is_orbital_firebase_user()) is true
      and (storage.foldername(name))[1] =
        (select auth.jwt() ->> 'sub')
    )
  );

drop policy if exists "Users read only their Orbital files"
  on storage.objects;
create policy "Users read only their Orbital files"
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id in ('orbital-attachments', 'orbital-files')
    and (select public.is_orbital_firebase_user()) is true
    and (storage.foldername(name))[1] =
      (select auth.jwt() ->> 'sub')
  );

drop policy if exists "Users upload only their Orbital files"
  on storage.objects;
create policy "Users upload only their Orbital files"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id in ('orbital-attachments', 'orbital-files')
    and (select public.is_orbital_firebase_user()) is true
    and (storage.foldername(name))[1] =
      (select auth.jwt() ->> 'sub')
  );

drop policy if exists "Users update only their Orbital files"
  on storage.objects;
create policy "Users update only their Orbital files"
  on storage.objects
  for update
  to anon, authenticated
  using (
    bucket_id in ('orbital-attachments', 'orbital-files')
    and (select public.is_orbital_firebase_user()) is true
    and (storage.foldername(name))[1] =
      (select auth.jwt() ->> 'sub')
  )
  with check (
    bucket_id in ('orbital-attachments', 'orbital-files')
    and (select public.is_orbital_firebase_user()) is true
    and (storage.foldername(name))[1] =
      (select auth.jwt() ->> 'sub')
  );

drop policy if exists "Users delete only their Orbital files"
  on storage.objects;
create policy "Users delete only their Orbital files"
  on storage.objects
  for delete
  to anon, authenticated
  using (
    bucket_id in ('orbital-attachments', 'orbital-files')
    and (select public.is_orbital_firebase_user()) is true
    and (storage.foldername(name))[1] =
      (select auth.jwt() ->> 'sub')
  );
