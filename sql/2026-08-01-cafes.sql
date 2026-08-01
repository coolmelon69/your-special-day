-- Cafés: shared checklist + ratings. See
-- docs/superpowers/specs/2026-08-01-cafes-checklist-design.md
-- Run this once in the Supabase SQL editor.

create table if not exists cafe_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  icon        text,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists cafe_places (
  id              uuid primary key default gen_random_uuid(),
  category_id     uuid not null references cafe_categories(id) on delete cascade,
  name            text not null,
  status          text not null default 'wishlist'
                    check (status in ('wishlist','visited')),
  area            text,
  price_band      smallint check (price_band between 1 and 3),
  visited_on      date,
  note            text,
  photo_url       text,
  would_return    boolean,
  rating_him      numeric(2,1) check (rating_him between 0.5 and 5),
  rating_her      numeric(2,1) check (rating_her between 0.5 and 5),
  gmaps_place_id  text,
  gmaps_url       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists cafe_places_category_id_idx on cafe_places (category_id);

-- updated_at maintenance
create or replace function cafe_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists cafe_places_touch on cafe_places;
create trigger cafe_places_touch
  before update on cafe_places
  for each row execute function cafe_touch_updated_at();

-- Row level security: anyone may read, only a signed-in user may write.
alter table cafe_categories enable row level security;
alter table cafe_places     enable row level security;

drop policy if exists cafe_categories_read on cafe_categories;
create policy cafe_categories_read on cafe_categories
  for select using (true);

drop policy if exists cafe_places_read on cafe_places;
create policy cafe_places_read on cafe_places
  for select using (true);

drop policy if exists cafe_categories_write on cafe_categories;
create policy cafe_categories_write on cafe_categories
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists cafe_places_write on cafe_places;
create policy cafe_places_write on cafe_places
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
