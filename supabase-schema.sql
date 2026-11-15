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

-- Imagens do editor (fundo e blocos de imagem). Execute no SQL Editor do Supabase.
-- Atenção: como o restante do projeto, a escrita é pública enquanto não houver autenticação real.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('call-media', 'call-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "public can read call media"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'call-media');

create policy "public can upload call media"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'call-media');
