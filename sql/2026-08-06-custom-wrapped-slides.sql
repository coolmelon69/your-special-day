-- Custom /wrapped slides: admin-authored message slides (awards, dedications,
-- inside jokes) shown before the closing share slide. See
-- docs/superpowers/specs/2026-08-06-wrapped-custom-slides-design.md
-- Run this once in the Supabase SQL editor.

create table if not exists custom_wrapped_slides (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  eyebrow     text not null,
  icon        text,
  heading     text not null,
  emphasis    text,
  body        text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists custom_wrapped_slides_user_id_idx
  on custom_wrapped_slides (user_id);

-- updated_at maintenance
create or replace function custom_wrapped_slides_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists custom_wrapped_slides_touch on custom_wrapped_slides;
create trigger custom_wrapped_slides_touch
  before update on custom_wrapped_slides
  for each row execute function custom_wrapped_slides_touch_updated_at();

-- Row level security: a user reads and writes only their own rows.
alter table custom_wrapped_slides enable row level security;

drop policy if exists custom_wrapped_slides_select on custom_wrapped_slides;
create policy custom_wrapped_slides_select on custom_wrapped_slides
  for select using (auth.uid() = user_id);

drop policy if exists custom_wrapped_slides_write on custom_wrapped_slides;
create policy custom_wrapped_slides_write on custom_wrapped_slides
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
