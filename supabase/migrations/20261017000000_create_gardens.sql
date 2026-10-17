-- Saved gardens: one row per garden, owned by one user. The plan column
-- holds the same shape the browser save uses ({schemaVersion, garden,
-- inventory}); the app validates it on load, so the database only bounds
-- its size.
create table public.gardens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  plan jsonb not null check (pg_column_size(plan) < 1000000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index gardens_user_id_idx on public.gardens (user_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger gardens_set_updated_at
before update on public.gardens
for each row execute function public.set_updated_at();

-- Each user sees and changes only their own gardens.
alter table public.gardens enable row level security;

create policy "Users read their own gardens"
on public.gardens for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users create their own gardens"
on public.gardens for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users update their own gardens"
on public.gardens for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users delete their own gardens"
on public.gardens for delete to authenticated
using ((select auth.uid()) = user_id);
