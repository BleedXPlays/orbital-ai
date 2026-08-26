alter table public.user_reports
  add column if not exists user_photo_url text not null default '';

alter table public.user_reports
  drop constraint if exists user_reports_photo_url_length;

alter table public.user_reports
  add constraint user_reports_photo_url_length
  check (char_length(user_photo_url) <= 2048);
