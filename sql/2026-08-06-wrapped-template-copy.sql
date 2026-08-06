-- Admin-editable copy for the built-in /wrapped slides (intro, numbers,
-- time, route, top moment, photo stats, receipt). Single global row, same
-- shape as global_admin_settings: public read, authenticated write.
-- Run this once in the Supabase SQL editor.

create table if not exists wrapped_template_copy (
  id          text primary key default 'global',
  content     jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- updated_at maintenance
create or replace function wrapped_template_copy_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists wrapped_template_copy_touch on wrapped_template_copy;
create trigger wrapped_template_copy_touch
  before update on wrapped_template_copy
  for each row execute function wrapped_template_copy_touch_updated_at();

-- Row level security: anyone can read (the /wrapped page is public), only
-- an authenticated (admin) session can write.
alter table wrapped_template_copy enable row level security;

drop policy if exists wrapped_template_copy_select on wrapped_template_copy;
create policy wrapped_template_copy_select on wrapped_template_copy
  for select using (true);

drop policy if exists wrapped_template_copy_write on wrapped_template_copy;
create policy wrapped_template_copy_write on wrapped_template_copy
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
