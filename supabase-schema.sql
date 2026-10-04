create table if not exists public.planning_config (
  id text primary key,
  config jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.planning_config enable row level security;

create policy "public can read planning"
  on public.planning_config
  for select
  to anon, authenticated
  using (true);

create policy "public can write planning"
  on public.planning_config
  for insert
  to anon, authenticated
  with check (true);

create policy "public can update planning"
  on public.planning_config
  for update
  to anon, authenticated
  using (true)
  with check (true);

insert into public.planning_config (id, config)
values ('main', '{}'::jsonb)
on conflict (id) do nothing;
